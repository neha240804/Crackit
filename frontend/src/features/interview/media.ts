// Browser media for the interview:
//  - camera/mic access (with mic-only fallback)
//  - mic level meter
//  - interviewer voice: natural server voice (Groq Orpheus) with a ranked browser fallback
//  - AnswerRecorder: recording + voice activity detection (auto-submit after 2 s of silence)
//  - LiveCaptions: progressive subtitles via the browser's speech recognition

import { useEffect, useState } from 'react'

import { tokenStore } from '@/lib/api'
import type { InterviewerId } from '@/lib/types'

// ================================================================== camera + mic
// ready = camera + mic, audio-only = mic but no camera, denied/unavailable = answer by typing
export type MediaStatus = 'idle' | 'pending' | 'ready' | 'audio-only' | 'denied' | 'unavailable'

export function useUserMedia(enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<MediaStatus>('idle')

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let acquired: MediaStream | null = null
    queueMicrotask(() => !cancelled && setStatus('pending'))
    // Browser-side cleanup makes speech recognition noticeably more accurate.
    const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    const devices = navigator.mediaDevices
    if (!devices) {
      queueMicrotask(() => !cancelled && setStatus('unavailable'))
      return
    }
    const accept = (s: MediaStream, ok: MediaStatus) => {
      acquired = s
      if (cancelled) return s.getTracks().forEach((t) => t.stop())
      setStream(s)
      setStatus(ok)
    }
    devices
      // 16:9 to match the landscape video tile, so very little of the frame is cropped.
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: 16 / 9 }, audio })
      .then((s) => accept(s, 'ready'))
      // Camera busy/missing/blocked? Voice answers only need the microphone.
      .catch(() => devices.getUserMedia({ audio }).then((s) => accept(s, 'audio-only')))
      .catch((err: DOMException) => {
        if (!cancelled) setStatus(err.name === 'NotAllowedError' ? 'denied' : 'unavailable')
      })
    return () => {
      cancelled = true
      acquired?.getTracks().forEach((t) => t.stop()) // camera light off on unmount
    }
  }, [enabled])

  return { stream, status }
}

// ================================================================== audio analysis
function rms(analyser: AnalyserNode, buffer: Float32Array<ArrayBuffer>) {
  analyser.getFloatTimeDomainData(buffer)
  let sum = 0
  for (const v of buffer) sum += v * v
  return Math.sqrt(sum / buffer.length)
}

/** Analyser on the speech band only (90-4000 Hz): ignores fan hum, rumble and hiss. */
function createSpeechAnalyser(stream: MediaStream) {
  const ctx = new AudioContext()
  const source = ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()))
  const highpass = new BiquadFilterNode(ctx, { type: 'highpass', frequency: 90 })
  const lowpass = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 4000 })
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  source.connect(highpass).connect(lowpass).connect(analyser)
  return { ctx, analyser, buffer: new Float32Array(analyser.fftSize) }
}

/** Live microphone loudness from 0 to 1 (for meters and "listening" bars). */
export function useAudioLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0)
  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return
    const { ctx, analyser, buffer } = createSpeechAnalyser(stream)
    let frame = 0
    const tick = () => {
      setLevel(Math.min(1, rms(analyser, buffer) * 8))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      void ctx.close()
    }
  }, [stream])
  return level
}

// ================================================================== interviewer voice
/**
 * Split into chunks of whole sentences (~220 chars): few pauses, no Chrome cut-offs.
 * firstMax keeps the FIRST chunk short (one sentence) so the voice starts quickly; the server
 * voice generates faster than real time, so later chunks are ready before they're needed.
 */
function chunkText(text: string, max = 220, firstMax = max): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    const limit = chunks.length === 0 ? firstMax : max
    if (current && (current + s).length > limit) {
      chunks.push(current.trim())
      current = ''
    }
    current += s
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

