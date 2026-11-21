// New interview: device checks (left) + interview settings (right).
// On large screens the page fits the window: the device column stays still and only the
// settings card scrolls, so the camera preview and mic test are always in view.

import { Camera, CheckCircle2, Mic } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { Avatar } from '@/components/Brand'
import { Button, Card, ErrorAlert } from '@/components/ui'
import { buttonClass, fieldClass } from '@/components/ui/styles'
import { formatNextSlot, useInterviewAllowance, useStartInterview } from '@/features/interview/api'
import { LevelPicker } from '@/components/LevelPicker'
import { PageHero } from '@/components/PageHero'
import { DURATIONS, FORMAT_TONE, INTERVIEWERS, INTERVIEW_TYPES, POPULAR_TOPICS } from '@/features/interview/constants'
import { useAudioLevel, useUserMedia } from '@/features/interview/media'
import { useSelectedInterviewResume } from '@/features/resume/api'
import { InterviewResumePicker } from '@/features/resume/InterviewResumePicker'
import type { ExperienceLevel, InterviewerId, InterviewType } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Page heading per format: once the format is chosen, the page talks about THAT interview. */
const HEADINGS: Record<InterviewType | 'any', { title: string; text: string }> = {
  any: { title: 'Set the stage.', text: 'Check your devices, choose what to practise, and begin when you are ready.' },
  topic: { title: 'Which subject today?', text: 'Name a topic and your level. The interviewer plans questions around it and follows up on your answers.' },
  resume: { title: 'Talk through your own work.', text: 'Questions come from the projects and experience on your resume. Choose the level and the length.' },
  jd: { title: 'Rehearse for the role.', text: 'Paste the job description. Questions mix what the role asks for with what your resume shows.' },
  hr: { title: 'Tell me about yourself.', text: 'Behavioral questions on teamwork, challenges and motivation, judged on clear, structured stories.' },
}

/** One settings group: a small numbered serif label, then the controls. */
function Field({ step, label, children }: { step?: number; label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 flex items-baseline gap-2 text-[13px] font-medium text-ink-900">
        {step != null && <span className="font-serif text-brand-600">0{step}</span>}
        {label}
      </p>
      {children}
    </div>
  )
}

/** Selected state = a sage fill and outline (the same language as Question prep's tiles);
 * the rest stays quiet on paper. */
const optionClass = (active: boolean) => cn(
  'border transition-[border-color,background-color,box-shadow] duration-200',
  active ? 'border-transparent bg-brand-50 shadow-soft ring-2 ring-brand-500/40' : 'border-ink-200 bg-white/50 hover:border-ink-300 hover:bg-white',
)

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('rounded-full px-3.5 py-1.5 text-[13px]', optionClass(active), active ? 'font-medium text-ink-900' : 'text-ink-700')}>
      {children}
    </button>
  )
}

function MicTest({ stream }: { stream: MediaStream | null }) {
  const level = useAudioLevel(stream)
  const [heard, setHeard] = useState(false)
  if (level > 0.25 && !heard) setHeard(true) // derived "sticky" check: the mic clearly works
  const bars = 28
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={cn('flex size-9 items-center justify-center rounded-full', heard ? 'bg-success-50 text-success-700' : 'bg-brand-50 text-brand-700')}>
          {heard ? <CheckCircle2 className="size-4" /> : <Mic className="size-4" />}
        </span>
        <div>
          <p className="text-sm font-medium">{heard ? 'Microphone is working' : 'Test your microphone'}</p>
          <p className="text-sm text-ink-500">Say: &ldquo;I&apos;m ready for my practice interview.&rdquo;</p>
        </div>
      </div>
      <div className="mt-4 flex h-6 items-end gap-1" role="meter" aria-label="Microphone level"
        aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(level.toFixed(2))}>
        {Array.from({ length: bars }, (_, i) => (
          <div key={i} className={cn('flex-1 rounded-full transition-colors duration-75', i / bars < level ? 'bg-brand-600' : 'bg-ink-200')}
            style={{ height: `${30 + (i % 4) * 18}%` }} />
        ))}
      </div>
    </Card>
  )
}

