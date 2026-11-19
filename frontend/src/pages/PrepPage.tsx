// Question prep: study interview questions with model answers, by track or any topic, or
// from your own resume.
//
// Designed to make the method obvious: a three-step strip says how it works (pick, think
// then reveal, mark), the setup is numbered (track → topic → level) with a live summary of
// what you will get, tracks are colour-coded tiles, and study cards carry a difficulty
// colour. Each answer starts hidden, every card can be marked "Got it" or "Review again",
// "More questions" extends a set without repeats, and "Practise in a mock interview" hands
// the topic to a voice interview. Sets live in this browser (see features/prep/api.ts).

import {
  ArrowRight, Briefcase, Brain, Check, CheckCheck, ChevronDown, Eye, FileText, LayoutTemplate,
  Lightbulb, Mic, Plus, RotateCcw, Search, Server, Sparkles, TrendingUp, Users, type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { Button, Card, ErrorAlert } from '@/components/ui'
import { buttonClass, fieldClass } from '@/components/ui/styles'
import { EXPERIENCE } from '@/features/interview/constants'
import { loadSets, saveSets, useGeneratePrep, useTracks, type Mark, type SavedSet } from '@/features/prep/api'
import { toolById } from '@/features/product'
import { useSelectedInterviewResume } from '@/features/resume/api'
import { InterviewResumePicker } from '@/features/resume/InterviewResumePicker'
import type { ExperienceLevel, PrepQuestion } from '@/lib/types'
import { cn } from '@/lib/utils'

// ------------------------------------------------------------------ visual vocabulary
// Each track gets an icon and a quiet colour, so the seven read as distinct places to go.
// Classes are written out in full (never assembled at runtime) so Tailwind can see them.
const TRACK_STYLE: Record<string, { icon: LucideIcon; tone: string; ring: string; dot: string }> = {
  any: { icon: Search, tone: 'bg-ink-100 text-ink-700', ring: 'ring-ink-300', dot: 'bg-ink-400' },
  backend: { icon: Server, tone: 'bg-mist-50 text-mist-700', ring: 'ring-mist-500/40', dot: 'bg-mist-500' },
  frontend: { icon: LayoutTemplate, tone: 'bg-clay-50 text-clay-700', ring: 'ring-clay-500/40', dot: 'bg-clay-500' },
  machine_learning: { icon: Brain, tone: 'bg-brand-50 text-brand-700', ring: 'ring-brand-500/40', dot: 'bg-brand-500' },
  generative_ai: { icon: Sparkles, tone: 'bg-plum-50 text-plum-700', ring: 'ring-plum-600/40', dot: 'bg-plum-600' },
  data_analytics: { icon: TrendingUp, tone: 'bg-teal-50 text-teal-700', ring: 'ring-teal-600/40', dot: 'bg-teal-600' },
  hr: { icon: Users, tone: 'bg-warning-50 text-warning-700', ring: 'ring-warning-600/40', dot: 'bg-warning-600' },
  managerial: { icon: Briefcase, tone: 'bg-danger-50 text-danger-700', ring: 'ring-danger-600/30', dot: 'bg-danger-600' },
}
const trackStyle = (id: string) => TRACK_STYLE[id] ?? TRACK_STYLE.any

// Difficulty colours: a left accent on the card and a matching pill.
const DIFFICULTY: Record<PrepQuestion['difficulty'], { pill: string; bar: string; dot: string }> = {
  easy: { pill: 'bg-brand-50 text-brand-700', bar: 'bg-brand-500', dot: 'bg-brand-500' },
  medium: { pill: 'bg-warning-50 text-warning-700', bar: 'bg-warning-600', dot: 'bg-warning-600' },
  hard: { pill: 'bg-clay-50 text-clay-700', bar: 'bg-clay-500', dot: 'bg-clay-500' },
}

// What each level means for the questions (mirrors LEVEL_MIX in backend prep_service.py).
const LEVEL_HINT: Record<ExperienceLevel, string> = {
  fresher: 'Graduate entry level: core concepts, the why and how, and short problems.',
  '1-3': 'Applied problems, debugging and decisions from real work.',
  '3-5': 'Trade-offs, debugging and design decisions.',
  '5+': 'Architecture, scale and leading technical decisions.',
}

const HOW_IT_WORKS: { icon: LucideIcon; title: string; text: string; tone: string }[] = [
  { icon: Search, title: 'Pick what to study', text: 'A track, any topic, or your resume.', tone: 'bg-mist-50 text-mist-700' },
  { icon: Eye, title: 'Think, then reveal', text: 'Answer in your head before you look.', tone: 'bg-clay-50 text-clay-700' },
  { icon: CheckCheck, title: 'Mark and repeat', text: '“Got it” or “Review again” until all are green.', tone: 'bg-brand-50 text-brand-700' },
]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('rounded-full border px-3 py-1.5 text-[13px] transition-colors',
        active ? 'border-ink-900 bg-ink-900 text-paper' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300')}>
      {children}
    </button>
  )
}

