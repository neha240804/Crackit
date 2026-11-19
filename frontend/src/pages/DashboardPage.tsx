// Home after login, ordered by what the user wants to DO:
//   unfinished interviews (most urgent) → the three tools (mock interview with its four
//   formats, question prep, ATS check) → progress and history → habits and how it works.
// The one "New interview" button lives in the top bar, so the page doesn't repeat it.

import { ArrowRight, ArrowUpRight, BookOpen, Briefcase, ChevronDown, ChevronUp, FileText, KeyRound, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { Card, ErrorAlert, Eyebrow, Spinner } from '@/components/ui'
import { buttonClass, fieldClass } from '@/components/ui/styles'
import { useGroqKey, useUsage } from '@/features/account/api'
import { useAuth } from '@/features/auth/context'
import { useInterviews } from '@/features/interview/api'
import { FORMAT_TONE } from '@/features/interview/constants'
import { loadSets } from '@/features/prep/api'
import { toolById } from '@/features/product'
import { useResumes } from '@/features/resume/api'
import type { InterviewSummary, InterviewType } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'

function scoreTone(score: number) {
  return score >= 75 ? 'text-success-700' : score >= 55 ? 'text-warning-700' : 'text-danger-700'
}

const RECENT = 5 // rows shown before "Show all"
const ROW_GRID = 'grid-cols-[1fr_auto_24px] md:grid-cols-[1fr_140px_100px_80px_24px]'

/** Interview history. It grows with every interview, so the dashboard shows only the most
 * recent few; "Show all" opens the full list inside its own scrolling box (with a search),
 * so the page below it (habits, how it works) stays in reach however long the history is.
 * The old list showed up to 20 rows inline and silently dropped everything older. */
function HistoryList({ done }: { done: InterviewSummary[] }) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const rows = expanded ? done.filter((i) => !q || i.title.toLowerCase().includes(q)) : done.slice(0, RECENT)

  return (
    <div className="mt-6">
      {expanded && done.length > RECENT && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-xs">
            <span className="sr-only">Search interviews</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title"
              className={cn(fieldClass, 'py-2 pl-9')} />
          </label>
          <span className="text-sm text-ink-400">{rows.length} of {done.length}</span>
        </div>
      )}
      {/* expanded: a fixed-height box that scrolls on its own; the header stays visible */}
      <div className={cn(expanded && 'max-h-[28rem] overflow-y-auto overscroll-contain rounded-2xl border border-ink-200 bg-white/50')}>
        <div className={cn('sticky top-0 z-10 hidden gap-6 px-3 py-2 text-xs font-medium tracking-[0.12em] text-ink-400 uppercase md:grid',
          ROW_GRID, expanded ? 'border-b border-ink-200 bg-paper' : 'bg-paper')}>
          <span>Interview</span><span>Date</span><span>Length</span><span className="text-right">Score</span><span />
        </div>
        <ul className={cn('divide-y divide-ink-200', !expanded && 'max-md:mt-4')}>
          {rows.map((i) => (
            <li key={i.id}>
              <Link to={`/interviews/${i.id}/report`}
                className={cn('group grid items-center gap-6 rounded-xl px-3 py-4 transition-colors hover:bg-white', ROW_GRID)}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{i.title}</p>
                  <p className="mt-1 text-sm text-ink-500 md:hidden">{formatDate(i.created_at)} · {i.duration_minutes} min</p>
                </div>
                <span className="hidden text-sm text-ink-500 md:block">{formatDate(i.created_at)}</span>
                <span className="hidden text-sm text-ink-500 md:block">{i.duration_minutes} min</span>
                {i.overall_score != null
                  ? <span className={cn('text-right font-serif text-2xl font-semibold tabular-nums', scoreTone(i.overall_score))}>{i.overall_score}</span>
                  : <span className="text-right text-sm text-ink-400">Report</span>}
                <ArrowUpRight className="size-4 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-900" aria-hidden />
              </Link>
            </li>
          ))}
          {expanded && rows.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-ink-500">No interviews match "{query}".</li>
          )}
        </ul>
      </div>
      {done.length > RECENT && (
        <button type="button" onClick={() => { setExpanded(!expanded); setQuery('') }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-900/[0.05] hover:text-ink-900"
          aria-expanded={expanded}>
          {expanded ? <>Show recent only <ChevronUp className="size-4" aria-hidden /></> : <>Show all {done.length} interviews <ChevronDown className="size-4" aria-hidden /></>}
        </button>
      )}
    </div>
  )
}