/** Clauses: split at every sentence end and comma/semicolon/colon (never mid-word). */
function phrases(text: string): string[] {
  return (text.match(/[^.!?,;:]+[.!?,;:]*\s*/g) ?? [text]).filter((p) => p.trim())
}

/**
 * Fallback split for the voice when the server didn't send its own (it normally does, see
 * speech_chunks() in backend/app/services/tts.py, which follows the same rule).
 *
 * Boundaries are only sentence ends and clause punctuation, NEVER between two words. An
 * earlier version split long clauses between words to keep chunks small, and whenever a
 * chunk was late the voice paused mid-phrase ("...look like on a | learning curve?").
 * Gaps are now prevented by buffering before playback starts (canStartGapless).
 */
export function speechChunks(text: string, max = 140): string[] {
  const chunks: string[] = []
  let current = ''
  const flush = () => {
    if (current.trim()) chunks.push(current.trim())
    current = ''
  }
  for (const clause of phrases(text)) {
    const endsSentence = /[.!?]\s*$/.test(clause)
    if (current && (current + clause).length > max) flush()
    current += clause
    if (endsSentence) flush() // one sentence per chunk (long ones split at commas above)
  }
  // A tiny trailing fragment ("curve?") sounds clipped on its own: attach it to the last chunk.
  if (chunks.length && current.trim() && current.trim().length < 12) {
    chunks[chunks.length - 1] += ` ${current.trim()}`
    current = ''
  }
  flush()
  return chunks
}

// --- server voice (local Kokoro-82M): natural; disabled for the session after the first 503
let serverVoice: 'unknown' | 'on' | 'off' = 'unknown'
let serverVoiceReason = ''

