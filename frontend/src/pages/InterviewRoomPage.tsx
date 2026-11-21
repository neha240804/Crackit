// The live interview room: full-screen, hands-free voice conversation.
//
// Phase machine:
//   ready -> speaking (interviewer voice) -> listening (recorder + VAD + live captions)
//         -> processing (Whisper + interviewer agent) -> speaking ...
//   closing line -> ended -> report page.
// Mutable things the async loop needs (recorder, captions, abort controller, "ending" flag)
// live in refs; only what the screen shows lives in state.
//
// Layout: a "stage", not a video-call grid. The interviewer sits in the centre and the
// conversation reads as captions under them; your camera is a small self-view in the
// corner (fixed size, so its framing never changes); the transcript is a drawer you can
// open. The room is exactly one screen tall; answers are voice only (no typing).

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Languages, Loader2, Mic, PhoneOff, ScrollText, SkipForward, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Avatar, Logo } from '@/components/Brand'
import { Spinner } from '@/components/ui'
import { ApiError } from '@/lib/api'
import type { InterviewMessage, InterviewSession, InterviewTurn, VoiceEngine } from '@/lib/types'
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
import { EndFeedback } from '@/features/interview/EndFeedback'
import {
  AnswerRecorder,
  LiveCaptions,
  liveCaptionsSupported,
  speak,
  unlockAudio,
  useAudioLevel,
  useUserMedia,
  voiceDescription,
  type SpokenPart,
  type VadState,
} from '@/features/interview/media'

type Phase = 'ready' | 'speaking' | 'listening' | 'processing' | 'ended' | 'error'
type TurnWithDeadline = InterviewTurn & { deadline_ms: number }

const SILENCE_MS = 2000 // auto-submit after this much silence
const SPECULATE_AFTER_MS = 900 // start transcribing early, during the pause