const MODES: { type: InterviewType; icon: typeof BookOpen; title: string; text: string; needsResume?: boolean }[] = [
  { type: 'topic', icon: BookOpen, title: 'Any topic', text: 'ML, React, SQL, power systems: you choose' },
  { type: 'resume', icon: FileText, title: 'Your resume', text: 'Your own projects and experience', needsResume: true },
  { type: 'jd', icon: Briefcase, title: 'A job post', text: 'Rehearse for one specific role', needsResume: true },
  { type: 'hr', icon: Users, title: 'HR & behavioral', text: 'Teamwork, challenges, motivation' },
]

// Real benefits of this app, shown below the fold (counts match the product).
const FACTS: [string, string][] = [
  ['4', 'interview formats: any topic, your resume, a job post or HR'],
  ['3', 'interviewers to choose from: warm, direct or calm'],
  ['Clear fixes', 'every report shows what was strong, what was missing and your next steps'],
  ['0', 'camera frames ever leave your browser'],
]

const TIPS = [
  ['Think out loud', 'Interviewers grade reasoning, not just answers. Say what you are weighing before you decide.'],
  ['Lead with the answer', 'One sentence that answers the question, then the detail. It keeps you from rambling.'],
  ['Use one real example', 'A specific project beats a general claim. Name what you built and what changed.'],
  ['Pause instead of filling', 'A short silence sounds confident. "Um" and "like" are counted in your report.'],
]

