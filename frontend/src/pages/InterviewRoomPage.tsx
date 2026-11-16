// The live interview room: full-screen, hands-free voice conversation.
//
// Phase machine:
//   ready -> speaking (interviewer voice) -> listening (recorder + VAD + live captions)
//         -> processing (Whisper + interviewer agent) -> speaking ...
//   closing line -> ended -> report page.
// Mutable things the async loop needs (recorder, captions, abort controller, "ending" flag)
// live in refs; only what the screen shows lives in state.
//
// Layout: on large screens the room is exactly one screen tall and nothing in it changes
// size between turns (the transcript scrolls inside its panel; the footer has fixed-height
// slots). That keeps the camera tile, and so the camera framing, constant.

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Keyboard, Loader2, Mic, PhoneOff, Send, SkipForward, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Logo } from '@/components/Brand'
import { Spinner } from '@/components/ui'
import { ApiError } from '@/lib/api'
import type { InterviewMessage, InterviewSession, InterviewTurn } from '@/lib/types'
import { cn } from '@/lib/utils'

import {
  beginInterview,
  endInterview,
  sendAudioAnswer,
  sendTextAnswer,
  transcribeAudio,
  useInterview,
} from '@/features/interview/api'
import { INTERVIEWERS } from '@/features/interview/constants'
import {
  AnswerRecorder,
  LiveCaptions,
  liveCaptionsSupported,
  speak,
  unlockAudio,
  useAudioLevel,
  useUserMedia,
  voiceDescription,
  type VadState,
} from '@/features/interview/media'

type Phase = 'ready' | 'speaking' | 'listening' | 'processing' | 'ended' | 'error'
type TurnWithDeadline = InterviewTurn & { deadline_ms: number }

const SILENCE_MS = 2000 // auto-submit after this much silence
const SPECULATE_AFTER_MS = 900 // start transcribing early, during the pause

export function InterviewRoomPage() {
  const { id = '' } = useParams()
  const session = useInterview(id)
  if (session.isLoading) return <div className="min-h-screen bg-[#070b16]"><Spinner label="Loading interview…" /></div>
  if (session.isError || !session.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#070b16] text-ink-200">
        <p>{session.error?.message ?? 'Interview not found'}</p>
        <Link to="/dashboard" className="text-brand-200 underline">Back to dashboard</Link>
      </div>
    )
  }
  // key: a different interview gets a fresh Room (no state carried over).
  return <Room key={session.data.id} session={session.data} />
}

// ------------------------------------------------------------------ helpers
function useNow(intervalMs: number, initial: number) {
  const [now, setNow] = useState(initial)
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}

function useConnection() {
  // Round-trip time to our backend, refreshed every 10 s.
  return useQuery({
    queryKey: ['rtt'],
    queryFn: async () => {
      const t0 = performance.now()
      const res = await fetch('/api/v1/health', { cache: 'no-store' })
      if (!res.ok) throw new Error('down')
      return Math.round(performance.now() - t0)
    },
    refetchInterval: 10_000,
    retry: false,
  })
}

function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const NO_VAD: VadState = { speaking: false, heard: false, silenceMs: 0 }