export function InterviewRoomPage() {
  const { id = '' } = useParams()
  const session = useInterview(id)
  if (session.isLoading) return <div className="min-h-screen bg-[#171614]"><Spinner label="Loading interview…" /></div>
  if (session.isError || !session.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#171614] text-ink-200">
        <p>{session.error?.message ?? 'Interview not found'}</p>
        <Link to="/dashboard" className="text-brand-300 underline">Back to dashboard</Link>
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

/**
 * The interviewer's line, streamed word by word in step with the voice: everything said
 * before this part is shown in full, and this part's words appear evenly across the time
 * it takes to say them (the audio clip's length, from the player). Remount per part (key).
 */
function StreamingLine({ before, text, durationSec }: SpokenPart) {
  const words = text.split(/\s+/).filter(Boolean)
  // durationSec 0: the voice reported exactly what it has said (word-boundary events), so
  // show it all now; animating from the first word would flicker on every word.
  const [shown, setShown] = useState(durationSec > 0 ? 1 : words.length)
  useEffect(() => {
    if (durationSec <= 0) return
    const start = performance.now()
    const perWord = (durationSec * 1000) / Math.max(1, words.length)
    const timer = window.setInterval(() => {
      const n = Math.min(words.length, 1 + Math.floor((performance.now() - start) / perWord))
      setShown(n)
      if (n >= words.length) window.clearInterval(timer)
    }, 40)
    return () => window.clearInterval(timer)
  }, [durationSec, words.length])
  return (
    <>
      {before && `${before} `}
      {/* Plain text, no per-word fade-in: a fade that starts at opacity 0 left words invisible
          when the browser paused animations (seen in testing). The reveal itself is the effect. */}
      {words.slice(0, shown).join(' ')}
      <span className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] animate-pulse bg-brand-300 align-baseline" aria-hidden />
    </>
  )
}

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
  // A fresh interview's only message is the greeting, which hasn't been SPOKEN yet: keep it
  // off the screen (stage and transcript) until the interviewer actually says it.
  const fresh = session.messages.length <= 1
  const [messages, setMessages] = useState<InterviewMessage[]>(fresh ? [] : session.messages)
  const [currentText, setCurrentText] = useState(session.current?.utterance ?? '')
  const [deadline, setDeadline] = useState(session.deadline_ms)
  // The clock runs only once the candidate pressed Start (server stores started_at).
  const [clockRunning, setClockRunning] = useState(Boolean(session.config.started_at))
  const [notice, setNotice] = useState<string | null>(null)
  // Asked once, right as the interview ends (not when reopening a finished one).
  const [askFeedback, setAskFeedback] = useState(false)
  // Which voice the server says to use (browser by default); one voice per interview.
  const voiceRef = useRef<VoiceEngine>('browser')
  // Transcript drawer: open by default on wide screens, where it doesn't cover the stage.
  const [showTranscript, setShowTranscript] = useState(() => window.matchMedia('(min-width: 1280px)').matches)
  const [vad, setVad] = useState<VadState>(NO_VAD)
  const [live, setLive] = useState({ final: '', interim: '' }) // live captions of the answer
  // The interviewer line being spoken right now, growing as each part becomes audible
  // (null = not revealing; the transcript then shows only committed messages).
  const [speakingText, setSpeakingText] = useState<string | null>(null)
  const [voice, setVoice] = useState<{ natural: boolean; label: string } | null>(null)
  // The part of the line being spoken right now, streamed word by word under the portrait.
  const [streaming, setStreaming] = useState<(SpokenPart & { id: number }) | null>(null)

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
    await speak(utterance, persona.id, ctrl.signal, chunks, (part) => {
      const spokenSoFar = `${part.before} ${part.text}`.trim()
      setCurrentText(spokenSoFar)
      setStreaming({ ...part, id: Date.now() }) // the stage streams this part word by word
      if (isNew) setSpeakingText(spokenSoFar)
    }, voiceRef.current)
    setCurrentText(utterance)
    setStreaming(null)
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
    setLive({ final: '', interim: '' })
    if (!stream || stream.getAudioTracks().length === 0) {
      // Voice only: without a microphone there is no way to answer. The interview is saved,
      // so allowing the mic and reloading continues exactly here.
      setPhase('error')
      setNotice('Your microphone is off. Allow microphone access in the address bar, then reload to continue.')
      return
    }
    setPhase('listening')
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
    if (endingRef.current || !recording) return // ended, or discarded on purpose (End)

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
      voiceRef.current = turn.voice ?? 'server'
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
    setAskFeedback(true) // emoji feedback first; it then opens the report (or Skip does)
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
      voiceRef.current = turn.voice ?? 'server'
      chunks = turn.speech_chunks // the server has been generating the greeting since load
    } catch (err) {
      // The daily limit (429) is final: don't start talking. Anything else isn't fatal: the
      // server also starts the clock on the first answer.
      if (err instanceof ApiError && err.status === 429) {
        setPhase('error')
        setNotice(err.message)
        return
      }
    }
    void queryClient.invalidateQueries({ queryKey: ['interview-allowance'] })
    // Fresh: the greeting is revealed as it is spoken. Resumed: the last line is already in
    // the transcript, so it is only repeated aloud.
    void runTurn(currentText, false, chunks, null, fresh)
  }

  function onDoneAnswering() {
    recorderRef.current?.finish() // manual fallback for the auto-submit
  }

  function onSkipSpeech() {
    abortRef.current?.abort() // stop speaking; runTurn continues to listen()
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
      voiceRef.current = turn.voice ?? 'server'
      await runTurn(turn.utterance ?? '', true, turn.speech_chunks, 'closing')
    } catch {
      finish()
    }
  }

  // ---------------------------------------------------------------- view
  const speaking = phase === 'speaking'
  const listening = phase === 'listening'
  const liveText = `${live.final} ${live.interim}`.trim()
  const clockTone = remaining < 20 ? 'text-[#e39a86]' : remaining < 60 ? 'text-[#e2c07f]' : 'text-paper'
  const countdown = listening && vad.heard && !vad.speaking ? Math.max(0, SILENCE_MS - vad.silenceMs) : null
  // What the interviewer is saying (revealed as it is spoken), or the last thing they said.
  const interviewerLine = speaking && speakingText !== null ? speakingText : currentText
  const status = speaking ? `${persona.name} is speaking`
    : listening ? (vad.heard ? 'Listening' : 'Your turn: answer out loud')
    : phase === 'processing' ? 'Thinking'
    : phase === 'ended' ? 'Interview complete'
    : phase === 'error' ? 'Paused'
    : 'Ready when you are'

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#171614] text-paper">
      {/* ------------------------------------------------ top bar */}
      <header className="flex shrink-0 items-center gap-4 border-b border-white/[0.06] px-5 py-3.5 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Logo dark className="max-sm:[&>span:last-child]:hidden" />
          <span className="hidden truncate text-sm text-ink-400 md:inline">{session.title}</span>
        </div>
        <div className={cn('flex items-center gap-2 font-serif text-xl tabular-nums', clockTone)} role="timer" aria-label="Time remaining">
          <Clock className="size-4 opacity-60" /> {formatClock(remaining)}
        </div>
        <div className="flex flex-1 items-center justify-end gap-4 text-xs">
          <span className={cn('hidden items-center gap-1.5 sm:flex', connection.isError ? 'text-[#e39a86]' : 'text-ink-400')}
            title={connection.data != null ? `Latency ${connection.data} ms` : undefined}>
            <span className={cn('size-1.5 rounded-full', connection.isError ? 'bg-[#e39a86]' : 'bg-brand-300')} />
            {connection.isError ? 'Server unreachable' : 'Connected'}
          </span>
          <button type="button" onClick={() => setShowTranscript((v) => !v)} aria-pressed={showTranscript}
            className={cn('flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              showTranscript ? 'border-white/20 bg-white/[0.08] text-paper' : 'border-white/10 text-ink-300 hover:bg-white/[0.05]')}>
            <ScrollText className="size-4" /> <span className="hidden sm:inline">Transcript</span>
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* ------------------------------------------------ stage */}
        <main className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-6 pt-6 pb-40 sm:px-12">
          {/* interviewer presence: a quiet ring breathes while they speak */}
          <div className="relative flex items-center justify-center">
            <span className={cn('absolute size-44 rounded-full border transition-all duration-700',
              speaking ? 'scale-100 animate-[pulse_2.4s_ease-in-out_infinite] border-brand-300/40' : 'scale-90 border-transparent')} aria-hidden />
            <span className={cn('absolute size-36 rounded-full bg-brand-500/10 transition-all duration-500',
              speaking ? 'scale-100 opacity-100' : 'scale-75 opacity-0')} aria-hidden />
            <div className={cn('relative transition-transform duration-500', speaking && 'scale-[1.04]')}>
              <Avatar persona={persona.id} size="lg" />
            </div>
          </div>
          <p className="mt-6 font-serif text-2xl font-semibold">{persona.name}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-400" aria-live="polite">
            {phase === 'processing' && <Loader2 className="size-3.5 animate-spin" />}
            {status}
            {voice && !voice.natural && <span title={voice.label}>· browser voice</span>}
          </p>

          {/* the conversation, as captions */}
          <div className="mt-10 w-full max-w-3xl text-center">
            {/* Speech is transcribed as English (stt.py: language="en"), so answers in another
                language come out garbled: say it before the interview starts. */}
            {phase === 'ready' && (
              <p className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#e2c07f]/25 bg-[#e2c07f]/10 px-4 py-1.5 text-sm text-[#e2c07f]">
                <Languages className="size-4 shrink-0" aria-hidden /> Please speak English only during the interview
              </p>
            )}
            {speaking && streaming ? (
              // Streams word by word, in step with the voice.
              <p className="font-serif text-xl leading-snug text-paper sm:text-[1.75rem]">
                <StreamingLine key={streaming.id} before={streaming.before} text={streaming.text} durationSec={streaming.durationSec} />
              </p>
            ) : speaking || (phase === 'processing' && !interviewerLine) ? (
              // About to speak (voice still buffering): a quiet "typing" indicator.
              <p className="flex h-10 items-center justify-center gap-1.5" aria-label={`${persona.name} is about to speak`}>
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-2 animate-bounce rounded-full bg-brand-300/80" style={{ animationDelay: `${d}ms` }} />
                ))}
              </p>
            ) : interviewerLine && phase !== 'ready' && (
              <p className={cn('font-serif leading-snug transition-colors duration-300',
                listening || phase === 'processing' ? 'text-lg text-ink-400 sm:text-xl' : 'text-xl text-paper sm:text-[1.75rem]')}>
                {interviewerLine}
              </p>
            )}
            {(listening || phase === 'processing') && (
              <p className="mx-auto mt-6 min-h-[3.5rem] max-w-2xl text-lg leading-relaxed text-paper" aria-live="polite">
                {liveText ? (
                  <>{live.final.slice(-200)} <span className="text-ink-400">{live.interim}</span></>
                ) : listening ? (
                  <span className="text-ink-500">{liveCaptionsSupported() ? 'Your words will appear here as you speak.' : 'Speak your answer; it is transcribed when you pause.'}</span>
                ) : null}
              </p>
            )}
          </div>

          {/* self view: small, like a video call, never the focus */}
          <section className={cn('absolute top-4 right-4 aspect-video w-28 overflow-hidden rounded-2xl border bg-[#201f1c] shadow-[0_8px_30px_rgb(0_0_0/0.35)] transition-colors sm:top-auto sm:right-8 sm:bottom-28 sm:w-60',
            listening ? 'border-brand-300/60' : 'border-white/[0.08]')} aria-label="Your camera">
            <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 size-full -scale-x-100 object-cover" />
            {mediaStatus !== 'ready' && (
              <p className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-ink-400">
                {mediaStatus === 'audio-only' ? 'Camera off' : mediaStatus === 'pending' ? 'Starting camera…' : 'No camera'}
              </p>
            )}
            <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-[#171614]/75 px-2 py-0.5 text-[11px]">
              You
              {listening && (
                <span className="flex h-2.5 items-end gap-0.5" aria-hidden>
                  {[0.5, 0.8, 1, 0.8, 0.5].map((f, i) => (
                    <span key={i} className="w-0.5 rounded-full bg-brand-300 transition-all duration-75"
                      style={{ height: `${Math.max(20, Math.min(100, level * f * 140))}%` }} />
                  ))}
                </span>
              )}
            </span>
          </section>

          {/* ------------------------------------------------ control dock */}
          <footer className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-6">
            <div className="flex h-5 items-center text-sm" role="status">
              {countdown !== null ? (
                <span className="flex items-center gap-2.5 text-brand-300">
                  <span className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-brand-300 transition-[width] duration-75"
                      style={{ width: `${100 - (countdown / SILENCE_MS) * 100}%` }} />
                  </span>
                  Sending in {(countdown / 1000).toFixed(1)}s · keep talking to continue
                </span>
              ) : notice ? (
                <span className="max-w-xl text-center text-[#e2c07f]">{notice}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#201f1c] p-2 shadow-[0_10px_40px_rgb(0_0_0/0.35)]">
              {phase === 'ready' && (
                <button onClick={() => void onStart()} disabled={mediaStatus === 'pending'}
                  className="rounded-full bg-paper px-7 py-3 font-medium text-ink-900 transition-[background-color,transform] hover:-translate-y-px hover:bg-white disabled:opacity-60">
                  {session.messages.length > 1 ? 'Resume interview' : 'Start interview'}
                </button>
              )}
              {speaking && (
                <button onClick={onSkipSpeech} className="flex items-center gap-2 rounded-full px-5 py-3 text-sm text-ink-300 transition-colors hover:bg-white/[0.06] hover:text-paper">
                  <SkipForward className="size-4" /> Skip to my answer
                </button>
              )}
              {listening && stream && (
                <button onClick={onDoneAnswering}
                  className="flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-medium text-ink-900 transition-[background-color,transform] hover:-translate-y-px hover:bg-brand-300">
                  <Mic className="size-4" /> I&apos;m done
                </button>
              )}
              {phase === 'processing' && (
                <span className="flex items-center gap-2 px-5 py-3 text-sm text-ink-300">
                  <Loader2 className="size-4 animate-spin" /> Thinking…
                </span>
              )}
              {phase === 'error' && (
                stream
                  ? <button onClick={() => void listen()} className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink-900">Try again</button>
                  : <button onClick={() => window.location.reload()} className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink-900">Reload</button>
              )}
              {phase === 'ended' && (
                <Link to={`/interviews/${session.id}/report`} className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:bg-white">View report</Link>
              )}
              {!['ended', 'ready'].includes(phase) && (
                <>
                  <span className="mx-1 h-6 w-px bg-white/10" aria-hidden />
                  <button onClick={onEnd} disabled={phase === 'processing'} aria-label="End interview" title="End interview"
                    className="flex size-11 items-center justify-center rounded-full bg-[#e39a86]/15 text-[#e39a86] transition-colors hover:bg-[#e39a86]/25 disabled:opacity-40">
                    <PhoneOff className="size-4" />
                  </button>
                </>
              )}
            </div>
            <p className="hidden text-center text-xs text-ink-500 sm:block">
              Speak English only. Answer out loud; a 2-second pause sends your answer. Your camera never leaves this device.
            </p>
          </footer>
        </main>

        {askFeedback && (
          <EndFeedback sessionId={session.id} interviewer={persona.name}
            onDone={() => navigate(`/interviews/${session.id}/report`)} />
        )}

        {/* ------------------------------------------------ transcript drawer */}
        {showTranscript && (
          <aside className="absolute inset-0 z-10 flex min-h-0 flex-col border-l border-white/[0.06] bg-[#1c1b18] sm:static sm:w-[380px] sm:shrink-0" aria-label="Transcript">
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <p className="font-serif text-lg font-semibold">Transcript</p>
              <button type="button" onClick={() => setShowTranscript(false)} aria-label="Close transcript"
                className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-paper">
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {messages.map((m, i) => (
                <div key={i} className={cn('text-sm leading-relaxed', m.role === 'candidate' && 'border-l-2 border-brand-500/50 pl-4')}>
                  <p className="mb-1 text-[11px] font-medium tracking-[0.12em] text-ink-500 uppercase">
                    {m.role === 'interviewer' ? persona.name : 'You'}
                  </p>
                  <p className={m.role === 'interviewer' ? 'text-paper' : 'text-ink-300'}>{m.text}</p>
                </div>
              ))}
              {speaking && speakingText && (
                <div className="text-sm leading-relaxed">
                  <p className="mb-1 text-[11px] font-medium tracking-[0.12em] text-brand-300 uppercase">{persona.name} · speaking</p>
                  <p className="text-paper">{speakingText}</p>
                </div>
              )}
              {(listening || phase === 'processing') && liveText && (
                <div className="border-l-2 border-brand-500/50 pl-4 text-sm leading-relaxed">
                  <p className="mb-1 text-[11px] font-medium tracking-[0.12em] text-brand-300 uppercase">
                    You · {phase === 'processing' ? 'finalising' : 'live'}
                  </p>
                  <p className="text-ink-300">{live.final} <span className="text-ink-500">{live.interim}</span></p>
                </div>
              )}
              <div ref={transcriptEnd} />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