/** A tool card for the right-hand column: icon, name, one line, a status hint, all clickable. */
function ToolCard({ id, hint }: { id: 'prep' | 'ats'; hint: string }) {
  const { name, icon: Icon, tone, tagline, to } = toolById(id)
  return (
    <Link to={to} className="group">
      <Card className="card-hover flex h-full items-start gap-4 p-6">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tone)}><Icon className="size-[18px]" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl font-semibold">{name}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{tagline}</p>
          <p className="mt-3 text-xs text-ink-400">{hint}</p>
        </div>
        <ArrowRight className="mt-1.5 size-4 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-900" aria-hidden />
      </Card>
    </Link>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const interviews = useInterviews()
  const resumes = useResumes('interview')
  const hasResume = Boolean(resumes.data?.some((r) => r.status === 'ready'))
  const [savedSets] = useState(() => loadSets().length) // study sets live in this browser
  const list = interviews.data ?? []
  const done = list.filter((i) => i.status === 'completed')
  const scored = done.map((i) => i.overall_score).filter((s): s is number => s != null)
  const active = list.filter((i) => i.status === 'active')
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null
  const minutes = done.reduce((sum, i) => sum + i.duration_minutes, 0)
  const interview = toolById('interview')
  const groqKey = useGroqKey()
  const usage = useUsage()
  const onSharedAllowance = groqKey.data != null && !(groqKey.data.saved && groqKey.data.readable)
  const interviewsLeft = usage.data ? Math.max(0, usage.data.interview.limit - usage.data.interview.used) : null

  const stats: [string, number | string][] = [
    ['Interviews', done.length],
    ['Average score', avg ?? '–'],
    ['Best score', scored.length ? Math.max(...scored) : '–'],
    ['Minutes practised', minutes],
  ]

  return (
    <div>
      <PageHeader compact eyebrow="Dashboard"
        title={`Good to see you, ${user?.name.split(' ')[0] ?? 'there'}.`}
        description="What would you like to work on today?" />

      {active.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-warning-600/20 bg-warning-50 px-6 py-4">
          <p className="text-sm font-medium text-warning-700">Pick up where you left off</p>
          {active.slice(0, 3).map((i) => (
            <Link key={i.id} to={`/interviews/${i.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900">
              {i.title} <ArrowRight className="size-3.5" />
            </Link>
          ))}
          {active.length > 3 && <span className="text-sm text-warning-700">+{active.length - 3} more</span>}
        </div>
      )}

      {/* Without their own key, users share the site's small free allowance: say so up front,
          with the one step that removes the limit, instead of surprising them later. */}
      {onSharedAllowance && interviewsLeft != null && (
        <Link to="/settings"
          className="group mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-ink-200 bg-white px-6 py-4 transition-colors hover:border-ink-300">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><KeyRound className="size-4" aria-hidden /></span>
          <p className="min-w-0 flex-1 text-sm text-ink-700">
            <span className="font-medium text-ink-900">{interviewsLeft} of {usage.data!.interview.limit} free mock interviews left today.</span>{' '}
            Add your own free Groq key for no daily limit. It takes two minutes.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">Add your key <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
        </Link>
      )}

      {/* ------------------------------------------------ the three tools */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', interview.tone)}><interview.icon className="size-[18px]" aria-hidden /></span>
            <div>
              <p className="font-serif text-xl font-semibold">{interview.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{interview.tagline} Choose a format:</p>
            </div>
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {MODES.map(({ type, icon: Icon, title, text, needsResume }) => (
              <li key={type}>
                <Link to={`/interviews/new?type=${type}`}
                  className="group flex h-full items-center gap-3 rounded-xl border border-ink-200 bg-white/60 px-4 py-3 transition-[border-color,background-color] hover:border-ink-300 hover:bg-white">
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', FORMAT_TONE[type].chip)}><Icon className="size-4" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900">{title}</span>
                    <span className="block text-xs leading-snug text-ink-500">{needsResume && !hasResume ? 'Add your resume on the next page' : text}</span>
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-900" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid gap-5">
          <ToolCard id="prep" hint={savedSets ? `${savedSets} study set${savedSets > 1 ? 's' : ''} saved` : 'Start with a topic or your resume'} />
          <ToolCard id="ats" hint="Paste a job description for a full match score" />
        </div>
      </section>

      {/* ------------------------------------------------ progress and history */}
      <section className="mt-14">
        <div className="mb-5 flex items-baseline justify-between border-b border-ink-200 pb-4">
          <h2 className="text-2xl font-semibold">Your progress</h2>
          {done.length > 0 && <span className="text-sm text-ink-400">{done.length} completed</span>}
        </div>
        <Card className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value], i) => (
            <div key={label} className={cn('p-5 sm:p-6', i % 2 === 1 && 'border-l border-ink-200', i >= 2 && 'border-t border-ink-200 lg:border-t-0', i === 2 && 'lg:border-l')}>
              <p className="text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">{label}</p>
              <p className="mt-2.5 font-serif text-3xl leading-none font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </Card>

        {interviews.isLoading && <Spinner />}
        {interviews.isError && <div className="mt-6"><ErrorAlert message={interviews.error.message} /></div>}
        {!interviews.isLoading && done.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-ink-300 px-8 py-12 text-center">
            <p className="font-serif text-xl font-semibold">No interviews yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">Start with a short 5-minute session on a topic you know. Your reports will appear here.</p>
            <Link to="/interviews/new" className={buttonClass('primary', 'mt-6')}>Start your first interview <ArrowRight className="size-4" /></Link>
          </div>
        )}
        {done.length > 0 && <HistoryList done={done} />}
      </section>

      {/* ------------------------------------------------ below the fold: habits, then why it works */}
      <section className="mt-20 rounded-3xl bg-ink-900 px-8 py-12 text-paper sm:px-12 sm:py-14">
        <p className="text-xs font-medium tracking-[0.14em] text-brand-300 uppercase">Before your next session</p>
        <h2 className="mt-4 max-w-xl text-3xl leading-tight font-semibold text-paper sm:text-4xl">Four habits strong candidates share.</h2>
        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map(([title, text], i) => (
            <li key={title}>
              <span className="font-serif text-2xl text-brand-300">{i + 1}.</span>
              <p className="mt-2 font-serif text-lg font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20 mb-6 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>Why it works</Eyebrow>
          <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-4xl">Practice that feels like the real room.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-ink-500">
            Most prep is reading questions. Real interviews are conversations under a little pressure;
            rehearsing the conversation makes the pressure feel familiar on the day.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-8 lg:col-span-6 lg:col-start-7">
          {FACTS.map(([n, text]) => (
            <div key={text} className="border-t border-ink-200 pt-4">
              <dt className="font-serif text-3xl leading-none font-semibold text-clay-600 sm:text-4xl">{n}</dt>
              <dd className="mt-2.5 text-sm leading-relaxed text-ink-500">{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
