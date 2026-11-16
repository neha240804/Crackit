// New interview: device checks (left) + interview settings (right), as a full page.

import { Camera, CheckCircle2, Headphones, Mic, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { Button, Card, ErrorAlert } from '@/components/ui'
import { useStartInterview } from '@/features/interview/api'
import { DURATIONS, EXPERIENCE, INTERVIEWERS, INTERVIEW_TYPES, POPULAR_TOPICS } from '@/features/interview/constants'
import { useAudioLevel, useUserMedia } from '@/features/interview/media'
import { useResumes } from '@/features/resume/api'
import type { ExperienceLevel, InterviewerId, InterviewType } from '@/lib/types'
import { cn } from '@/lib/utils'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink-700">{label}</p>
      {children}
    </div>
  )
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('rounded-lg border px-3 py-1.5 text-sm transition-colors',
        active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white hover:border-brand-300')}>
      {children}
    </button>
  )
}

const inputClass = 'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none'

function MicTest({ stream }: { stream: MediaStream | null }) {
  const level = useAudioLevel(stream)
  const [heard, setHeard] = useState(false)
  if (level > 0.25 && !heard) setHeard(true) // derived "sticky" check: the mic clearly works
  const bars = 24
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
      <div className="flex items-center gap-3">
        <span className={cn('flex size-9 items-center justify-center rounded-full', heard ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-50 text-brand-600')}>
          {heard ? <CheckCircle2 className="size-4" /> : <Mic className="size-4" />}
        </span>
        <div>
          <p className="text-sm font-medium">{heard ? 'Microphone is working' : 'Test your microphone'}</p>
          <p className="text-xs text-ink-500">Say: &ldquo;I&apos;m ready for my practice interview.&rdquo;</p>
        </div>
      </div>
      <div className="mt-3 flex h-6 items-end gap-1" role="meter" aria-label="Microphone level"
        aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(level.toFixed(2))}>
        {Array.from({ length: bars }, (_, i) => (
          <div key={i} className={cn('flex-1 rounded-sm transition-all duration-75', i / bars < level ? 'bg-emerald-500' : 'bg-ink-200')}
            style={{ height: `${30 + (i % 4) * 18}%` }} />
        ))}
      </div>
    </div>
  )
}