// ------------------------------------------------------------------ room
function Room({ session }: { session: InterviewSession }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const persona = INTERVIEWERS.find((p) => p.id === session.config.interviewer) ?? INTERVIEWERS[0]
  const finished = session.status === 'completed'

  const { stream, status: mediaStatus } = useUserMedia(!finished)
  const level = useAudioLevel(stream)
  const videoRef = useRef<HTMLVideoElement>(null)
  const transcriptEnd = useRef<HTMLDivElement>(null)
  const connection = useConnection()
  // Clock starts at fetch time (deadline - remaining), never Date.now() during render.
  const now = useNow(500, session.deadline_ms - session.remaining_seconds * 1000)

  const [phase, setPhase] = useState<Phase>(finished ? 'ended' : 'ready')
  const [messages, setMessages] = useState<InterviewMessage[]>(session.messages)
  const [currentText, setCurrentText] = useState(session.current?.utterance ?? '')
  const [deadline, setDeadline] = useState(session.deadline_ms)
  // The clock runs only once the candidate pressed Start (server stores started_at).
  const [clockRunning, setClockRunning] = useState(Boolean(session.config.started_at))
  const [notice, setNotice] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [showTyping, setShowTyping] = useState(false)
  const [vad, setVad] = useState<VadState>(NO_VAD)
  const [live, setLive] = useState({ final: '', interim: '' }) // live captions of the answer
  // The interviewer line being spoken right now, growing as each part becomes audible
  // (null = not revealing; the transcript then shows only committed messages).
  const [speakingText, setSpeakingText] = useState<string | null>(null)
  const [voice, setVoice] = useState<{ natural: boolean; label: string } | null>(null)

  const abortRef = useRef<AbortController | null>(null) // current speech playback
  const recorderRef = useRef<AnswerRecorder | null>(null)
  const captionsRef = useRef<LiveCaptions | null>(null)
  const endingRef = useRef(false) // End pressed, or the page is unmounting

  const remaining = clockRunning ? Math.max(0, (deadline - now) / 1000) : session.remaining_seconds

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, phase, live, speakingText])

  // Leaving the page stops audio, recording and captions (the interview stays resumable).
  useEffect(
    () => () => {
      endingRef.current = true
      abortRef.current?.abort()
      recorderRef.current?.cancel()
      captionsRef.current?.stop()
      speechSynthesis.cancel()
    },
    [],
  )

  // Time up while answering: submit what's been said so far.
  useEffect(() => {
    if (remaining <= 0 && phase === 'listening') recorderRef.current?.finish()
  }, [remaining, phase])

  // ---------------------------------------------------------------- the voice loop
  /**
   * Speak one interviewer line. `isNew`: the line isn't in the transcript yet, so it is
   * revealed as she says it (and committed when she finishes or is skipped). The opening
   * greeting is already in the transcript from the server.
   */
  async function runTurn(utterance: string, done: boolean, chunks?: string[], kind?: string | null, isNew = true) {
    setCurrentText('')
    setSpeakingText(isNew ? '' : null)
    setPhase('speaking')
    const ctrl = new AbortController()
    abortRef.current = ctrl
    // chunks: the server's split of this line, which it has already started voicing
    await speak(utterance, persona.id, ctrl.signal, chunks, (spokenSoFar) => {
      setCurrentText(spokenSoFar)
      if (isNew) setSpeakingText(spokenSoFar)
    })
    setCurrentText(utterance)
    setSpeakingText(null)
    if (isNew) {
      setMessages((m) => [...m, { role: 'interviewer', text: utterance, kind: kind ?? null, duration_sec: null }])
    }
    setVoice(voiceDescription(persona.id))
    if (done) return finish()
    if (endingRef.current) return
    await listen()
  }

  function stopCapture() {
    captionsRef.current?.stop()
    captionsRef.current = null
    recorderRef.current = null
    setVad(NO_VAD)
  }

  async function listen() {
    setPhase('listening')
    setLive({ final: '', interim: '' })
    if (!stream || stream.getAudioTracks().length === 0) {
      setShowTyping(true) // no microphone: typing is the way to answer
      return
    }
    // Speculative transcription: after ~0.9 s of silence, send the audio so far to Whisper.
    // If the candidate stays quiet, the text is ready when the 2 s auto-submit fires, so
    // Whisper is no longer on the waiting path. `version` goes up whenever speech resumes,
    // which marks an earlier speculative result as stale.
    const spec = {
      version: 0,
      forVersion: -1,
      result: null as Promise<{ text: string; duration_sec: number | null }> | null,
    }
    let wasSpeaking = false
    let lastVad = NO_VAD
    const recorder = new AnswerRecorder(stream, {
      silenceMs: SILENCE_MS,
      onState: (s) => {
        setVad(s)
        lastVad = s
        if (s.speaking && !wasSpeaking) spec.version++
        wasSpeaking = s.speaking
        if (s.heard && !s.speaking && s.silenceMs >= SPECULATE_AFTER_MS && spec.forVersion !== spec.version) {
          spec.forVersion = spec.version
          spec.result = recorder.snapshot().then((blob) => transcribeAudio(session.id, blob))
          spec.result.catch(() => undefined) // a failed guess just means uploading normally
        }
      },
    })
    recorderRef.current = recorder
    captionsRef.current = new LiveCaptions(
      (final, interim) => setLive({ final, interim }),
      // Captions count as speech only while the audio itself is (near) speech; late final
      // results arriving after the pause must not restart the silence timer.
      () => {
        if (lastVad.silenceMs < 600) recorder.markActivity()
      },
    )
    const recording = await recorder.done
    const captionText = captionsRef.current?.text() ?? ''
    stopCapture()
    if (endingRef.current || !recording) return // ended, or discarded on purpose (typed / End)

    // If live captions caught words but the server heard nothing, use the captions.
    const fallback = captionText ? () => sendTextAnswer(session.id, captionText) : undefined
    if (spec.result && spec.forVersion === spec.version) {
      const guess = await spec.result.catch(() => null)
      if (guess?.text.trim()) {
        await submit(() => sendTextAnswer(session.id, guess.text, guess.duration_sec), fallback)
        return
      }
    }
    await submit(() => sendAudioAnswer(session.id, recording.blob), fallback)
  }

  async function submit(send: () => Promise<TurnWithDeadline>, fallback?: () => Promise<TurnWithDeadline>) {
    setPhase('processing')
    setNotice(null)
    try {
      let turn: TurnWithDeadline
      try {
        turn = await send()
      } catch (err) {
        if (fallback && err instanceof ApiError && err.status === 422) turn = await fallback()
        else throw err
      }
      // Only the answer goes in now; the interviewer's line appears as she speaks it
      // (runTurn), not seconds before her voice starts.
      setMessages((m) => [
        ...m,
        { role: 'candidate', text: turn.transcript ?? '', kind: 'answer', duration_sec: null },
      ])
      setLive({ final: '', interim: '' })
      setDeadline(turn.deadline_ms)
      setClockRunning(true) // the server starts it on the first answer at the latest
      await runTurn(turn.utterance ?? '', turn.done, turn.speech_chunks, turn.kind)
    } catch (err) {
      setLive({ final: '', interim: '' })
      if (err instanceof ApiError && err.status === 422) {
        setNotice("I couldn't hear that clearly. Please try again.")
        return listen()
      }
      setPhase('error')
      setNotice(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  function finish() {
    setPhase('ended')
    // The cached session still says 'active' (staleTime: Infinity): mark it stale so the
    // report page refetches it instead of showing "still in progress".
    void queryClient.invalidateQueries({ queryKey: ['interview', session.id] })
    void queryClient.invalidateQueries({ queryKey: ['interviews'] })
    navigate(`/interviews/${session.id}/report`)
  }

  // ---------------------------------------------------------------- controls
  async function onStart() {
    // Browsers only allow audio to start from a user gesture: unlock it synchronously here,
    // before any await.
    unlockAudio()
    endingRef.current = false
    setPhase('processing')
    let chunks: string[] | undefined
    try {
      // The clock starts now, not when the interview was created (setup can take a while).
      const turn = await beginInterview(session.id)
      setDeadline(turn.deadline_ms)
      setClockRunning(true)
      chunks = turn.speech_chunks // the server has been generating the greeting since load
    } catch {
      // Not fatal: the server also starts the clock on the first answer.
    }
    void runTurn(currentText, false, chunks, null, false) // greeting: already in the transcript
  }

  function onDoneAnswering() {
    recorderRef.current?.finish() // manual fallback for the auto-submit
  }

  function onSkipSpeech() {
    abortRef.current?.abort() // stop speaking; runTurn continues to listen()
  }

  function onSendTyped() {
    const text = typed.trim()
    if (!text) return
    recorderRef.current?.cancel() // discard the parallel voice recording
    setTyped('')
    void submit(() => sendTextAnswer(session.id, text))
  }

  async function onEnd() {
    if (!window.confirm('End the interview now? You will get feedback on the answers so far.')) return
    endingRef.current = true
    abortRef.current?.abort()
    recorderRef.current?.cancel()
    speechSynthesis.cancel()
    setPhase('processing')
    try {
      const turn = await endInterview(session.id)
      await runTurn(turn.utterance ?? '', true, turn.speech_chunks, 'closing')
    } catch {
      finish()
    }
  }

  // ---------------------------------------------------------------- view
  const speaking = phase === 'speaking'
  const listening = phase === 'listening'
  const liveText = `${live.final} ${live.interim}`.trim()
  const clockTone = remaining < 20 ? 'text-red-400' : remaining < 60 ? 'text-amber-300' : 'text-white'
  const countdown = listening && vad.heard && !vad.speaking ? Math.max(0, SILENCE_MS - vad.silenceMs) : null
  const caption = listening && liveText ? liveText : phase !== 'ready' ? currentText : ''

  return (
    <div className="flex min-h-screen flex-col bg-[#070b16] text-white lg:h-screen lg:overflow-hidden">
      {/* header */}
      <header className="flex shrink-0 items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-2">
          <Logo dark />
          <span className="hidden text-xs text-ink-400 sm:inline">· {session.title}</span>
        </div>
        <div className={cn('mx-auto flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 tabular-nums', clockTone)}
          role="timer" aria-label="Time remaining">
          <Clock className="size-4" /> {formatClock(remaining)}
        </div>
        <div className="text-right text-xs">
          <p className={cn('flex items-center justify-end gap-1.5', connection.isError ? 'text-red-400' : 'text-emerald-400')}>
            <span className={cn('size-2 rounded-full', connection.isError ? 'bg-red-400' : 'bg-emerald-400')} />
            {connection.isError ? 'Server unreachable' : 'Connected'}
          </p>
          {connection.data != null && <p className="text-ink-400">Latency {connection.data} ms</p>}
        </div>
      </header>

      {/* stage: fixed height on large screens; nothing inside grows the row */}
      <main className="grid min-h-0 flex-1 gap-4 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
        {/* candidate tile: always 16:9 like the camera, so the frame is never cropped into a square */}
        <div className="flex min-h-0 items-center">
        <section className={cn('relative aspect-video max-h-full w-full overflow-hidden rounded-2xl border-2 bg-ink-900 transition-colors',
          listening ? 'border-emerald-400/80' : 'border-white/10')} aria-label="Your camera">
          <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 size-full -scale-x-100 object-cover" />
          {mediaStatus !== 'ready' && (
            <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink-400">
              {mediaStatus === 'audio-only' ? 'Camera off: answering by voice'
                : mediaStatus === 'denied' || mediaStatus === 'unavailable' ? 'No microphone: answer by typing below.'
                : 'Starting camera…'}
            </p>
          )}
          <span className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-xs">
            You
            {listening && (
              <span className="flex h-3 items-end gap-0.5" aria-hidden>
                {[0.4, 0.7, 1, 0.7, 0.4].map((f, i) => (
                  <span key={i} className="w-0.5 rounded-full bg-emerald-400 transition-all duration-75"
                    style={{ height: `${Math.max(15, Math.min(100, level * f * 140))}%` }} />
                ))}
              </span>
            )}
          </span>
          {caption && (
            <p className={cn('absolute right-3 bottom-3 left-3 line-clamp-2 rounded-xl px-3 py-2 text-sm backdrop-blur',
              listening && liveText ? 'bg-emerald-950/70' : 'bg-black/60')} aria-live="polite">
              {/* Show the end of long live captions, like TV subtitles */}
              {listening && liveText ? liveText.slice(-160) : caption}
            </p>
          )}
        </section>
        </div>

        {/* interviewer tile */}
        <div className="flex min-h-0 items-center">
        <section className={cn('relative flex aspect-video max-h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2',
          'bg-[radial-gradient(circle_at_50%_40%,#1d3b8a_0%,#0b1430_55%,#070b16_100%)] transition-colors',
          speaking ? 'border-brand-500 shadow-[0_0_40px_-8px] shadow-brand-500' : 'border-white/10')} aria-label="Interviewer">
          <div className="relative">
            {speaking && <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/30" />}
            <div className={cn('relative flex size-28 items-center justify-center rounded-full bg-gradient-to-br text-4xl font-semibold transition-transform duration-300',
              persona.color, speaking && 'scale-105')}>
              {persona.name[0]}
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold">{persona.name}</p>
          <p className="text-sm text-ink-200">{persona.style} · AI interviewer</p>
          {session.config.topic && (
            <span className="mt-3 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">{session.config.topic}</span>
          )}
          <p className="absolute bottom-4 text-xs text-ink-400">
            {speaking ? 'Speaking…' : phase === 'processing' ? 'Thinking…' : listening ? 'Listening to you' : ''}
          </p>
          {voice && (
            <p className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-ink-400" title={voice.label}>
              <Volume2 className="size-3" /> {voice.natural ? 'Natural voice' : 'Browser voice'}
            </p>
          )}
        </section>
        </div>

        {/* transcript: scrolls inside; never grows the layout */}
        <aside className="flex h-80 min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] lg:h-full" aria-label="Live transcript">
          <p className="shrink-0 border-b border-white/10 px-4 py-3 text-sm font-semibold">Live transcript</p>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('rounded-xl px-3 py-2 text-sm',
                m.role === 'interviewer' ? 'bg-brand-500/15' : 'ml-6 bg-white/[0.06]')}>
                <p className="mb-0.5 text-[10px] font-medium tracking-wide text-ink-400 uppercase">
                  {m.role === 'interviewer' ? persona.name : 'You'}
                </p>
                {m.text}
              </div>
            ))}
            {speaking && speakingText !== null && (
              <div className="rounded-xl border border-brand-500/40 bg-brand-500/15 px-3 py-2 text-sm" aria-live="polite">
                <p className="mb-0.5 text-[10px] font-medium tracking-wide text-ink-400 uppercase">{persona.name} · speaking</p>
                {speakingText || <span className="text-ink-400 italic">…</span>}
              </div>
            )}
            {(listening || phase === 'processing') && liveText && (
              <div className="ml-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm" aria-live="polite">
                <p className="mb-0.5 text-[10px] font-medium tracking-wide text-emerald-300 uppercase">
                  You · {phase === 'processing' ? 'finalising…' : 'live'}
                </p>
                {live.final}{' '}
                <span className="text-ink-400 italic">{live.interim}</span>
              </div>
            )}
            {phase === 'processing' && (
              <p className="flex items-center gap-2 text-xs text-ink-400"><Loader2 className="size-3 animate-spin" /> Transcribing and thinking…</p>
            )}
            <div ref={transcriptEnd} />
          </div>
        </aside>
      </main>

      {/* controls: fixed-height slots so the stage above never resizes */}
      <footer className="shrink-0 px-6 pt-3 pb-4">
        <div className="flex h-6 items-center justify-center text-sm" role="status">
          {countdown !== null ? (
            <span className="flex items-center gap-2 text-emerald-300">
              <span className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-emerald-400 transition-[width] duration-75"
                  style={{ width: `${100 - (countdown / SILENCE_MS) * 100}%` }} />
              </span>
              Sending in {(countdown / 1000).toFixed(1)}s. Keep talking to continue.
            </span>
          ) : notice ? (
            <span className="text-amber-300">{notice}</span>
          ) : listening && !liveCaptionsSupported() && stream ? (
            <span className="text-ink-400">Live captions need Chrome or Edge. Your answer is still transcribed when you finish.</span>
          ) : null}
        </div>
        <div className="mt-2 flex h-11 items-center justify-center">
          {showTyping && listening && (
            <form onSubmit={(e) => { e.preventDefault(); onSendTyped() }} className="flex w-full max-w-2xl gap-2">
              <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your answer…" aria-label="Typed answer"
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none" />
              <button type="submit" className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700">
                <Send className="size-4" /> Send
              </button>
            </form>
          )}
        </div>
        <div className="mt-2 flex h-12 flex-wrap items-center justify-center gap-3">
          {phase === 'ready' && (
            <button onClick={() => void onStart()} disabled={mediaStatus === 'pending'}
              className="rounded-full bg-brand-600 px-8 py-3 font-medium shadow-lg shadow-brand-600/30 hover:bg-brand-700 disabled:opacity-60">
              {session.messages.length > 1 ? 'Resume interview' : 'Start interview'}
            </button>
          )}
          {speaking && (
            <button onClick={onSkipSpeech} className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm hover:bg-white/5">
              <SkipForward className="size-4" /> Skip to my answer
            </button>
          )}
          {listening && stream && (
            <button onClick={onDoneAnswering}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-medium shadow-lg shadow-emerald-600/30 hover:bg-emerald-700">
              <Mic className="size-4" /> I&apos;m done answering
            </button>
          )}
          {phase === 'processing' && (
            <span className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm text-ink-200">
              <Loader2 className="size-4 animate-spin" /> Thinking…
            </span>
          )}
          {phase === 'error' && (
            <button onClick={() => void listen()} className="rounded-full bg-brand-600 px-6 py-3 text-sm font-medium">Try again</button>
          )}
          {phase === 'ended' && (
            <Link to={`/interviews/${session.id}/report`} className="rounded-full bg-brand-600 px-6 py-3 text-sm font-medium">View report</Link>
          )}
          {listening && !showTyping && (
            <button onClick={() => setShowTyping(true)} className="flex items-center gap-2 rounded-full px-4 py-3 text-sm text-ink-200 hover:bg-white/5">
              <Keyboard className="size-4" /> Type instead
            </button>
          )}
          {!['ended', 'ready'].includes(phase) && (
            <button onClick={onEnd} disabled={phase === 'processing'}
              className="flex items-center gap-2 rounded-full border border-red-400/60 px-6 py-3 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-40">
              <PhoneOff className="size-4" /> End
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-ink-400">
          Answer out loud. After 2 seconds of silence your answer is sent automatically. Your camera stays on your device.
          {liveCaptionsSupported() && ' Live captions are produced by your browser’s speech service.'}
        </p>
      </footer>
    </div>
  )
}