/** A numbered step heading inside the setup panel. */
function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="flex size-6 shrink-0 translate-y-0.5 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-paper">{n}</span>
        <p className="text-sm font-medium text-ink-900">{title}</p>
        {hint && <p className="hidden text-xs text-ink-400 sm:block">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

/** Four levels as one segmented control, with a line explaining the selected level. */
function LevelPicker({ value, onChange }: { value: ExperienceLevel; onChange: (v: ExperienceLevel) => void }) {
  return (
    <div>
      <div className="inline-flex flex-wrap rounded-full border border-ink-200 bg-white p-1" role="radiogroup" aria-label="Level">
        {EXPERIENCE.map((e) => (
          <button key={e.id} type="button" role="radio" aria-checked={value === e.id} onClick={() => onChange(e.id)}
            className={cn('rounded-full px-3.5 py-1.5 text-[13px] transition-colors',
              value === e.id ? 'bg-ink-900 font-medium text-paper' : 'text-ink-500 hover:text-ink-900')}>
            {e.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-500">{LEVEL_HINT[value]}</p>
    </div>
  )
}

/** Circular progress: green = got it, honey = to review. */
function ProgressRing({ got, review, total }: { got: number; review: number; total: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  const gotLen = total ? (got / total) * c : 0
  const reviewLen = total ? (review / total) * c : 0
  return (
    <svg viewBox="0 0 76 76" className="size-20 -rotate-90" aria-hidden>
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--color-ink-100)" strokeWidth="8" />
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--color-warning-600)" strokeOpacity="0.7" strokeWidth="8"
        strokeDasharray={`${reviewLen} ${c}`} strokeDashoffset={-gotLen} className="transition-all duration-500" />
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--color-success-600)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${gotLen} ${c}`} className="transition-all duration-500" />
    </svg>
  )
}

// ------------------------------------------------------------------ one question
function QuestionCard({ n, q, open, onToggle, mark, onMark }: {
  n: number; q: PrepQuestion; open: boolean; onToggle: () => void; mark?: Mark; onMark: (m: Mark) => void
}) {
  const d = DIFFICULTY[q.difficulty]
  return (
    <Card className={cn('relative overflow-hidden transition-[border-color,box-shadow]', open && 'shadow-lift', mark === 'got' && 'border-success-600/40')}>
      {/* difficulty accent down the left edge */}
      <span className={cn('absolute inset-y-0 left-0 w-1', d.bar)} aria-hidden />
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-4 py-5 pr-5 pl-6 text-left sm:pr-6 sm:pl-7">
        <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          mark === 'got' ? 'bg-success-600 text-white' : mark === 'review' ? 'bg-warning-600 text-white' : 'bg-ink-100 text-ink-700')}>
          {mark === 'got' ? <Check className="size-3.5" /> : mark === 'review' ? <RotateCcw className="size-3.5" /> : n}
        </span>
        <span className="flex-1">
          <span className="block leading-relaxed font-medium text-ink-900">{q.question}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={cn('rounded-full px-2 py-0.5 font-medium capitalize', d.pill)}>{q.difficulty}</span>
            {mark === 'got' && <span className="text-success-700">Got it</span>}
            {mark === 'review' && <span className="text-warning-700">To review</span>}
          </span>
        </span>
        <span className={cn('flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors',
          open ? 'bg-ink-100 text-ink-700' : 'bg-ink-900 text-paper')}>
          {open ? 'Hide' : 'Show answer'}
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
        </span>
      </button>
      {open && (
        <div className="border-t border-ink-200 bg-paper/50 py-5 pr-5 pl-6 sm:pr-6 sm:pl-[4.25rem]">
          <p className="text-[11px] font-medium tracking-[0.12em] text-ink-400 uppercase">Model answer</p>
          <p className="mt-1.5 text-[0.94rem] leading-relaxed text-ink-700">{q.answer}</p>
          <p className="mt-5 text-[11px] font-medium tracking-[0.12em] text-ink-400 uppercase">Interviewers listen for</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.key_points.map((k) => (
              <span key={k} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">{k}</span>
            ))}
          </div>
          <p className="mt-5 flex gap-2.5 rounded-xl bg-clay-50 p-3.5 text-sm leading-relaxed text-ink-700">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-clay-600" aria-hidden /><span><span className="font-medium text-clay-700">Tip: </span>{q.tip}</span>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-ink-500">How did you do?</span>
            <button type="button" onClick={() => onMark('got')}
              className={cn('flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                mark === 'got' ? 'border-success-600 bg-success-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-success-600 hover:text-success-700')}>
              <Check className="size-3.5" /> Got it
            </button>
            <button type="button" onClick={() => onMark('review')}
              className={cn('flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                mark === 'review' ? 'border-warning-600 bg-warning-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-warning-600 hover:text-warning-700')}>
              <RotateCcw className="size-3.5" /> Review again
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ------------------------------------------------------------------ an open study set
type Filter = 'all' | 'review' | 'got'

function StudySet({ set, onUpdate, onMore, moreLoading }: {
  set: SavedSet; onUpdate: (s: SavedSet) => void; onMore: () => void; moreLoading: boolean
}) {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const total = set.questions.length
  const got = Object.values(set.marks).filter((m) => m === 'got').length
  const review = Object.values(set.marks).filter((m) => m === 'review').length
  const allOpen = open.size === total
  const level = EXPERIENCE.find((e) => e.id === set.experience)?.label ?? set.experience
  const practise = set.resumeId ? '/interviews/new?type=resume'
    : set.track === 'hr' ? '/interviews/new?type=hr'
    : `/interviews/new?type=topic&topic=${encodeURIComponent(set.topic)}`
  const shown = set.questions.map((q, i) => ({ q, i })).filter(({ i }) =>
    filter === 'all' || (filter === 'got' ? set.marks[i] === 'got' : set.marks[i] !== 'got'))
  const counts = set.questions.reduce((acc, q) => ({ ...acc, [q.difficulty]: (acc[q.difficulty] ?? 0) + 1 }), {} as Record<string, number>)

  function toggle(i: number) {
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function mark(i: number, m: Mark) {
    const marks = { ...set.marks }
    if (marks[i] === m) delete marks[i] // clicking the active mark clears it
    else marks[i] = m
    onUpdate({ ...set, marks })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px]">
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {([['all', `All · ${total}`], ['review', `To review · ${total - got}`], ['got', `Got it · ${got}`]] as const).map(([id, label]) => (
            <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{label}</Chip>
          ))}
          <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(set.questions.map((_, i) => i)))}
            className="ml-auto text-[13px] text-ink-500 underline decoration-ink-300 underline-offset-4 hover:text-ink-900">
            {allOpen ? 'Hide all answers' : 'Show all answers'}
          </button>
        </div>
        <div className="space-y-3">
          {shown.map(({ q, i }) => (
            <QuestionCard key={i} n={i + 1} q={q} open={open.has(i)} onToggle={() => toggle(i)} mark={set.marks[i]} onMark={(m) => mark(i, m)} />
          ))}
          {!shown.length && (
            <p className="rounded-2xl border border-dashed border-ink-300 px-6 py-10 text-center text-sm text-ink-500">
              {filter === 'got' ? 'Nothing marked "Got it" yet.' : 'All done here. Nicely prepared.'}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={onMore} loading={moreLoading} className="mt-6 w-full py-3">
          <Plus className="size-4" /> {moreLoading ? 'Writing more questions…' : 'More questions on this topic'}
        </Button>
      </div>

      {/* progress + next step */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <p className="text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">Your progress</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative">
              <ProgressRing got={got} review={review} total={total} />
              <span className="absolute inset-0 flex items-center justify-center font-serif text-lg font-semibold tabular-nums">
                {total ? Math.round((got / total) * 100) : 0}%
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-ink-500">
              <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-success-600" />{got} got it</li>
              <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-warning-600/70" />{review} to review</li>
              <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-ink-200" />{total - got - review} not marked</li>
            </ul>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-ink-200 pt-4">
            {(['easy', 'medium', 'hard'] as const).filter((k) => counts[k]).map((k) => (
              <span key={k} className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', DIFFICULTY[k].pill)}>{counts[k]} {k}</span>
            ))}
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-700">{level}</span>
          </div>
        </Card>
        <Card className="border-brand-200 bg-brand-50/70 p-5 shadow-none">
          <span className={cn('flex size-9 items-center justify-center rounded-full', toolById('interview').tone, 'bg-white')}><Mic className="size-4" aria-hidden /></span>
          <p className="mt-3 font-serif text-lg font-semibold">Ready to say it out loud?</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">Knowing an answer and saying it under pressure are different skills.</p>
          <Link to={practise} className={buttonClass('primary', 'mt-4 w-full')}>
            <Mic className="size-4" /> Practise in a mock interview
          </Link>
        </Card>
      </aside>
    </div>
  )
}

// ------------------------------------------------------------------ page
type Source = 'topic' | 'resume'

const MODES: { id: Source; icon: LucideIcon; title: string; text: string; tone: string }[] = [
  { id: 'topic', icon: Search, title: 'By topic', text: 'Pick a track and subtopic, or type any subject you want to revise.', tone: 'bg-brand-50 text-brand-700' },
  { id: 'resume', icon: FileText, title: 'From your resume', text: 'The questions interviewers ask about your own projects, choices and skills.', tone: 'bg-clay-50 text-clay-700' },
]

export function PrepPage() {
  const tracks = useTracks()
  const generate = useGeneratePrep()
  const [sets, setSets] = useState<SavedSet[]>(loadSets)
  const [activeId, setActiveId] = useState<string | null>(() => loadSets()[0]?.id ?? null)
  // Which request is running: a new topic set, a new resume set, or "more" for a set id.
  const [pending, setPending] = useState<Source | 'more' | null>(null)
  const [moreFor, setMoreFor] = useState<string | null>(null) // set id being extended

  const [mode, setMode] = useState<Source>('topic')
  // By topic
  const [track, setTrack] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [experience, setExperience] = useState<ExperienceLevel>('fresher')
  // From your resume: its own focus and level, kept apart from the topic setup.
  // Uses interview resumes, the same list resume-based interviews use.
  const [resumeId, setResumeId] = useState<string | null>(null)
  const resume = useSelectedInterviewResume(resumeId)
  const [focus, setFocus] = useState('')
  const [resumeLevel, setResumeLevel] = useState<ExperienceLevel>('fresher')

  const active = sets.find((s) => s.id === activeId) ?? null
  const trackTopics = tracks.data?.find((t) => t.id === track)?.topics ?? []
  const selectedTone = trackStyle(track ?? 'any')

  // Always derive from the LATEST sets: generation takes seconds, and marks made meanwhile
  // must not be overwritten by a list captured when the request started. (saveSets is
  // idempotent, so React running the updater twice in dev is harmless.)
  function update(fn: (prev: SavedSet[]) => SavedSet[]) {
    setSets((prev) => {
      const next = fn(prev)
      saveSets(next)
      return next
    })
  }

  function start(source: Source) {
    const fromResume = source === 'resume'
    const rid = fromResume ? (resume?.id ?? null) : null
    const level = fromResume ? resumeLevel : experience
    const text = (fromResume ? focus : topic).trim()
    if (fromResume ? !rid : !text) return
    setPending(source)
    setMoreFor(null)
    generate.mutate({ topic: text || null, resume_id: rid, track: fromResume ? null : track, experience: level, count: 6, exclude: [] }, {
      onSuccess: (res) => {
        const set: SavedSet = { id: crypto.randomUUID(), topic: res.topic, track: fromResume ? null : track, resumeId: rid, experience: level, questions: res.questions, marks: {}, createdAt: Date.now() }
        update((prev) => [set, ...prev])
        setActiveId(set.id)
      },
      onSettled: () => setPending(null),
    })
  }

  function onMore() {
    if (!active) return
    setPending('more')
    setMoreFor(active.id)
    generate.mutate({ topic: active.resumeId ? null : active.topic, resume_id: active.resumeId ?? null, track: active.track, experience: active.experience, count: 5, exclude: active.questions.map((q) => q.question) }, {
      onSuccess: (res) => update((prev) => prev.map((s) => (s.id === active.id ? { ...s, questions: [...s.questions, ...res.questions] } : s))),
      onSettled: () => { setPending(null); setMoreFor(null) },
    })
  }

  // A live sentence saying exactly what the button will produce.
  const levelLabel = (l: ExperienceLevel) => (l === 'fresher' ? 'graduate (fresher)' : `${EXPERIENCE.find((e) => e.id === l)?.label}`)
  const summary = mode === 'topic'
    ? (topic.trim() ? <>6 {levelLabel(experience)}-level questions on <span className="font-medium text-ink-900">“{topic.trim()}”</span>, each with a model answer.</> : 'Choose a track and topic, or type your own.')
    : (resume ? <>6 questions an interviewer would ask about <span className="font-medium text-ink-900">{resume.filename}</span>{focus.trim() && <>, focused on “{focus.trim()}”</>}.</> : 'Add your resume to continue.')

  return (
    <div>
      <PageHeader compact eyebrow="Question prep" title="Know your answers before the interview."
        description="Study the questions interviewers really ask at your level, each with a model answer." />

      {/* ------------------------------------------------ how it works */}
      <ol className="mb-8 grid gap-3 sm:grid-cols-3">
        {HOW_IT_WORKS.map(({ icon: Icon, title, text, tone }, i) => (
          <li key={title} className="flex items-center gap-3 rounded-2xl border border-ink-200/80 bg-white/60 px-4 py-3">
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', tone)}><Icon className="size-4" aria-hidden /></span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink-900"><span className="text-ink-400">{i + 1}.</span> {title}</span>
              <span className="block text-xs text-ink-500">{text}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* ------------------------------------------------ choose how to prepare */}
      <div className="grid gap-4 sm:grid-cols-2" role="tablist" aria-label="How to prepare">
        {MODES.map(({ id, icon: Icon, title, text, tone }) => {
          const on = mode === id
          return (
            <button key={id} type="button" role="tab" aria-selected={on} onClick={() => setMode(id)}
              className={cn('flex items-start gap-4 rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow] duration-200',
                on ? 'border-ink-900 bg-white shadow-soft' : 'border-ink-200 bg-white/50 hover:border-ink-300 hover:bg-white')}>
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tone)}><Icon className="size-[18px]" aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg font-semibold">{title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-500">{text}</span>
              </span>
              <span className={cn('mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                on ? 'border-ink-900 bg-ink-900 text-paper' : 'border-ink-300')} aria-hidden>
                {on && <Check className="size-3" />}
              </span>
            </button>
          )
        })}
      </div>

      <Card className="mt-4 overflow-hidden" role="tabpanel">
        <div className="space-y-8 p-6 sm:p-8">
          {mode === 'topic' ? (
            <>
              <Step n={1} title="Choose a track" hint="or keep “Any topic” and type your own">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[{ id: 'any', label: 'Any topic', topics: [] as string[] }, ...(tracks.data ?? [])].map((t) => {
                    const on = (track ?? 'any') === t.id
                    const { icon: Icon, tone, ring } = trackStyle(t.id)
                    return (
                      <button key={t.id} type="button" aria-pressed={on}
                        onClick={() => { if (t.id === 'any') setTrack(null); else { setTrack(t.id); setTopic(t.topics[0] ?? '') } }}
                        className={cn('flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-[border-color,background-color,box-shadow] duration-200 sm:gap-3 sm:p-3',
                          on ? cn('border-transparent bg-white shadow-soft ring-2', ring) : 'border-ink-200 bg-white/60 hover:border-ink-300 hover:bg-white')}>
                        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9', tone)}><Icon className="size-4" aria-hidden /></span>
                        <span className="min-w-0">
                          <span className="block text-[13px] leading-tight font-medium break-words text-ink-900 sm:truncate sm:text-sm">{t.label}</span>
                          <span className="block text-[11px] text-ink-500">{t.id === 'any' ? 'Type anything' : `${t.topics.length} topics`}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Step>

              <Step n={2} title="Pick a topic" hint={track ? 'tap a subtopic or type your own' : undefined}>
                <input id="prep-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120}
                  onKeyDown={(e) => e.key === 'Enter' && start('topic')} aria-label="Topic"
                  placeholder={track ? 'Pick a subtopic below or type your own' : 'e.g. SQL joins, React hooks, power systems, Tell me about yourself'}
                  className={cn(fieldClass, 'py-2.5')} />
                {trackTopics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {trackTopics.map((t) => (
                      <button key={t} type="button" onClick={() => setTopic(t)} aria-pressed={topic === t}
                        className={cn('rounded-full px-3 py-1 text-xs transition-colors',
                          topic === t ? cn(selectedTone.dot, 'font-medium text-white shadow-soft') : 'bg-ink-100 text-ink-700 hover:bg-ink-200/70')}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </Step>

              <Step n={3} title="Your level">
                <LevelPicker value={experience} onChange={setExperience} />
              </Step>
            </>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Step n={1} title="Your resume">
                <p className="-mt-1 mb-3 text-xs leading-relaxed text-ink-500">
                  Answers use only what your resume says; missing details show as a [placeholder] for you to fill in.
                </p>
                <InterviewResumePicker selectedId={resume?.id ?? null} onSelect={setResumeId} />
              </Step>
              <div className="space-y-8">
                <Step n={2} title="Focus" hint="optional">
                  <input id="prep-focus" value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={120}
                    onKeyDown={(e) => e.key === 'Enter' && start('resume')} aria-label="Focus"
                    placeholder="e.g. my projects, the internship, or leave empty"
                    className={cn(fieldClass, 'py-2.5')} />
                </Step>
                <Step n={3} title="Your level">
                  <LevelPicker value={resumeLevel} onChange={setResumeLevel} />
                </Step>
              </div>
            </div>
          )}
        </div>

        {/* summary + action, on a tinted footer */}
        <div className="flex flex-wrap items-center gap-4 border-t border-ink-200 bg-paper/60 px-6 py-5 sm:px-8">
          <p className="min-w-0 flex-1 text-sm text-ink-500">{summary}</p>
          {mode === 'topic' ? (
            <Button onClick={() => start('topic')} loading={pending === 'topic'} disabled={!topic.trim() || generate.isPending} className="px-6 py-3">
              <Sparkles className="size-4" /> {pending === 'topic' ? 'Writing your questions…' : 'Get questions'}
            </Button>
          ) : (
            <Button onClick={() => start('resume')} loading={pending === 'resume'} disabled={!resume || generate.isPending} className="px-6 py-3">
              <Sparkles className="size-4" /> {pending === 'resume' ? 'Reading your resume…' : 'Get resume questions'}
            </Button>
          )}
        </div>
      </Card>

      {generate.error && <div className="mt-6"><ErrorAlert message={generate.error.message} /></div>}

      {/* ------------------------------------------------ recent sets */}
      {sets.length > 1 && (
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">Recent sets</span>
          {sets.map((s) => {
            const done = Object.values(s.marks).filter((m) => m === 'got').length
            return (
              <button key={s.id} type="button" onClick={() => setActiveId(s.id)}
                className={cn('flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors',
                  s.id === active?.id ? 'border-ink-900 bg-white text-ink-900' : 'border-ink-200 text-ink-500 hover:border-ink-300 hover:text-ink-900')}>
                <span className={cn('size-1.5 rounded-full', s.resumeId ? 'bg-clay-500' : trackStyle(s.track ?? 'any').dot)} />
                {s.topic} <span className="text-ink-400">{done}/{s.questions.length}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ------------------------------------------------ the set */}
      <section className="mt-6">
        {active ? (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-ink-200 pb-4">
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', active.resumeId ? 'bg-clay-50 text-clay-700' : trackStyle(active.track ?? 'any').tone)}>
                {(() => { const Icon = active.resumeId ? FileText : trackStyle(active.track ?? 'any').icon; return <Icon className="size-4" aria-hidden /> })()}
              </span>
              <h2 className="min-w-0 flex-1 text-2xl font-semibold">{active.topic}</h2>
              <span className="text-sm text-ink-400">{active.questions.length} questions</span>
            </div>
            <StudySet key={active.id} set={active} onMore={onMore} moreLoading={pending === 'more' && moreFor === active.id}
              onUpdate={(s) => update((prev) => prev.map((x) => (x.id === s.id ? { ...x, marks: s.marks } : x)))} />
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-ink-300 px-8 py-14 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-clay-50 text-clay-700"><Lightbulb className="size-5" aria-hidden /></span>
            <p className="mt-4 font-serif text-xl font-semibold">Your study set appears here</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">Choose a track or a topic above. Try answering each question in your head before you reveal the model answer.</p>
            <button type="button" onClick={() => { setMode('topic'); setTrack(null); setTopic('SQL joins') }}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
              Try “SQL joins” <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