export function NewInterviewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const start = useStartInterview()
  const resumes = useResumes()
  const hasResume = Boolean(resumes.data?.some((r) => r.status === 'ready'))
  const { stream, status } = useUserMedia(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [type, setType] = useState<InterviewType>('topic')
  const [topic, setTopic] = useState(params.get('topic') ?? '')
  const [subtopics, setSubtopics] = useState('')
  const [jdText, setJdText] = useState('')
  const [experience, setExperience] = useState<ExperienceLevel>('fresher')
  const [duration, setDuration] = useState<5 | 10 | 15>(5)
  const [interviewer, setInterviewer] = useState<InterviewerId>('maya')

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  const needsResume = (type === 'resume' || type === 'jd') && !hasResume
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
      },
      { onSuccess: (session) => navigate(`/interviews/${session.id}`) },
    )
  }

  const micOk = status === 'ready' || status === 'audio-only'
  return (
    <div>
      <PageHeader title="New interview" description="Check your devices, choose what to practise, and start." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* ---------------- devices */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-ink-900">
              <video ref={videoRef} autoPlay muted playsInline className="size-full -scale-x-100 object-cover" />
              {status === 'ready' && (
                <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-400" /> Preview
                </span>
              )}
              {status !== 'ready' && (
                <p className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-ink-200">
                  <Camera className="size-6" />
                  {status === 'audio-only' ? 'No camera. Voice answers still work.'
                    : status === 'denied' ? 'Camera and mic are blocked. Allow them in the address bar, or continue and type your answers.'
                    : status === 'unavailable' ? 'No camera or microphone found. You can type your answers instead.'
                    : 'Requesting camera and microphone…'}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-4 px-4 py-3 text-sm">
              <span className={cn('flex items-center gap-1.5', status === 'ready' ? 'text-emerald-600' : 'text-ink-500')}>
                <Camera className="size-4" /> {status === 'ready' ? 'Camera ready' : 'No camera (optional)'}
              </span>
              <span className={cn('flex items-center gap-1.5', micOk ? 'text-emerald-600' : 'text-amber-600')}>
                <Mic className="size-4" /> {micOk ? 'Microphone ready' : 'No microphone: typed answers'}
              </span>
            </div>
          </Card>
          <MicTest stream={stream} />
          <div className="grid gap-2 text-xs text-ink-500 sm:grid-cols-3">
            <p className="flex gap-2 rounded-lg border border-ink-200 bg-white p-3"><VolumeX className="size-4 shrink-0" /> Find a quiet spot.</p>
            <p className="flex gap-2 rounded-lg border border-ink-200 bg-white p-3"><Headphones className="size-4 shrink-0" /> Headphones help.</p>
            <p className="flex gap-2 rounded-lg border border-ink-200 bg-white p-3"><Volume2 className="size-4 shrink-0" /> Pause 2 s to finish an answer.</p>
          </div>
        </div>

        {/* ---------------- settings */}
        <Card className="space-y-6 p-6">
          <Field label="Interview type">
            <div className="grid gap-2 sm:grid-cols-2">
              {INTERVIEW_TYPES.map((t) => (
                <button key={t.id} type="button" onClick={() => setType(t.id)} aria-pressed={type === t.id}
                  className={cn('rounded-xl border p-3 text-left transition-colors',
                    type === t.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-ink-200 hover:border-brand-300')}>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-ink-500">{t.hint}</p>
                </button>
              ))}
            </div>
            {needsResume && (
              <p className="mt-2 text-xs text-amber-700">
                This type needs your resume. <Link to="/resume" className="font-medium underline">Upload it first</Link>.
              </p>
            )}
          </Field>

          {type !== 'hr' && (
            <Field label={type === 'topic' ? 'Topic' : 'Focus topic (optional)'}>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120} aria-label="Topic"
                placeholder="e.g. Bias-Variance" className={inputClass} />
              {type === 'topic' && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {POPULAR_TOPICS.map((t) => (
                    <button key={t} type="button" onClick={() => setTopic(t)}
                      className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-700 hover:bg-brand-50 hover:text-brand-700">{t}</button>
                  ))}
                </div>
              )}
            </Field>
          )}

          {type === 'topic' && (
            <Field label="Sub-topics (optional, comma separated)">
              <input value={subtopics} onChange={(e) => setSubtopics(e.target.value)} aria-label="Sub-topics"
                placeholder="e.g. Overfitting, Underfitting, Validation curves" className={inputClass} />
            </Field>
          )}

          {type === 'jd' && (
            <Field label="Job description">
              <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} rows={5} aria-label="Job description"
                placeholder="Paste the job description you are preparing for" className={inputClass} />
            </Field>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Experience">
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE.map((e) => <Choice key={e.id} active={experience === e.id} onClick={() => setExperience(e.id)}>{e.label}</Choice>)}
              </div>
            </Field>
            <Field label="Duration">
              <div className="flex gap-2">
                {DURATIONS.map((d) => <Choice key={d} active={duration === d} onClick={() => setDuration(d)}>{d} min</Choice>)}
              </div>
            </Field>
          </div>

          <Field label="Interviewer">
            <div className="grid gap-2 sm:grid-cols-3">
              {INTERVIEWERS.map((p) => (
                <button key={p.id} type="button" onClick={() => setInterviewer(p.id)} aria-pressed={interviewer === p.id}
                  className={cn('flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition-colors',
                    interviewer === p.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-ink-200 hover:border-brand-300')}>
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white', p.color)}>{p.name[0]}</span>
                  <span className="leading-tight">
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-[11px] text-ink-500">{p.style}</span>
                  </span>
                </button>
              ))}
            </div>
          </Field>

          {start.error && <ErrorAlert message={start.error.message} />}
          <div className="flex items-center justify-end gap-3 border-t border-ink-100 pt-5">
            <Link to="/dashboard" className="rounded-lg px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100">Cancel</Link>
            {/* Devices are optional: without a mic the room switches to typed answers. */}
            <Button onClick={onStart} loading={start.isPending} disabled={missing || status === 'idle' || status === 'pending'}
              className="bg-gradient-to-r from-brand-600 to-accent-600 px-6 hover:opacity-95">
              Start interview
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
