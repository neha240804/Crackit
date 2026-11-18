// Question prep: study interview questions with model answers, by track or any topic.
//
// Flow designed for studying, not reading: each answer starts hidden (think first, then
// reveal), every card can be marked "Got it" or "Review again", progress is visible, and
// "More questions" extends the set without repeats. "Practise out loud" hands the topic to
// a real voice interview. Sets live in this browser (see features/prep/api.ts).

import { ArrowRight, BookOpen, Check, ChevronDown, FileText, Lightbulb, Mic, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { Button, Card, ErrorAlert } from '@/components/ui'
import { buttonClass, fieldClass } from '@/components/ui/styles'
import { EXPERIENCE } from '@/features/interview/constants'
import { loadSets, saveSets, useGeneratePrep, useTracks, type Mark, type SavedSet } from '@/features/prep/api'
import { useSelectedInterviewResume } from '@/features/resume/api'
import { InterviewResumePicker } from '@/features/resume/InterviewResumePicker'
import type { ExperienceLevel, PrepQuestion } from '@/lib/types'
import { cn } from '@/lib/utils'

const DIFFICULTY_TONE: Record<PrepQuestion['difficulty'], string> = {
  easy: 'bg-brand-50 text-brand-700',
  medium: 'bg-warning-50 text-warning-700',
  hard: 'bg-clay-50 text-clay-700',
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn('rounded-full border px-3 py-1.5 text-[13px] transition-colors',
        active ? 'border-ink-900 bg-ink-900 text-paper' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300')}>
      {children}
    </button>
  )
}

// ------------------------------------------------------------------ one question
function QuestionCard({ n, q, open, onToggle, mark, onMark }: {
  n: number; q: PrepQuestion; open: boolean; onToggle: () => void; mark?: Mark; onMark: (m: Mark) => void
}) {
  return (
    <Card className={cn('overflow-hidden transition-colors', mark === 'got' && 'border-success-600/30')}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-4 p-5 text-left sm:p-6">
        <span className="w-6 pt-0.5 font-serif text-sm text-ink-400">{String(n).padStart(2, '0')}</span>
        <span className="flex-1">
          <span className="block font-medium leading-relaxed text-ink-900">{q.question}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={cn('rounded-full px-2 py-0.5 font-medium capitalize', DIFFICULTY_TONE[q.difficulty])}>{q.difficulty}</span>
            {mark === 'got' && <span className="flex items-center gap-1 text-success-700"><Check className="size-3.5" /> Got it</span>}
            {mark === 'review' && <span className="flex items-center gap-1 text-warning-700"><RotateCcw className="size-3.5" /> To review</span>}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 pt-0.5 text-xs text-ink-500">
          {open ? 'Hide' : 'Show answer'}
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </span>
      </button>
      {open && (
        <div className="border-t border-ink-200 bg-paper/40 px-5 py-5 sm:pr-6 sm:pl-[3.75rem]">
          <p className="text-[0.94rem] leading-relaxed text-ink-700">{q.answer}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {q.key_points.map((k) => (
              <span key={k} className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-700">{k}</span>
            ))}
          </div>
          <p className="mt-4 flex gap-2 rounded-xl bg-clay-50 p-3 text-sm leading-relaxed text-ink-700">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-clay-600" aria-hidden />{q.tip}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {([['all', `All ${total}`], ['review', `To review ${total - got}`], ['got', `Got it ${got}`]] as const).map(([id, label]) => (
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
          <p className="text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">Progress</p>
          <p className="mt-2 font-serif text-3xl font-semibold tabular-nums">{got}<span className="text-lg text-ink-400">/{total}</span></p>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden>
            <div className="bg-success-600 transition-[width]" style={{ width: `${(got / total) * 100}%` }} />
            <div className="bg-warning-600/70 transition-[width]" style={{ width: `${(review / total) * 100}%` }} />
          </div>
          <p className="mt-3 text-xs text-ink-500">{got} got it · {review} to review · {total - got - review} not yet marked</p>
          <p className="mt-4 border-t border-ink-200 pt-4 text-xs text-ink-500">{set.topic} · {level}</p>
        </Card>
        <Card className="bg-brand-50/60 p-5 shadow-none">
          <p className="font-serif text-lg font-semibold">Ready to say it out loud?</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">Knowing an answer and saying it under pressure are different skills.</p>
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

const MODES: { id: Source; icon: typeof BookOpen; title: string; text: string; tone: string }[] = [
  { id: 'topic', icon: BookOpen, title: 'By topic', text: 'Pick a track and subtopic, or type any subject you want to revise.', tone: 'bg-brand-50 text-brand-700' },
  { id: 'resume', icon: FileText, title: 'From your resume', text: 'The questions interviewers ask about your own projects, choices and skills.', tone: 'bg-clay-50 text-clay-700' },
]

function LevelPicker({ value, onChange }: { value: ExperienceLevel; onChange: (v: ExperienceLevel) => void }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink-900">Level</p>
      <div className="flex flex-wrap gap-2">
        {EXPERIENCE.map((e) => <Chip key={e.id} active={value === e.id} onClick={() => onChange(e.id)}>{e.label}</Chip>)}
      </div>
    </div>
  )
}

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

  return (
    <div>
      <PageHeader compact eyebrow="Question prep" title="Know your answers before the interview."
        description="Study the questions interviewers really ask at your level, each with a model answer. Choose a topic, or prepare for questions about your own resume. Think first, then reveal." />

      {/* ------------------------------------------------ choose how to prepare
          Two equal choice cards, then ONE setup panel for the chosen mode: a single clear
          next step instead of two side-by-side forms with competing buttons. */}
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

      <Card className="mt-4 p-6 sm:p-8" role="tabpanel">
        {mode === 'topic' ? (
          <>
            <p className="mb-2.5 text-[13px] font-medium text-ink-900">Track</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={track === null} onClick={() => setTrack(null)}>Any topic</Chip>
              {tracks.data?.map((t) => (
                <Chip key={t.id} active={track === t.id} onClick={() => { setTrack(t.id); setTopic(t.topics[0] ?? '') }}>{t.label}</Chip>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label htmlFor="prep-topic" className="mb-2 block text-[13px] font-medium text-ink-900">Topic</label>
                <input id="prep-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120}
                  onKeyDown={(e) => e.key === 'Enter' && start('topic')}
                  placeholder={track ? 'Pick a subtopic below or type your own' : 'e.g. SQL joins, React hooks, Python OOP, Tell me about yourself'}
                  className={cn(fieldClass, 'py-2.5')} />
                {trackTopics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {trackTopics.map((t) => (
                      <button key={t} type="button" onClick={() => setTopic(t)}
                        className={cn('rounded-full px-3 py-1 text-xs transition-colors',
                          topic === t ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-700 hover:bg-brand-50 hover:text-brand-700')}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <LevelPicker value={experience} onChange={setExperience} />
            </div>
          </>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="mb-1 text-[13px] font-medium text-ink-900">Your resume</p>
              <p className="mb-3 text-xs leading-relaxed text-ink-500">
                Answers use only what your resume says; missing details show as a [placeholder] for you to fill in.
              </p>
              <InterviewResumePicker selectedId={resume?.id ?? null} onSelect={setResumeId} />
            </div>
            <div className="space-y-6">
              <div>
                <label htmlFor="prep-focus" className="mb-2 block text-[13px] font-medium text-ink-900">
                  Focus <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input id="prep-focus" value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={120}
                  onKeyDown={(e) => e.key === 'Enter' && start('resume')}
                  placeholder="e.g. my projects, the internship, or leave empty"
                  className={cn(fieldClass, 'py-2.5')} />
              </div>
              <LevelPicker value={resumeLevel} onChange={setResumeLevel} />
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-ink-200 pt-6">
          {mode === 'topic' ? (
            <Button onClick={() => start('topic')} loading={pending === 'topic'} disabled={!topic.trim() || generate.isPending} className="px-6 py-3">
              <Sparkles className="size-4" /> {pending === 'topic' ? 'Writing your questions…' : 'Get questions'}
            </Button>
          ) : (
            <Button onClick={() => start('resume')} loading={pending === 'resume'} disabled={!resume || generate.isPending} className="px-6 py-3">
              <Sparkles className="size-4" /> {pending === 'resume' ? 'Reading your resume…' : 'Get resume questions'}
            </Button>
          )}
          <p className="text-xs text-ink-500">
            {mode === 'resume' && !resume ? 'Add your resume above first.' : '6 questions with model answers, in a few seconds.'}
          </p>
        </div>
      </Card>

      {generate.error && <div className="mt-6"><ErrorAlert message={generate.error.message} /></div>}

      {/* ------------------------------------------------ recent sets */}
      {sets.length > 1 && (
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">Recent</span>
          {sets.map((s) => (
            <button key={s.id} type="button" onClick={() => setActiveId(s.id)}
              className={cn('rounded-full border px-3 py-1 text-xs transition-colors',
                s.id === active?.id ? 'border-ink-900 bg-white text-ink-900' : 'border-ink-200 text-ink-500 hover:border-ink-300 hover:text-ink-900')}>
              {s.topic} <span className="text-ink-400">· {s.questions.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* ------------------------------------------------ the set */}
      <section className="mt-6">
        {active ? (
          <>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink-200 pb-4">
              <h2 className="text-2xl font-semibold">{active.topic}</h2>
              <span className="text-sm text-ink-400">{active.questions.length} questions</span>
            </div>
            <StudySet key={active.id} set={active} onMore={onMore} moreLoading={pending === 'more' && moreFor === active.id}
              onUpdate={(s) => update((prev) => prev.map((x) => (x.id === s.id ? { ...x, marks: s.marks } : x)))} />
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-ink-300 px-8 py-14 text-center">
            <p className="font-serif text-xl font-semibold">Your study set appears here</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">Choose a track or a topic above. Try answering each question in your head before you reveal the model answer.</p>
            <button type="button" onClick={() => { setTrack(null); setTopic('SQL joins') }}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
              Try “SQL joins” <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