async function fetchSpeech(text: string, interviewer: InterviewerId, signal: AbortSignal) {
  const res = await fetch('/api/v1/interviews/tts', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStore.get() ?? ''}` },
    body: JSON.stringify({ text, interviewer }),
  })
  if (res.status === 503) {
    serverVoice = 'off'
    serverVoiceReason = ((await res.json()) as { detail?: string }).detail ?? ''
    throw new Error('server voice unavailable')
  }
  if (!res.ok) throw new Error(`tts ${res.status}`)
  return res.arrayBuffer()
}

// One shared Web Audio context: clips are scheduled back to back on its clock, so there is
// no start-up seam between sentences (separate <audio> elements each add a small delay).
let audioCtx: AudioContext | null = null

/** Create/resume the audio context. Call synchronously inside a click handler. */
export function unlockAudio() {
  audioCtx ??= new AudioContext()
  void audioCtx.resume().catch(() => undefined)
}

// Live estimates of the voice engine's speed on THIS machine right now, learned from each
// chunk: seconds of generation per second of audio, and characters spoken per second.
let genPerAudioSec = 0.9
let charsPerSec = 15
const SENTENCE_BREATH_S = 0.6 // a pause this short BETWEEN sentences sounds like a breath
const MAX_START_WAIT_MS = 3000 // never hold the first word back longer than this

/**
 * Would playback that starts NOW finish without stalling?
 * bufferedSec: audio already generated and waiting; pendingChars: lengths of the chunks
 * still being generated (in order). Each must be ready before the audio ahead of it runs
 * out, allowing a short natural breath between sentences.
 */
export function canStartGapless(
  bufferedSec: number,
  pendingChars: number[],
  genPerAudio: number,
  charsPerSecond: number,
  breathSec = SENTENCE_BREATH_S,
) {
  let generatedBy = 0 // seconds from now until chunk j is ready
  let neededBy = bufferedSec // seconds from now until playback reaches chunk j
  for (const chars of pendingChars) {
    const audio = chars / charsPerSecond
    generatedBy += audio * genPerAudio
    if (generatedBy > neededBy + breathSec) return false
    neededBy += audio
  }
  return true
}

/**
 * Speak with the server voice, never pausing mid-sentence.
 *
 * Chunks are fetched one after another (the server is usually already generating them).
 * Playback starts only when the prediction says every later chunk will be ready before it
 * is needed, using the measured generation speed. So if the laptop is busy, the interviewer
 * waits a moment before speaking instead of stopping halfway through a sentence.
 * Returns the index of the first chunk NOT spoken (chunks.length when all played).
 */
async function speakServer(
  chunks: string[],
  interviewer: InterviewerId,
  signal: AbortSignal,
  onChunkStart?: (index: number) => void,
) {
  audioCtx ??= new AudioContext()
  const ac = audioCtx
  await ac.resume().catch(() => undefined)
  if (ac.state !== 'running') return 0 // audio blocked by the browser: use the browser voice

  const ready: (AudioBuffer | null | undefined)[] = chunks.map(() => undefined) // null = failed
  let wake: () => void = () => {}
  // Wake on progress, and re-check every 100 ms anyway: if a chunk lands between our check
  // and this call, its wake() would be missed and the loop could otherwise wait forever.
  const changed = () =>
    new Promise<void>((r) => {
      wake = r
      setTimeout(r, 100)
    })

  void (async () => {
    for (let i = 0; i < chunks.length; i++) {
      const t0 = performance.now()
      try {
        const buffer = await ac.decodeAudioData(await fetchSpeech(chunks[i], interviewer, signal))
        const gen = (performance.now() - t0) / 1000
        genPerAudioSec = 0.6 * genPerAudioSec + 0.4 * (gen / buffer.duration)
        charsPerSec = 0.6 * charsPerSec + 0.4 * (chunks[i].length / buffer.duration)
        ready[i] = buffer
      } catch {
        ready[i] = null
        wake()
        return
      }
      wake()
    }
  })()

  // 1) Decide when to start.
  const waitStart = performance.now()
  for (;;) {
    if (signal.aborted) return chunks.length
    if (ready[0] === null) return 0
    let prefix = 0
    let buffered = 0
    while (prefix < chunks.length && ready[prefix]) {
      buffered += (ready[prefix] as AudioBuffer).duration
      prefix++
    }
    if (prefix === chunks.length || ready.includes(null)) break
    if (prefix > 0) {
      const pendingChars = chunks.slice(prefix).map((c) => c.length)
      const safe = canStartGapless(buffered, pendingChars, genPerAudioSec, charsPerSec)
      if (safe || performance.now() - waitStart > MAX_START_WAIT_MS) break
    }
    await changed()
  }

  // 2) Play: schedule each chunk to start exactly when the previous one ends.
  let endAt = ac.currentTime
  let last: AudioBufferSourceNode | null = null
  const sources: AudioBufferSourceNode[] = []
  const stopAll = () => sources.forEach((s) => s.stop())
  signal.addEventListener('abort', stopAll)
  for (let i = 0; i < chunks.length; i++) {
    while (ready[i] === undefined && !signal.aborted) await changed()
    if (signal.aborted) return chunks.length
    const buffer = ready[i]
    if (!buffer) {
      // generation failed part-way: finish what's scheduled, then hand the rest over
      await new Promise((r) => setTimeout(r, Math.max(0, (endAt - ac.currentTime) * 1000)))
      return i
    }
    const source = ac.createBufferSource()
    source.buffer = buffer
    source.connect(ac.destination)
    const startAt = Math.max(endAt, ac.currentTime + 0.02)
    source.start(startAt)
    // Tell the UI exactly when this chunk becomes audible (transcript follows the voice).
    const index = i
    window.setTimeout(() => !signal.aborted && onChunkStart?.(index), Math.max(0, (startAt - ac.currentTime) * 1000))
    endAt = startAt + buffer.duration
    sources.push(source)
    last = source
  }
  if (last) await new Promise<void>((r) => ((last as AudioBufferSourceNode).onended = () => r()))
  signal.removeEventListener('abort', stopAll)
  return chunks.length
}

// --- browser voice: rank the available voices; prefer neural "Natural"/"Online", then Google
const FEMALE = /female|neerja|aria|jenny|sonia|libby|natasha|clara|emma|ava|michelle|zira|heera|samantha|susan|hazel|google us english/i
const MALE = /\bmale|prabhat|guy|ryan|william|davis|andrew|brian|christopher|eric|david|ravi|mark|george|daniel|thomas/i
const WANTS_FEMALE: Record<InterviewerId, boolean> = { maya: true, sara: true, arjun: false }

function scoreVoice(v: SpeechSynthesisVoice, interviewer: InterviewerId) {
  let score = 0
  if (/natural|neural|online/i.test(v.name)) score += 60 // modern neural voices: most human
  else if (/google/i.test(v.name)) score += 40 // Chrome's network voices: clear, natural pacing
  if (/^en-(IN|US|GB)/i.test(v.lang)) score += 10
  if (/^en-IN/i.test(v.lang)) score += 5
  const female = FEMALE.test(v.name)
  const male = !female && MALE.test(v.name)
  if (WANTS_FEMALE[interviewer] ? female : male) score += 20
  return score
}

export function pickBrowserVoice(interviewer: InterviewerId) {
  const english = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang))
  return english.sort((a, b) => scoreVoice(b, interviewer) - scoreVoice(a, interviewer))[0]
}

function speakBrowser(
  text: string,
  interviewer: InterviewerId,
  signal: AbortSignal,
  onChunkStart?: (spokenSoFar: string) => void,
) {
  return new Promise<void>((resolve) => {
    if (!('speechSynthesis' in window)) return resolve()
    speechSynthesis.cancel()
    const voice = pickBrowserVoice(interviewer)
    const chunks = chunkText(text)
    let i = 0
    const next = () => {
      if (signal.aborted || i >= chunks.length) return resolve()
      const u = new SpeechSynthesisUtterance(chunks[i++])
      if (voice) u.voice = voice
      u.lang = voice?.lang ?? 'en-US'
      u.rate = 1.12 // a confident conversational pace; 1.0 sounds slow and flat
      u.pitch = 1
      const soFar = chunks.slice(0, i).join(' ')
      u.onstart = () => onChunkStart?.(soFar)
      u.onend = next
      u.onerror = next
      speechSynthesis.speak(u)
    }
    signal.addEventListener('abort', () => {
      speechSynthesis.cancel()
      resolve()
    })
    next()
  })
}

/**
 * Speak as the interviewer. Resolves when finished or aborted.
 * serverChunks: the split the server returned with the turn (and is already generating);
 * requesting exactly those finds them ready or in progress.
 * onProgress: called with the text spoken so far, each time a new part becomes audible, so
 * the transcript shows words as she says them instead of seconds before.
 */
export async function speak(
  text: string,
  interviewer: InterviewerId,
  signal: AbortSignal,
  serverChunks?: string[],
  onProgress?: (spokenSoFar: string) => void,
) {
  if (!text.trim()) return
  let prefix = '' // what the server voice already said, if it hands over part-way
  if (serverVoice !== 'off') {
    const chunks = serverChunks?.length ? serverChunks : speechChunks(text)
    const spoken = await speakServer(chunks, interviewer, signal, (i) =>
      onProgress?.(chunks.slice(0, i + 1).join(' ')),
    )
    if (signal.aborted) return
    if (spoken === chunks.length) {
      serverVoice = 'on'
      return
    }
    // The server voice failed part-way: say only the rest with the browser voice.
    prefix = chunks.slice(0, spoken).join(' ')
    text = chunks.slice(spoken).join(' ')
  }
  await speakBrowser(text, interviewer, signal, (soFar) =>
    onProgress?.(`${prefix} ${soFar}`.trim()),
  )
}

export function voiceDescription(interviewer: InterviewerId) {
  if (serverVoice === 'on') return { natural: true, label: 'Natural voice' }
  const v = 'speechSynthesis' in window ? pickBrowserVoice(interviewer) : undefined
  return { natural: false, label: v ? `Browser voice: ${v.name}` : 'Browser voice', reason: serverVoiceReason }
}

// ================================================================== recording + VAD
export interface RecordingResult {
  blob: Blob
  seconds: number
}

export interface VadState {
  speaking: boolean // speech detected right now
  heard: boolean // any speech so far in this answer
  silenceMs: number // silence since the last speech (0 while speaking or before speech)
}

/**
 * Records one answer and detects when it's finished:
 *  - band-pass filtered energy, so steady noise (fans, hiss) doesn't count as speech
 *  - hysteresis: speech must stay above a higher threshold for 150 ms to start, and only
 *    needs a lower threshold to continue, so the detector doesn't flicker
 *  - an adaptive noise floor, updated whenever nobody is speaking
 *  - markActivity(): live captions recognising words also counts as speech
 * Auto-submits after `silenceMs` of silence, once at least ~0.4 s of speech was heard.
 */
export class AnswerRecorder {
  readonly done: Promise<RecordingResult | null>
  private lastVoice = 0
  private heard = false
  private speechMs = 0
  private stopMode: 'submit' | 'discard' = 'submit'
  private stopNow: () => void = () => {}
  private snapshotNow: () => Promise<Blob> = async () => new Blob()

  /** The audio recorded so far (used to transcribe speculatively during a pause). */
  snapshot() {
    return this.snapshotNow()
  }

  constructor(
    stream: MediaStream,
    opts: { silenceMs?: number; maxMs?: number; onState?: (s: VadState) => void } = {},
  ) {
    const { silenceMs = 2000, maxMs = 180_000, onState } = opts
    this.done = new Promise((resolve) => {
      const recorder = new MediaRecorder(new MediaStream(stream.getAudioTracks()))
      const chunks: Blob[] = []
      const { ctx, analyser, buffer } = createSpeechAnalyser(stream)
      const started = performance.now()
      let noise = 0
      let noiseSamples = 0
      let aboveFor = 0
      let inSpeech = false
      let timer = 0
      const recent: number[] = [] // last 1.5 s of levels, for the steady-noise guard
      const STEADY_WINDOW_MS = 1500

      let onData: (() => void) | null = null
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data)
        onData?.()
      }
      // Audio so far as a playable file: pieces arrive every 250 ms and the first one holds
      // the WebM header, so "all pieces so far" is a valid (if unfinished) recording.
      this.snapshotNow = async () => {
        if (recorder.state === 'recording') {
          const flushed = new Promise<void>((r) => (onData = r))
          recorder.requestData() // flush the newest audio into a piece
          await Promise.race([flushed, new Promise((r) => setTimeout(r, 300))])
          onData = null
        }
        return new Blob(chunks, { type: recorder.mimeType })
      }
      recorder.onstop = () => {
        window.clearInterval(timer)
        void ctx.close()
        const seconds = (performance.now() - started) / 1000
        const keep = this.stopMode === 'submit' && this.heard
        resolve(keep ? { blob: new Blob(chunks, { type: recorder.mimeType }), seconds } : null)
      }
      this.stopNow = () => recorder.state !== 'inactive' && recorder.stop()

      const STEP = 50
      timer = window.setInterval(() => {
        const now = performance.now()
        const level = rms(analyser, buffer)
        if (now - started < 400) {
          noise += level // calibrate to the room for the first 0.4 s
          noiseSamples++
          return
        }
        if (noiseSamples) {
          noise /= noiseSamples
          noiseSamples = 0
        }
        // Steady-noise guard: speech loudness pulses with syllables; a fan or AC that starts
        // mid-answer is flat. If "speech" has been flat for 1.5 s, it's noise: raise the floor.
        recent.push(level)
        if (recent.length > 30) recent.shift()
        if (inSpeech && recent.length === 30) {
          const mean = recent.reduce((a, b) => a + b, 0) / recent.length
          const sd = Math.sqrt(recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length)
          if (sd / mean < 0.12) {
            noise = mean
            inSpeech = false
            this.lastVoice = now - STEADY_WINDOW_MS // the flat stretch wasn't speech either
          }
        }

        const startThreshold = Math.max(0.012, noise * 3)
        const keepThreshold = Math.max(0.008, noise * 2)

        if (!inSpeech) {
          aboveFor = level > startThreshold ? aboveFor + STEP : 0
          if (aboveFor >= 150) {
            inSpeech = true
            this.heard = true
            this.lastVoice = now
          } else if (level < startThreshold) {
            noise = noise * 0.97 + level * 0.03 // slowly track the room's noise
          }
        } else if (level > keepThreshold) {
          this.lastVoice = now
          this.speechMs += STEP
        } else if (now - this.lastVoice > 250) {
          inSpeech = false // a pause, not necessarily the end
        }

        const silence = this.heard ? now - this.lastVoice : 0
        onState?.({ speaking: inSpeech && silence < 250, heard: this.heard, silenceMs: silence })
        if (this.heard && this.speechMs >= 400 && silence >= silenceMs) this.stopNow()
        if (now - started > maxMs) this.stopNow()
      }, STEP)

      recorder.start(250)
    })
  }

  /** External evidence of speech (e.g. live captions recognised words): resets the timer. */
  markActivity() {
    this.lastVoice = performance.now()
    this.heard = true
    this.speechMs = Math.max(this.speechMs, 400)
  }

  /** Manual "I'm done answering": submit now if anything was said. */
  finish() {
    this.stopMode = 'submit'
    this.heard = this.heard || this.speechMs > 0
    this.stopNow()
  }

  /** Discard this recording (typed answer instead, or the interview ended). */
  cancel() {
    this.stopMode = 'discard'
    this.stopNow()
  }
}

// ================================================================== live captions
interface RecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}
interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>
}
interface Recognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: RecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const liveCaptionsSupported = () => Boolean(recognitionCtor())

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim()

/**
 * Progressive subtitles while the candidate speaks (Chrome/Edge). Shows draft text only:
 * the transcript that is scored still comes from Whisper on the server.
 *
 * No duplicated words: every update REBUILDS the text from the recogniser's full result
 * list instead of appending the newest piece (appending is what usually repeats words).
 * Chrome ends recognition after a pause or about a minute; we restart it and carry the
 * finished text over.
 */
export class LiveCaptions {
  private rec: Recognition | null = null
  private committed = '' // final text from earlier recognition sessions
  private sessionFinal = '' // final text in the current session
  private stopped = false
  private wordCount = 0 // words recognised so far (to detect NEW speech)

  constructor(onUpdate: (finalText: string, interim: string) => void, onActivity: () => void) {
    const Ctor = recognitionCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-IN'
    rec.onresult = (e) => {
      let finals = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finals += ` ${r[0].transcript}`
        else interim += ` ${r[0].transcript}`
      }
      this.sessionFinal = tidy(finals)
      const final = tidy(`${this.committed} ${this.sessionFinal}`)
      onUpdate(final, tidy(interim))
      // Only NEW words count as speech activity. Chrome sends its final result ~0.5-1 s after
      // the speaker stops; treating that as activity restarted the 2 s silence timer, so
      // answers were really submitted after ~3 s.
      const words = tidy(`${final} ${interim}`).split(' ').filter(Boolean).length
      if (words > this.wordCount) {
        this.wordCount = words
        onActivity()
      }
    }
    rec.onend = () => {
      if (this.stopped) return
      this.committed = tidy(`${this.committed} ${this.sessionFinal}`)
      this.sessionFinal = ''
      try {
        rec.start()
      } catch {
        /* already restarting */
      }
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') this.stop()
    }
    this.rec = rec
    try {
      rec.start()
    } catch {
      this.rec = null
    }
  }

  /** Everything recognised so far (final parts only). */
  text() {
    return tidy(`${this.committed} ${this.sessionFinal}`)
  }

  stop() {
    this.stopped = true
    try {
      this.rec?.abort()
    } catch {
      /* not running */
    }
  }
}
