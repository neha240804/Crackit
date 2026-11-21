// Question prep: study interview questions with model answers, by track or any topic, or
// from your own resume.
//
// Designed to make the method obvious and the page colourful but calm: a dark hero band with
// the three steps and live stats (starred, got it, to review), mode tabs that light up in their
// own colour (sage / clay / honey), colour-filled track tiles and difficulty cards with signal
// bars, chips that summarise what you will get, and a track-coloured banner over the set.
// Each answer starts hidden, every card can be marked "Got it" or "Review again",
// "More questions" extends a set without repeats, and "Practise in a mock interview" hands
// the topic to a voice interview. Sets live in this browser (see features/prep/api.ts).

import {
  Activity, ArrowRight, Briefcase, Brain, Check, CheckCheck, ChevronDown, Cog, Cpu, Eye, FileText,
  HardHat, LayoutTemplate, Lightbulb, Mic, Plus, RotateCcw, Search, Server, ShieldCheck, Sparkles, Star,
  TrendingUp, Users, Zap, type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'

import { Button, Card, ErrorAlert, Spinner } from '@/components/ui'
import { buttonClass, fieldClass } from '@/components/ui/styles'
import { HeroStep, PageHero } from '@/components/PageHero'
import { LevelBars, LevelPicker } from '@/components/LevelPicker'
import { DIFFICULTY, EXPERIENCE } from '@/features/interview/constants'
import {
  starKey, useCurrentSet, useGeneratePrep, useSaveCurrentSet, useStarred, useToggleStar, useTracks,
  type Mark, type PrepKind, type SavedSet, type StarredQuestion,
} from '@/features/prep/api'
import { useSelectedInterviewResume } from '@/features/resume/api'
import { InterviewResumePicker } from '@/features/resume/InterviewResumePicker'
import type { ExperienceLevel, PrepQuestion } from '@/lib/types'
import { cn } from '@/lib/utils'

// ------------------------------------------------------------------ visual vocabulary
// Each track gets an icon and a quiet colour, so the tracks read as distinct places to go.
// Classes are written out in full (never assembled at runtime) so Tailwind can see them.
// tone = icon badge, ring = selected outline, dot = solid accent, tile = the fill of a selected
// tile and of the study-set banner, edge = that banner's border.
type TrackLook = { icon: LucideIcon; tone: string; ring: string; dot: string; tile: string; edge: string }
const TRACK_STYLE: Record<string, TrackLook> = {
  any: { icon: Search, tone: 'bg-ink-100 text-ink-700', ring: 'ring-ink-300', dot: 'bg-ink-400', tile: 'bg-ink-100/70', edge: 'border-ink-200' },
  // tracks with the deepest question bank (shown first)
  electrical_machines: { icon: Cog, tone: 'bg-brand-50 text-brand-700', ring: 'ring-brand-500/40', dot: 'bg-brand-500', tile: 'bg-brand-50', edge: 'border-brand-200' },
  power_systems: { icon: Zap, tone: 'bg-warning-50 text-warning-700', ring: 'ring-warning-600/40', dot: 'bg-warning-600', tile: 'bg-warning-50', edge: 'border-warning-600/25' },
  protection_switchgear: { icon: ShieldCheck, tone: 'bg-danger-50 text-danger-700', ring: 'ring-danger-600/30', dot: 'bg-danger-600', tile: 'bg-danger-50', edge: 'border-danger-600/20' },
  earthing_safety: { icon: HardHat, tone: 'bg-clay-50 text-clay-700', ring: 'ring-clay-500/40', dot: 'bg-clay-500', tile: 'bg-clay-50', edge: 'border-clay-100' },
  power_electronics: { icon: Cpu, tone: 'bg-mist-50 text-mist-700', ring: 'ring-mist-500/40', dot: 'bg-mist-500', tile: 'bg-mist-50', edge: 'border-mist-100' },
  circuits_control: { icon: Activity, tone: 'bg-teal-50 text-teal-700', ring: 'ring-teal-600/40', dot: 'bg-teal-600', tile: 'bg-teal-50', edge: 'border-teal-100' },
  backend: { icon: Server, tone: 'bg-mist-50 text-mist-700', ring: 'ring-mist-500/40', dot: 'bg-mist-500', tile: 'bg-mist-50', edge: 'border-mist-100' },
  frontend: { icon: LayoutTemplate, tone: 'bg-clay-50 text-clay-700', ring: 'ring-clay-500/40', dot: 'bg-clay-500', tile: 'bg-clay-50', edge: 'border-clay-100' },
  machine_learning: { icon: Brain, tone: 'bg-brand-50 text-brand-700', ring: 'ring-brand-500/40', dot: 'bg-brand-500', tile: 'bg-brand-50', edge: 'border-brand-200' },
  generative_ai: { icon: Sparkles, tone: 'bg-plum-50 text-plum-700', ring: 'ring-plum-600/40', dot: 'bg-plum-600', tile: 'bg-plum-50', edge: 'border-plum-100' },
  data_analytics: { icon: TrendingUp, tone: 'bg-teal-50 text-teal-700', ring: 'ring-teal-600/40', dot: 'bg-teal-600', tile: 'bg-teal-50', edge: 'border-teal-100' },
  hr: { icon: Users, tone: 'bg-warning-50 text-warning-700', ring: 'ring-warning-600/40', dot: 'bg-warning-600', tile: 'bg-warning-50', edge: 'border-warning-600/25' },
  managerial: { icon: Briefcase, tone: 'bg-danger-50 text-danger-700', ring: 'ring-danger-600/30', dot: 'bg-danger-600', tile: 'bg-danger-50', edge: 'border-danger-600/20' },
}
// A set built from a resume uses the clay "resume" colour.
const RESUME_LOOK: TrackLook = { icon: FileText, tone: 'bg-clay-50 text-clay-700', ring: 'ring-clay-500/40', dot: 'bg-clay-500', tile: 'bg-clay-50', edge: 'border-clay-100' }
// HR questions answered from the resume use the honey "HR" colour.
const HR_LOOK: TrackLook = { icon: Users, tone: 'bg-warning-50 text-warning-700', ring: 'ring-warning-600/40', dot: 'bg-warning-600', tile: 'bg-warning-50', edge: 'border-warning-600/25' }
const setLook = (s: { resumeId?: string | null; kind?: PrepKind; track: string | null }) =>
  s.resumeId ? (s.kind === 'hr' ? HR_LOOK : RESUME_LOOK) : trackStyle(s.track ?? 'any')

// "From your resume" offers two kinds of set. HR lives here (not in the topic tracks) so its
// answers are built from the student's own projects, internships and activities.
const RESUME_KINDS: { id: PrepKind; title: string; text: string; look: TrackLook }[] = [
  { id: 'technical', title: 'About your projects', text: 'What interviewers ask about your projects, internships and skills.', look: RESUME_LOOK },
  { id: 'hr', title: 'HR & behavioral', text: 'Tell me about yourself, teamwork, why this company: answered from your resume.', look: HR_LOOK },
]
const trackStyle = (id: string) => TRACK_STYLE[id] ?? TRACK_STYLE.any
// The track picker shows these as their own group, ahead of HR, software and data tracks.
const ELECTRICAL_TRACKS = new Set(['electrical_machines', 'power_systems', 'protection_switchgear',
  'earthing_safety', 'power_electronics', 'circuits_control'])

const HOW_IT_WORKS: { icon: LucideIcon; title: string; tone: string }[] = [
  { icon: Search, title: 'Pick what to study', tone: 'bg-mist-50 text-mist-700' },
  { icon: Eye, title: 'Think, then reveal', tone: 'bg-clay-50 text-clay-700' },
  { icon: CheckCheck, title: 'Mark until all are green', tone: 'bg-brand-50 text-brand-700' },
]

/** Filter chip. `tone` colours the active state (e.g. honey for "To review"). */
function Chip({ active, onClick, children, tone = 'border-ink-900 bg-ink-900 text-paper' }: {
  active: boolean; onClick: () => void; children: ReactNode; tone?: string
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('rounded-full border px-3 py-1.5 text-[13px] transition-colors',
        active ? tone : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300')}>
      {children}
    </button>
  )
}

/** A numbered step heading inside the setup panel; the number takes the mode's colour. */
function Step({ n, title, hint, badge, children }: { n: number; title: string; hint?: string; badge: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <span className={cn('flex size-6 shrink-0 translate-y-0.5 items-center justify-center rounded-full text-[11px] font-semibold text-white', badge)}>{n}</span>
        <p className="text-sm font-medium text-ink-900">{title}</p>
        {hint && <p className="hidden text-xs text-ink-400 sm:block">{hint}</p>}
      </div>
      {children}
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
function QuestionCard({ n, q, open, onToggle, mark, onMark, starred, onStar, meta }: {
  n: number; q: PrepQuestion; open: boolean; onToggle: () => void
  mark?: Mark; onMark?: (m: Mark) => void // study-set progress (not shown for starred questions)
  starred: boolean; onStar: () => void
  meta?: ReactNode // extra line under the question (e.g. the topic, in the starred list)
}) {
  const d = DIFFICULTY[q.difficulty] ?? DIFFICULTY.intermediate
  return (
    <Card className={cn('relative overflow-hidden transition-[border-color,box-shadow]', open && 'shadow-lift', mark === 'got' && 'border-success-600/40')}>
      {/* difficulty accent down the left edge */}
      <span className={cn('absolute inset-y-0 left-0 w-1', d.bar)} aria-hidden />
      {/* Two buttons side by side (a button can't contain another): the question toggles the
          answer; the right column has the star and the show/hide control. */}
      <div className="flex items-start gap-2 py-5 pr-4 pl-6 sm:pr-5 sm:pl-7">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-start gap-4 text-left">
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            mark === 'got' ? 'bg-success-600 text-white' : mark === 'review' ? 'bg-warning-600 text-white' : d.pill)}>
            {mark === 'got' ? <Check className="size-3.5" /> : mark === 'review' ? <RotateCcw className="size-3.5" /> : n}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block leading-relaxed font-medium text-ink-900">{q.question}</span>
            <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={cn('rounded-full px-2 py-0.5 font-medium capitalize', d.pill)}>{q.difficulty}</span>
              {meta}
              {mark === 'got' && <span className="text-success-700">Got it</span>}
              {mark === 'review' && <span className="text-warning-700">To review</span>}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={onStar} aria-pressed={starred}
            aria-label={starred ? 'Remove from starred questions' : 'Star to revise later'} title={starred ? 'Starred: click to remove' : 'Star to revise later'}
            className={cn('flex size-8 items-center justify-center rounded-full transition-colors',
              starred ? 'text-warning-600 hover:bg-warning-50' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700')}>
            <Star className="size-[18px]" fill={starred ? 'currentColor' : 'none'} aria-hidden />
          </button>
          {/* phones: just the arrow, so the question keeps the width (the label squeezed it) */}
          <button type="button" onClick={onToggle} aria-expanded={open} tabIndex={-1} aria-label={open ? 'Hide answer' : 'Show answer'}
            className={cn('flex items-center gap-1 rounded-full px-2 py-1.5 text-xs whitespace-nowrap transition-colors sm:px-3 sm:py-1',
              open ? 'bg-ink-100 text-ink-700' : 'bg-ink-900 text-paper')}>
            <span className="hidden sm:inline">{open ? 'Hide' : 'Show answer'}</span>
            <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        </div>
      </div>
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
          {onMark && <div className="mt-5 flex flex-wrap items-center gap-2">
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
          </div>}
        </div>
      )}
    </Card>
  )
}

// ------------------------------------------------------------------ an open study set
type Filter = 'all' | 'review' | 'got'

function StudySet({ set, onUpdate, onMore, moreLoading, starred, onStar }: {
  set: SavedSet; onUpdate: (s: SavedSet) => void; onMore: () => void; moreLoading: boolean
  starred: Set<string>; onStar: (q: PrepQuestion) => void
}) {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const total = set.questions.length
  const got = Object.values(set.marks).filter((m) => m === 'got').length
  const review = Object.values(set.marks).filter((m) => m === 'review').length
  const allOpen = open.size === total
  const level = EXPERIENCE.find((e) => e.id === set.experience)?.label ?? set.experience
  const practise = set.resumeId && set.kind === 'hr' ? '/interviews/new?type=hr'
    : set.resumeId ? '/interviews/new?type=resume'
    : set.track === 'hr' ? '/interviews/new?type=hr'
    : `/interviews/new?type=topic&topic=${encodeURIComponent(set.topic)}`
  const shown = set.questions.map((q, i) => ({ q, i })).filter(({ i }) =>
    filter === 'all' || (filter === 'got' ? set.marks[i] === 'got' : set.marks[i] !== 'got'))
  const starredHere = set.questions.filter((q) => starred.has(starKey(q.question))).length

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
          {([
            ['all', `All · ${total}`, 'border-ink-900 bg-ink-900 text-paper'],
            ['review', `To review · ${total - got}`, 'border-warning-600 bg-warning-600 text-white'],
            ['got', `Got it · ${got}`, 'border-success-600 bg-success-600 text-white'],
          ] as const).map(([id, label, tone]) => (
            <Chip key={id} active={filter === id} onClick={() => setFilter(id)} tone={tone}>{label}</Chip>
          ))}
          <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(set.questions.map((_, i) => i)))}
            className="ml-auto text-[13px] text-ink-500 underline decoration-ink-300 underline-offset-4 hover:text-ink-900">
            {allOpen ? 'Hide all answers' : 'Show all answers'}
          </button>
        </div>
        <div className="space-y-3">
          {shown.map(({ q, i }) => (
            <QuestionCard key={i} n={i + 1} q={q} open={open.has(i)} onToggle={() => toggle(i)} mark={set.marks[i]} onMark={(m) => mark(i, m)}
              starred={starred.has(starKey(q.question))} onStar={() => onStar(q)} />
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
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink-200 pt-4 text-[11px]">
            <span className={cn('rounded-full px-2 py-0.5 font-medium', (DIFFICULTY[set.experience] ?? DIFFICULTY.intermediate).pill)}>{level}</span>
            <span className="flex items-center gap-1 text-ink-500">
              <Star className="size-3 text-warning-600" fill="currentColor" aria-hidden /> {starredHere} starred
            </span>
          </div>
        </Card>
        {/* the one solid-colour block on the page: the natural next step */}
        <div className="rounded-2xl bg-brand-600 p-5 text-white">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/15"><Mic className="size-4" aria-hidden /></span>
          <p className="mt-3 font-serif text-lg font-semibold text-white">Ready to say it out loud?</p>
          <p className="mt-1 text-sm leading-relaxed text-brand-50">Knowing an answer and saying it under pressure are different skills.</p>
          <Link to={practise} className={buttonClass('secondary', 'mt-4 w-full border-transparent text-brand-700')}>
            <Mic className="size-4" /> Practise in a mock interview
          </Link>
        </div>
      </aside>
    </div>
  )
}

// ------------------------------------------------------------------ starred questions
/** Every starred question, newest first, filterable by topic. Answers start hidden, as in a
 * set, so revising is still "think first, then reveal". Unstarring removes it. */
function StarredList({ items, onStar, onBrowse }: {
  items: StarredQuestion[]; onStar: (q: PrepQuestion) => void; onBrowse: () => void
}) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [topicFilter, setTopicFilter] = useState<string | null>(null)
  const topics = [...new Set(items.map((s) => s.topic))]
  const shown = items.filter((s) => !topicFilter || s.topic === topicFilter)

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-300 px-8 py-14 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning-50 text-warning-700"><Star className="size-5" aria-hidden /></span>
        <p className="mt-4 font-serif text-xl font-semibold">No starred questions yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Tap the star on any question in a study set to keep it here, with its model answer, for revision before your interview.
        </p>
        <button type="button" onClick={onBrowse}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
          Get a study set <ArrowRight className="size-3.5" />
        </button>
      </div>
    )
  }
  const honey = 'border-warning-600 bg-warning-600 text-white'
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-warning-600/20 bg-warning-50 p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-warning-700 shadow-soft">
          <Star className="size-5" fill="currentColor" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl font-semibold">Your revision list</p>
          <p className="text-sm text-ink-500">
            {items.length} question{items.length > 1 ? 's' : ''} across {topics.length} topic{topics.length > 1 ? 's' : ''}. Revise them the night before.
          </p>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Chip active={!topicFilter} onClick={() => setTopicFilter(null)} tone={honey}>All · {items.length}</Chip>
        {topics.map((t) => (
          <Chip key={t} active={topicFilter === t} onClick={() => setTopicFilter(t)} tone={honey}>
            {t} · {items.filter((s) => s.topic === t).length}
          </Chip>
        ))}
        <button type="button" onClick={() => setOpen(open.size === shown.length ? new Set() : new Set(shown.map((s) => s.key)))}
          className="ml-auto text-[13px] text-ink-500 underline decoration-ink-300 underline-offset-4 hover:text-ink-900">
          {open.size === shown.length ? 'Hide all answers' : 'Show all answers'}
        </button>
      </div>
      <div className="space-y-3">
        {shown.map((s, i) => (
          <QuestionCard key={s.key} n={i + 1} q={s.question} starred onStar={() => onStar(s.question)}
            open={open.has(s.key)}
            onToggle={() => setOpen((prev) => { const next = new Set(prev); if (next.has(s.key)) next.delete(s.key); else next.add(s.key); return next })}
            meta={<span className="text-ink-500">{s.topic}</span>} />
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ page
type Source = 'topic' | 'resume'
type Mode = Source | 'starred'

// Each way to prepare has its own colour: the tab lights up in it, and the numbered steps of
// the setup panel use it. (Full class names: Tailwind only sees literal strings.)
const MODES: { id: Mode; icon: LucideIcon; title: string; text: string; tone: string; on: string; check: string; badge: string }[] = [
  { id: 'topic', icon: Search, title: 'By topic', text: 'Pick a track and subtopic, or type any subject you want to revise.',
    tone: 'bg-brand-50 text-brand-700', on: 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/30', check: 'border-brand-600 bg-brand-600 text-white', badge: 'bg-brand-600' },
  { id: 'resume', icon: FileText, title: 'From your resume', text: 'Questions about your own projects, and the HR round answered from your resume.',
    tone: 'bg-clay-50 text-clay-700', on: 'border-clay-500 bg-clay-50/60 ring-1 ring-clay-500/30', check: 'border-clay-600 bg-clay-600 text-white', badge: 'bg-clay-600' },
  { id: 'starred', icon: Star, title: 'Starred questions', text: 'The questions you starred to revise before the interview.',
    tone: 'bg-warning-50 text-warning-700', on: 'border-warning-600 bg-warning-50/70 ring-1 ring-warning-600/30', check: 'border-warning-600 bg-warning-600 text-white', badge: 'bg-warning-600' },
]

/** Loads the saved set from the account first, so the page starts from it (no flash of an
 * empty page, and no effect copying server data into state). */
export function PrepPage() {
  const current = useCurrentSet()
  if (current.isPending) return <div className="grid min-h-[40vh] place-items-center"><Spinner /></div>
  // A failed load still opens the page (empty), rather than blocking study.
  return <PrepPageInner initial={current.data ? [current.data] : []} />
}

function PrepPageInner({ initial }: { initial: SavedSet[] }) {
  const tracks = useTracks()
  const generate = useGeneratePrep()
  const saveCurrent = useSaveCurrentSet()
  const [sets, setSets] = useState<SavedSet[]>(initial)
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null)
  // Which request is running: a new topic set, a new resume set, or "more" for a set id.
  const [pending, setPending] = useState<Source | 'more' | null>(null)
  const [moreFor, setMoreFor] = useState<string | null>(null) // set id being extended

  // ?tab=starred opens the starred list directly (the dashboard links there).
  const [params] = useSearchParams()
  const [mode, setMode] = useState<Mode>(params.get('tab') === 'starred' ? 'starred' : 'topic')
  // Starred questions are saved on the account; a star keeps the question's topic and level.
  const starred: StarredQuestion[] = useStarred().data ?? []
  const starredKeys = new Set(starred.map((s) => s.key))
  const toggleStar = useToggleStar()
  // By topic
  const [track, setTrack] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [experience, setExperience] = useState<ExperienceLevel>('intermediate')
  // From your resume: its own focus and level, kept apart from the topic setup.
  // Uses interview resumes, the same list resume-based interviews use.
  const [resumeId, setResumeId] = useState<string | null>(null)
  const resume = useSelectedInterviewResume(resumeId)
  const [focus, setFocus] = useState('')
  const [resumeLevel, setResumeLevel] = useState<ExperienceLevel>('intermediate')
  const [resumeKind, setResumeKind] = useState<PrepKind>('technical')

  const active = sets.find((s) => s.id === activeId) ?? null
  const trackTopics = tracks.data?.find((t) => t.id === track)?.topics ?? []
  const selectedTone = trackStyle(track ?? 'any')
  const modeLook = MODES.find((m) => m.id === mode) ?? MODES[0]
  const activeGot = active ? Object.values(active.marks).filter((m) => m === 'got').length : null
  const activeReview = active ? Object.values(active.marks).filter((m) => m === 'review').length : null

  // Always derive from the LATEST sets: generation takes seconds, and marks made meanwhile
  // must not be overwritten by a list captured when the request started. Only the newest set
  // is kept (questions worth keeping are starred). Saving is idempotent and debounced, so React
  // running the updater twice in dev is harmless.
  function update(fn: (prev: SavedSet[]) => SavedSet[]) {
    setSets((prev) => {
      const next = fn(prev).slice(0, 1)
      saveCurrent(next[0] ?? null)
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
    const kind: PrepKind = fromResume ? resumeKind : 'technical'
    generate.mutate({ topic: text || null, resume_id: rid, track: fromResume ? null : track, kind, experience: level, count: 6, exclude: [] }, {
      onSuccess: (res) => {
        const set: SavedSet = { id: crypto.randomUUID(), topic: res.topic, track: fromResume ? null : track, resumeId: rid, kind, experience: level, questions: res.questions, marks: {}, createdAt: Date.now() }
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
    generate.mutate({ topic: active.resumeId ? null : active.topic, resume_id: active.resumeId ?? null, track: active.track, kind: active.kind ?? 'technical', experience: active.experience, count: 5, exclude: active.questions.map((q) => q.question) }, {
      onSuccess: (res) => update((prev) => prev.map((s) => (s.id === active.id ? { ...s, questions: [...s.questions, ...res.questions] } : s))),
      onSettled: () => { setPending(null); setMoreFor(null) },
    })
  }

  // What the button will produce, as coloured chips (track · topic · difficulty · count).
  const level = mode === 'resume' ? resumeLevel : experience
  const levelLabel = EXPERIENCE.find((e) => e.id === level)?.label ?? level
  const ready = mode === 'topic' ? Boolean(topic.trim()) : Boolean(resume)
  const summaryLook = mode === 'resume' ? (resumeKind === 'hr' ? HR_LOOK : RESUME_LOOK) : selectedTone
  const SummaryIcon = summaryLook.icon
  const summaryTopic = mode === 'topic' ? topic.trim()
    : (resumeKind === 'hr' ? 'HR questions from ' : '') + (resume?.filename ?? '') + (focus.trim() ? ` · ${focus.trim()}` : '')

  const activeLook = active ? setLook(active) : null
  const ActiveIcon = activeLook?.icon ?? Search
  const total = active?.questions.length ?? 0

  return (
    <div>
      <PageHero eyebrow="Question prep" title="Know your answers before the interview."
        description="Study the questions panels really ask, at the difficulty you choose, each with a model answer."
        chips={HOW_IT_WORKS.map(({ icon, title, tone }, i) => <HeroStep key={title} n={i + 1} icon={icon} tone={tone}>{title}</HeroStep>)}
        stats={[
          { label: 'Starred', value: starred.length, icon: Star, tone: 'bg-warning-50 text-warning-700', onClick: () => setMode('starred'), title: 'Open your starred questions' },
          { label: 'Got it', value: activeGot ?? '–', icon: Check, tone: 'bg-brand-50 text-brand-700' },
          { label: 'To review', value: activeReview ?? '–', icon: RotateCcw, tone: 'bg-clay-50 text-clay-700' },
        ]} />

      {/* ------------------------------------------------ choose how to prepare */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4" role="tablist" aria-label="How to prepare">
        {MODES.map(({ id, icon: Icon, title, text, tone, on: onLook, check }) => {
          const on = mode === id
          return (
            <button key={id} type="button" role="tab" aria-selected={on} onClick={() => setMode(id)}
              className={cn('flex items-start gap-4 rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200 sm:p-5',
                on ? onLook : 'border-ink-200 bg-white/60 hover:border-ink-300 hover:bg-white')}>
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tone, on && 'bg-white')}><Icon className="size-[18px]" aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg font-semibold">
                  {title}
                  {id === 'starred' && <span className="ml-2 rounded-full bg-warning-600 px-2 py-0.5 align-middle font-sans text-xs font-medium text-white tabular-nums">{starred.length}</span>}
                </span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-500">{text}</span>
              </span>
              <span className={cn('mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                on ? check : 'border-ink-300 bg-white')} aria-hidden>
                {on && <Check className="size-3" />}
              </span>
            </button>
          )
        })}
      </div>

      {mode === 'starred' ? (
        <section className="mt-6" role="tabpanel" aria-label="Starred questions">
          <StarredList items={starred} onStar={(q) => toggleStar(q, '', 'intermediate')} onBrowse={() => setMode('topic')} />
        </section>
      ) : (
        <>
          <Card className="mt-4 overflow-hidden" role="tabpanel">
            <div className="space-y-8 p-6 sm:p-8">
              {mode === 'topic' ? (
                <>
                  <Step n={1} title="Choose a track" hint="or keep “Any topic” and type your own" badge={modeLook.badge}>
                    {/* Two groups: tracks with the deepest question bank first, then the rest.
                        Headings stay neutral: the site is worded as general, no field is named. */}
                    {[
                      { title: 'Popular tracks', dot: 'bg-warning-600', items: [{ id: 'any', label: 'Any topic', topics: [] as string[] }, ...(tracks.data ?? []).filter((t) => ELECTRICAL_TRACKS.has(t.id))] },
                      // HR is not a topic track: it lives under "From your resume", personalised
                      { title: 'More tracks', dot: 'bg-mist-500', items: (tracks.data ?? []).filter((t) => !ELECTRICAL_TRACKS.has(t.id) && t.id !== 'hr') },
                    ].filter((g) => g.items.length > 0).map((group) => (
                      <div key={group.title} className="mt-1 first:mt-0 [&+&]:mt-5">
                        <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">
                          <span className={cn('size-1.5 rounded-full', group.dot)} aria-hidden />{group.title}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {group.items.map((t) => {
                            const on = (track ?? 'any') === t.id
                            const { icon: Icon, tone, ring, tile } = trackStyle(t.id)
                            return (
                              <button key={t.id} type="button" aria-pressed={on}
                                onClick={() => { if (t.id === 'any') setTrack(null); else { setTrack(t.id); setTopic(t.topics[0] ?? '') } }}
                                className={cn('flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-[border-color,background-color,box-shadow] duration-200 sm:gap-3 sm:p-3',
                                  on ? cn('border-transparent shadow-soft ring-2', ring, tile) : 'border-ink-200 bg-white/60 hover:border-ink-300 hover:bg-white')}>
                                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9', tone, on && 'bg-white')}><Icon className="size-4" aria-hidden /></span>
                                <span className="min-w-0">
                                  <span className="block text-[13px] leading-tight font-medium break-words text-ink-900 sm:truncate sm:text-sm">{t.label}</span>
                                  <span className="block text-[11px] text-ink-500">{t.id === 'any' ? 'Type anything' : `${t.topics.length} topics`}</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </Step>

                  <Step n={2} title="Pick a topic" hint={track ? 'tap a subtopic or type your own' : undefined} badge={modeLook.badge}>
                    <input id="prep-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120}
                      onKeyDown={(e) => e.key === 'Enter' && start('topic')} aria-label="Topic"
                      placeholder={track ? 'Pick a subtopic below or type your own' : 'e.g. Transformer protection, induction motor starting, HVDC, Tell me about yourself'}
                      className={cn(fieldClass, 'py-2.5')} />
                    {trackTopics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {trackTopics.map((t) => (
                          <button key={t} type="button" onClick={() => setTopic(t)} aria-pressed={topic === t}
                            className={cn('rounded-full px-3 py-1 text-xs transition-colors',
                              topic === t ? cn(selectedTone.dot, 'font-medium text-white shadow-soft') : cn(selectedTone.tile, 'text-ink-700 hover:bg-white hover:ring-1 hover:ring-ink-200'))}>
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </Step>

                  <Step n={3} title="Difficulty" badge={modeLook.badge}>
                    <LevelPicker value={experience} onChange={setExperience} />
                  </Step>
                </>
              ) : (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Step n={1} title="Your resume" badge={modeLook.badge}>
                    <p className="-mt-1 mb-3 text-xs leading-relaxed text-ink-500">
                      Answers use only what your resume says; missing details show as a [placeholder] for you to fill in.
                    </p>
                    <InterviewResumePicker selectedId={resume?.id ?? null} onSelect={setResumeId} />
                  </Step>
                  <div className="space-y-8">
                    <Step n={2} title="What to practise" badge={modeLook.badge}>
                      <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="What to practise">
                        {RESUME_KINDS.map(({ id, title, text, look }) => {
                          const on = resumeKind === id
                          const Icon = look.icon
                          return (
                            <button key={id} type="button" role="radio" aria-checked={on} onClick={() => setResumeKind(id)}
                              className={cn('flex items-start gap-3 rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow] duration-200',
                                on ? cn('border-transparent shadow-soft ring-2', look.tile, look.ring) : 'border-ink-200 bg-white/60 hover:border-ink-300 hover:bg-white')}>
                              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', look.tone, on && 'bg-white')}><Icon className="size-4" aria-hidden /></span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-ink-900">{title}</span>
                                <span className="mt-0.5 block text-xs leading-snug text-ink-500">{text}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </Step>
                    <Step n={3} title="Focus" hint="optional" badge={modeLook.badge}>
                      <input id="prep-focus" value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={120}
                        onKeyDown={(e) => e.key === 'Enter' && start('resume')} aria-label="Focus"
                        placeholder={resumeKind === 'hr' ? 'e.g. teamwork, why this company, or leave empty' : 'e.g. my projects, the internship, or leave empty'}
                        className={cn(fieldClass, 'py-2.5')} />
                    </Step>
                    <Step n={4} title="Difficulty" badge={modeLook.badge}>
                      <LevelPicker value={resumeLevel} onChange={setResumeLevel} />
                    </Step>
                  </div>
                </div>
              )}
            </div>

            {/* what you'll get, as chips, beside the one action */}
            <div className="flex flex-wrap items-center gap-4 border-t border-ink-200 bg-paper/70 px-6 py-5 sm:px-8">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
                {ready ? (
                  <>
                    <span className={cn('inline-flex max-w-full items-center gap-1.5 rounded-full py-1 pr-3 pl-1.5 font-medium', summaryLook.tone)}>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white"><SummaryIcon className="size-3" aria-hidden /></span>
                      <span className="truncate">{summaryTopic}</span>
                    </span>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium', DIFFICULTY[level].pill)}>
                      <LevelBars level={DIFFICULTY[level].level} fill={DIFFICULTY[level].bar} /> {levelLabel}
                    </span>
                    <span className="text-ink-500">6 questions with model answers</span>
                  </>
                ) : (
                  <span className="text-ink-500">{mode === 'topic' ? 'Choose a track and topic, or type your own.' : 'Add your resume to continue.'}</span>
                )}
              </div>
              {mode === 'topic' ? (
                <Button onClick={() => start('topic')} loading={pending === 'topic'} disabled={!topic.trim() || generate.isPending} className="w-full px-6 py-3 sm:w-auto">
                  <Sparkles className="size-4" /> {pending === 'topic' ? 'Writing your questions…' : 'Get questions'}
                </Button>
              ) : (
                <Button onClick={() => start('resume')} loading={pending === 'resume'} disabled={!resume || generate.isPending} className="w-full px-6 py-3 sm:w-auto">
                  <Sparkles className="size-4" /> {pending === 'resume' ? 'Reading your resume…' : resumeKind === 'hr' ? 'Get HR questions' : 'Get resume questions'}
                </Button>
              )}
            </div>
          </Card>

          {generate.error && <div className="mt-6"><ErrorAlert message={generate.error.message} /></div>}

          {/* ------------------------------------------------ the set */}
          <section className="mt-10">
            {active && activeLook ? (
              <>
                {/* banner in the track's colour, with a progress strip along its bottom edge */}
                <div className={cn('mb-6 overflow-hidden rounded-2xl border', activeLook.tile, activeLook.edge)}>
                  <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
                    <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-soft', activeLook.tone, 'bg-white')}>
                      <ActiveIcon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium tracking-[0.12em] text-ink-500 uppercase">Your study set</p>
                      <h2 className="mt-0.5 text-2xl leading-tight font-semibold">{active.topic}</h2>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 text-xs sm:w-auto">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-medium', (DIFFICULTY[active.experience] ?? DIFFICULTY.intermediate).pill, 'bg-white')}>
                        <LevelBars level={(DIFFICULTY[active.experience] ?? DIFFICULTY.intermediate).level} fill={(DIFFICULTY[active.experience] ?? DIFFICULTY.intermediate).bar} />
                        {EXPERIENCE.find((e) => e.id === active.experience)?.label ?? active.experience}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-ink-700">{total} questions</span>
                    </div>
                  </div>
                  <div className="flex h-1.5 bg-white/70" aria-hidden>
                    <span className="bg-success-600 transition-[width] duration-500" style={{ width: `${total ? ((activeGot ?? 0) / total) * 100 : 0}%` }} />
                    <span className="bg-warning-600/70 transition-[width] duration-500" style={{ width: `${total ? ((activeReview ?? 0) / total) * 100 : 0}%` }} />
                  </div>
                </div>
                <StudySet key={active.id} set={active} onMore={onMore} moreLoading={pending === 'more' && moreFor === active.id}
                  starred={starredKeys} onStar={(q) => toggleStar(q, active.topic, active.experience)}
                  onUpdate={(s) => update((prev) => prev.map((x) => (x.id === s.id ? { ...x, marks: s.marks } : x)))} />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink-300 bg-white/40 px-8 py-14 text-center">
                <div className="mx-auto flex w-fit -space-x-2" aria-hidden>
                  {[['bg-brand-50 text-brand-700', Cog], ['bg-warning-50 text-warning-700', Zap], ['bg-danger-50 text-danger-700', ShieldCheck]].map(([tone, Icon], i) => {
                    const I = Icon as LucideIcon
                    return <span key={i} className={cn('flex size-11 items-center justify-center rounded-full ring-4 ring-paper', tone as string)}><I className="size-5" /></span>
                  })}
                </div>
                <p className="mt-4 font-serif text-xl font-semibold">Your study set appears here</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">Choose a track or a topic above. Try answering each question in your head before you reveal the model answer.</p>
                <button type="button" onClick={() => { setMode('topic'); setTrack('electrical_machines'); setTopic('Induction motor starting and speed control') }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100">
                  Try “Induction motor starting” <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