export function NewInterviewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const start = useStartInterview()
  const allowance = useInterviewAllowance()
  const noneLeft = allowance.data?.remaining === 0
  const { stream, status } = useUserMedia(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  // The dashboard links here with ?type=resume (etc.): the format is already chosen, so the
  // page asks only for the details of THAT format (the picker stays hidden unless "Change").
  const preselected = INTERVIEW_TYPES.find((t) => t.id === params.get('type'))
  const [type, setType] = useState<InterviewType>(() => preselected?.id ?? 'topic')
  const [pickType, setPickType] = useState(!preselected)
  // Interview resumes are their own list (not the ATS checker's), uploaded right here.
  const [resumeId, setResumeId] = useState<string | null>(null)
  const resume = useSelectedInterviewResume(resumeId)
  const [topic, setTopic] = useState(params.get('topic') ?? '')
  const [subtopics, setSubtopics] = useState('')
  const [jdText, setJdText] = useState('')
  const [experience, setExperience] = useState<ExperienceLevel>('intermediate')
  const [duration, setDuration] = useState<5 | 10 | 15>(5)
  const [interviewer, setInterviewer] = useState<InterviewerId>('maya')

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  const needsResume = (type === 'resume' || type === 'jd') && !resume
  const missing = (type === 'topic' && !topic.trim()) || (type === 'jd' && !jdText.trim()) || needsResume

  function onStart() {
    start.mutate(
      {
        interview_type: type,
        topic: topic.trim() || null,
        subtopics: subtopics.split(',').map((s) => s.trim()).filter(Boolean),
        experience,
        duration_minutes: duration,
        interviewer,
        jd_text: type === 'jd' ? jdText : null,
        resume_id: type === 'resume' || type === 'jd' ? (resume?.id ?? null) : null,
      },
      { onSuccess: (session) => navigate(`/interviews/${session.id}`) },
    )
  }

  const micOk = status === 'ready' || status === 'audio-only'
  const chosen = INTERVIEW_TYPES.find((t) => t.id === type) ?? INTERVIEW_TYPES[0]
  const heading = pickType ? HEADINGS.any : HEADINGS[type]
  let step = 1
  return (
    // lg: exactly the space below the top bar (4rem + 1px border) minus the shell padding (2 x 4rem).
    // lg: the page fills the window below the top bar (4rem + 1px border). It pulls in 2rem of
    // the shell's top and bottom padding (-my-8), so 2 x 2rem remain: more height for the
    // camera preview and the settings card, which matter more here than a big title.
    <div className="lg:-my-8 lg:flex lg:h-[calc(100dvh-8rem-1px)] lg:flex-col">
      {/* compact dark hero (the same band as every app page): this page is a tool, the title
          only needs to orient */}
      <div className="mb-8 lg:mb-6 lg:shrink-0">
        <PageHero compact eyebrow={pickType ? 'New interview' : `New interview · ${chosen.label}`}
          title={heading.title} description={heading.text} />
      </div>
      <div className="grid gap-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_1fr] lg:gap-10">
        {/* ---------------- devices: never scrolls */}
        <div className="space-y-5 lg:flex lg:min-h-0 lg:flex-col lg:space-y-0 lg:gap-5 lg:overflow-hidden">
          {/* the preview takes whatever height is left (cropping like a video call), so the
              column always fits the window without scrolling */}
          <Card className="overflow-hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <div className="relative aspect-video bg-[#1d1c19] lg:aspect-auto lg:min-h-[120px] lg:flex-1">
              <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 size-full -scale-x-100 object-cover" />
              {status === 'ready' && (
                <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-ink-900/70 px-2.5 py-1 text-xs font-medium text-paper">
                  <span className="size-1.5 rounded-full bg-brand-300" /> Preview
                </span>
              )}
              {status !== 'ready' && (
                <p className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-ink-300">
                  <Camera className="size-6" />
                  {status === 'audio-only' ? 'No camera. Voice answers still work.'
                    : status === 'denied' ? 'Camera and microphone are blocked. Allow them in the address bar; the interview is voice only.'
                    : status === 'unavailable' ? 'No camera or microphone found. Connect a microphone to answer by voice.'
                    : 'Requesting camera and microphone…'}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 px-5 py-4 text-sm">
              <span className={cn('flex items-center gap-2', status === 'ready' ? 'text-success-700' : 'text-ink-500')}>
                <Camera className="size-4" /> {status === 'ready' ? 'Camera ready' : 'No camera (optional)'}
              </span>
              <span className={cn('flex items-center gap-2', micOk ? 'text-success-700' : 'text-warning-700')}>
                <Mic className="size-4" /> {micOk ? 'Microphone ready' : 'Microphone needed'}
              </span>
            </div>
          </Card>
          <div className="lg:shrink-0"><MicTest stream={stream} /></div>
          {/* tips are the first thing to go on short windows, so the column never needs scrolling */}
          <ul className="space-y-2 px-1 text-sm text-ink-500 lg:shrink-0 lg:[@media(max-height:1000px)]:hidden">
            {['Find a quiet spot; headphones help.', 'Pause for two seconds to finish an answer.', 'Your camera never leaves this browser.'].map((t) => (
              <li key={t} className="flex gap-3"><span className="mt-2 size-1 shrink-0 rounded-full bg-ink-400" />{t}</li>
            ))}
          </ul>
        </div>

        {/* ---------------- settings: scrolls inside the card; Start stays pinned below */}
        <Card className="flex flex-col lg:min-h-0">
          <div className="space-y-8 p-6 sm:p-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {pickType ? (
            <Field step={step++} label="Interview type">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* each format in its own colour (sage, clay, mist, honey), as on the dashboard */}
                {INTERVIEW_TYPES.map((t) => {
                  const on = type === t.id
                  const tone = FORMAT_TONE[t.id]
                  return (
                    <button key={t.id} type="button" onClick={() => setType(t.id)} aria-pressed={on}
                      className={cn('flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-[border-color,background-color,box-shadow] duration-200',
                        on ? cn('border-transparent shadow-soft ring-2', tone.soft, tone.ring) : 'border-ink-200 bg-white/50 hover:border-ink-300 hover:bg-white')}>
                      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', tone.chip, on && 'bg-white')}><t.icon className="size-4" aria-hidden /></span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{t.label}</span>
                        <span className="mt-0.5 block text-xs text-ink-500">{t.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Field>
          ) : (
            // Format already chosen on the dashboard: a one-line summary, not the picker again.
            <div className={cn('flex items-center gap-4 rounded-2xl px-4 py-3', FORMAT_TONE[type].soft)}>
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full bg-white', FORMAT_TONE[type].chip, 'bg-white')}><chosen.icon className="size-4" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">Format</p>
                <p className="mt-0.5 font-serif text-lg font-semibold">{chosen.label}</p>
              </div>
              <button type="button" onClick={() => setPickType(true)}
                className="text-xs text-ink-500 underline decoration-ink-300 underline-offset-4 transition-colors hover:text-ink-900">
                Change
              </button>
            </div>
          )}

          {(type === 'resume' || type === 'jd') && (
            <Field step={step++} label="Your resume">
              <p className="-mt-1 mb-3 text-xs text-ink-500">
                {type === 'jd' ? 'Questions connect the job’s requirements to your experience.' : 'The interviewer asks about the projects and roles on it.'}
                {' '}Kept separate from the ATS checker.
              </p>
              <InterviewResumePicker selectedId={resume?.id ?? null} onSelect={setResumeId} />
            </Field>
          )}

          <Field step={step++} label={type === 'topic' ? 'Topic' : type === 'hr' ? 'Target role (optional)' : 'Focus topic (optional)'}>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120} aria-label="Topic"
                placeholder={type === 'hr' ? 'e.g. Graduate Engineer Trainee' : type === 'topic' ? 'e.g. Transformers' : 'e.g. Substation protection, or leave empty'}
                className={cn(fieldClass, 'py-2 text-[13px]')} />
              {type === 'topic' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {POPULAR_TOPICS.map((t) => (
                    <button key={t} type="button" onClick={() => setTopic(t)}
                      className="rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">{t}</button>
                  ))}
                </div>
              )}
              {type === 'topic' && (
                <input value={subtopics} onChange={(e) => setSubtopics(e.target.value)} aria-label="Sub-topics"
                  placeholder="Sub-topics, optional and comma separated" className={cn(fieldClass, 'mt-3 py-2 text-[13px]')} />
              )}
            </Field>

          {type === 'jd' && (
            <Field step={step++} label="Job description">
              <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} rows={6} aria-label="Job description"
                placeholder="Paste the job description you are preparing for" className={cn(fieldClass, 'text-[13px] leading-relaxed')} />
            </Field>
          )}

          {/* the same difficulty cards as Question prep */}
          <Field step={step++} label="Difficulty">
            <LevelPicker value={experience} onChange={setExperience} />
          </Field>
          <Field step={step++} label="Duration">
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => <Choice key={d} active={duration === d} onClick={() => setDuration(d)}>{d} min</Choice>)}
            </div>
          </Field>

          <Field step={step++} label="Interviewer">
            <div className="grid gap-3 sm:grid-cols-3">
              {INTERVIEWERS.map((p) => (
                <button key={p.id} type="button" onClick={() => setInterviewer(p.id)} aria-pressed={interviewer === p.id}
                  className={cn('flex items-center gap-3 rounded-2xl p-3 text-left', optionClass(interviewer === p.id))}>
                  <Avatar persona={p.id} size="sm" />
                  <span className="leading-tight">
                    <span className="block text-[13px] font-medium">{p.name}</span>
                    <span className="block text-[11px] text-ink-500">{p.style}</span>
                  </span>
                </button>
              ))}
            </div>
          </Field>

          </div>
          <div className="space-y-4 border-t border-ink-200 px-6 py-5 sm:px-10">
          {start.error && <ErrorAlert message={start.error.message} />}
          {/* 5 a day: a free Groq key's daily quota carries about 5 fifteen-minute interviews. */}
          {allowance.data && (
            <p className={cn('text-sm', noneLeft ? 'rounded-xl bg-warning-50 px-3.5 py-2.5 text-warning-700' : 'text-ink-500')}>
              {noneLeft
                ? <>You've done {allowance.data.limit} interviews in the last 24 hours, the most a free Groq key can carry in a day.{allowance.data.next_available_at && <> Your next one is available <strong>{formatNextSlot(allowance.data.next_available_at)}</strong>.</>}</>
                : <><strong className="font-medium text-ink-700">{allowance.data.remaining} of {allowance.data.limit}</strong> interviews left in the last 24 hours (up to 15 minutes each).</>}
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
            {needsResume && <p className="mr-auto text-sm text-warning-700">Add a resume above to continue.</p>}
            <Link to="/dashboard" className={buttonClass('ghost')}>Cancel</Link>
            {/* The camera is optional; answers are voice only, so the room asks for the mic if it is missing. */}
            <Button onClick={onStart} loading={start.isPending} disabled={missing || noneLeft || status === 'idle' || status === 'pending'} className="px-7 py-3">
              Start interview
            </Button>
          </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
