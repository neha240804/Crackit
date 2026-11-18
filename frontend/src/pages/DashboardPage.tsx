// Home after login: stats, the four ways to practise, interviews in progress, full
// interview history, and (further down) what makes the product work.

import { ArrowRight, ArrowUpRight, AudioLines, BookOpen, Briefcase, FileText, Gauge, MessagesSquare, Plus, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { Card, ErrorAlert, Eyebrow, Spinner } from '@/components/ui'
import { buttonClass } from '@/components/ui/styles'
import { useAuth } from '@/features/auth/context'
import { useInterviews } from '@/features/interview/api'
import { FORMAT_TONE } from '@/features/interview/constants'
import { useResumes } from '@/features/resume/api'
import type { InterviewType } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'

function scoreTone(score: number) {
  return score >= 75 ? 'text-success-700' : score >= 55 ? 'text-warning-700' : 'text-danger-700'
}

const MODES: { type: InterviewType; icon: typeof BookOpen; title: string; text: string; needsResume?: boolean }[] = [
  { type: 'topic', icon: BookOpen, title: 'Any topic', text: 'Machine learning, React, SQL, system design. You choose the subject.' },
  { type: 'resume', icon: FileText, title: 'Your resume', text: 'Questions about the projects and experience you actually have.', needsResume: true },
  { type: 'jd', icon: Briefcase, title: 'A job post', text: 'Paste a job description and rehearse for that specific role.', needsResume: true },
  { type: 'hr', icon: Users, title: 'HR & behavioral', text: 'Introductions, teamwork and challenges, judged on structure.' },
]

// Product facts shown below the fold. Every number here is a real setting of this app.
const FACTS: [string, string][] = [
  ['2 s', 'of silence hands the turn back, like a real conversation'],
  ['0.9 s', 'into a pause, your answer is already being transcribed, so replies come quickly'],
  ['4', 'interview styles, at fresher to 5+ years level'],
  ['0', 'camera frames ever leave your browser'],
]

const PILLARS = [
  { icon: AudioLines, title: 'A voice, not a chatbot', text: 'A natural neural voice speaks each line as it is ready, and your answer is captioned live as you talk. No typing, no buttons between turns.' },
  { icon: MessagesSquare, title: 'It listens to what you said', text: 'Each reply judges your last answer: credit when you are right, a one-line correction when you are not, a deeper follow-up when you are on a roll.' },
  { icon: Gauge, title: 'Feedback you can measure', text: 'Every question is scored with a model answer. Pace, filler words and answer length are counted in code, not guessed.' },
  { icon: ShieldCheck, title: 'Honest by design', text: 'Topic switches, timing and speaking metrics are fixed rules, not guesses. The ATS score works the same way: every lost point comes with a reason.' },
]

// Icon badge tints, cycled across cards: the palette's quiet tones, never one colour shouting.
const TONES = Object.values(FORMAT_TONE).map((t) => t.chip)

const TIPS = [
  ['Think out loud', 'Interviewers grade reasoning, not just answers. Say what you are weighing before you decide.'],
  ['Lead with the answer', 'One sentence that answers the question, then the detail. It keeps you from rambling.'],
  ['Use one real example', 'A specific project beats a general claim. Name what you built and what changed.'],
  ['Pause instead of filling', 'A short silence sounds confident. "Um" and "like" are counted in your report.'],
]

export function DashboardPage() {
  const { user } = useAuth()
  const interviews = useInterviews()
  const resumes = useResumes('interview')
  const hasResume = Boolean(resumes.data?.some((r) => r.status === 'ready'))
  const list = interviews.data ?? []
  const done = list.filter((i) => i.status === 'completed')
  const scored = done.map((i) => i.overall_score).filter((s): s is number => s != null)
  const active = list.filter((i) => i.status === 'active')
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null
  const minutes = done.reduce((sum, i) => sum + i.duration_minutes, 0)

  const stats: [string, number | string][] = [
    ['Interviews', done.length],
    ['Average score', avg ?? '–'],
    ['Best score', scored.length ? Math.max(...scored) : '–'],
    ['Minutes practised', minutes],
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={`Good to see you, ${user?.name.split(' ')[0] ?? 'there'}.`}
        description="Every session ends with feedback you can act on."
        action={<Link to="/interviews/new" className={buttonClass('primary', 'px-6 py-3')}><Plus className="size-4" /> New interview</Link>}
      />

      {/* stats: one card, hairline dividers, serif numbers */}
      <Card className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value], i) => (
          <div key={label} className={cn('p-6 sm:p-8', i % 2 === 1 && 'border-l border-ink-200', i >= 2 && 'border-t border-ink-200 lg:border-t-0', i === 2 && 'lg:border-l')}>
            <p className="text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">{label}</p>
            <p className="mt-3 font-serif text-4xl leading-none font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </Card>

      {active.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-warning-600/20 bg-warning-50 px-6 py-5">
          <p className="text-sm font-medium text-warning-700">Unfinished interview{active.length > 1 ? 's' : ''}</p>
          {active.slice(0, 3).map((i) => (
            <Link key={i.id} to={`/interviews/${i.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900">
              {i.title} <ArrowRight className="size-3.5" />
            </Link>
          ))}
          {active.length > 3 && <span className="text-sm text-warning-700">+{active.length - 3} more</span>}
        </div>
      )}

      {/* ------------------------------------------------ the four ways to practise */}
      <section className="mt-16">
        <div className="mb-6 flex items-baseline justify-between border-b border-ink-200 pb-4">
          <h2 className="text-2xl font-semibold">Start practising</h2>
          <span className="hidden text-sm text-ink-400 sm:inline">Pick a format</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map(({ type, icon: Icon, title, text, needsResume }, i) => (
            <Link key={type} to={`/interviews/new?type=${type}`} className="group">
              <Card className="card-hover flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className={cn('flex size-10 items-center justify-center rounded-full', FORMAT_TONE[type].chip)}><Icon className="size-[18px]" aria-hidden /></span>
                  <span className="font-serif text-sm text-ink-400">0{i + 1}</span>
                </div>
                <p className="mt-6 font-serif text-xl font-semibold">{title}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{text}</p>
                <p className="mt-5 flex items-center gap-1.5 text-sm font-medium text-ink-900">
                  {needsResume && !hasResume ? 'Add resume & start' : 'Start'}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ history, full width */}
      <section className="mt-16">
        <div className="mb-2 flex items-baseline justify-between border-b border-ink-200 pb-4">
          <h2 className="text-2xl font-semibold">Recent interviews</h2>
          {done.length > 0 && <span className="text-sm text-ink-400">{done.length} completed</span>}
        </div>
        {interviews.isLoading && <Spinner />}
        {interviews.isError && <ErrorAlert message={interviews.error.message} />}
        {!interviews.isLoading && done.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-ink-300 px-8 py-14 text-center">
            <p className="font-serif text-2xl font-semibold">No interviews yet</p>
            <p className="mx-auto mt-3 max-w-sm text-ink-500">Start with a short 5-minute session on a topic you know. Your results will appear here.</p>
            <Link to="/interviews/new" className={buttonClass('primary', 'mt-8')}>Start your first interview <ArrowRight className="size-4" /></Link>
          </div>
        )}
        {done.length > 0 && (
          <>
            <div className="hidden grid-cols-[1fr_140px_100px_80px_24px] gap-6 px-3 pt-4 pb-2 text-xs font-medium tracking-[0.12em] text-ink-400 uppercase md:grid">
              <span>Interview</span><span>Date</span><span>Length</span><span className="text-right">Score</span><span />
            </div>
            <ul className="divide-y divide-ink-200">
              {done.slice(0, 20).map((i) => (
                <li key={i.id}>
                  <Link to={`/interviews/${i.id}/report`}
                    className="group -mx-3 grid grid-cols-[1fr_auto_24px] items-center gap-6 rounded-xl px-6 py-5 transition-colors hover:bg-white md:mx-0 md:grid-cols-[1fr_140px_100px_80px_24px] md:px-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900">{i.title}</p>
                      <p className="mt-1 text-sm text-ink-500 md:hidden">{formatDate(i.created_at)} · {i.duration_minutes} min</p>
                    </div>
                    <span className="hidden text-sm text-ink-500 md:block">{formatDate(i.created_at)}</span>
                    <span className="hidden text-sm text-ink-500 md:block">{i.duration_minutes} min</span>
                    {i.overall_score != null
                      ? <span className={cn('text-right font-serif text-2xl font-semibold tabular-nums', scoreTone(i.overall_score))}>{i.overall_score}</span>
                      : <span className="text-right text-sm text-ink-400">Report</span>}
                    <ArrowUpRight className="size-4 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-900" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ------------------------------------------------ below the fold: why it works */}
      <section className="mt-28 border-t border-ink-200 pt-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow>Why it works</Eyebrow>
            <h2 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl">Practice that feels like the real room.</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-500">
              Most interview prep is reading questions. Real interviews are conversations under a little pressure.
              MockInterview recreates the conversation, so the pressure feels familiar on the day.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-10 lg:col-span-6 lg:col-start-7">
            {FACTS.map(([n, text]) => (
              <div key={text} className="border-t border-ink-200 pt-5">
                <dt className="font-serif text-5xl leading-none font-semibold text-clay-600">{n}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-ink-500">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-24 grid gap-5 sm:grid-cols-2">
        {PILLARS.map(({ icon: Icon, title, text }, i) => (
          <Card key={title} className="card-hover p-8">
            <span className={cn('flex size-10 items-center justify-center rounded-full', TONES[i % TONES.length])}><Icon className="size-[18px]" aria-hidden /></span>
            <p className="mt-6 font-serif text-2xl font-semibold">{title}</p>
            <p className="mt-3 leading-relaxed text-ink-500">{text}</p>
          </Card>
        ))}
      </section>

      <section className="mt-24 rounded-3xl bg-ink-900 px-8 py-14 text-paper sm:px-14 sm:py-16">
        <p className="text-xs font-medium tracking-[0.14em] text-brand-300 uppercase">Before your next session</p>
        <h2 className="mt-5 max-w-xl text-4xl leading-tight font-semibold text-paper">Four habits strong candidates share.</h2>
        <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map(([title, text], i) => (
            <li key={title}>
              <span className="font-serif text-3xl text-brand-300">{i + 1}.</span>
              <p className="mt-3 font-serif text-xl font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-24 mb-8 grid items-center gap-8 rounded-3xl border border-ink-200 bg-paper-deep/70 px-8 py-12 sm:px-14 lg:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-3xl leading-tight font-semibold sm:text-4xl">Is your resume getting read?</h2>
          <p className="mt-3 max-w-xl leading-relaxed text-ink-500">
            See how an applicant tracking system scores it against a job, which keywords and skills are missing, and what to fix first.
          </p>
        </div>
        <Link to="/resume" className={buttonClass('primary', 'px-6 py-3')}>Check my ATS score <ArrowRight className="size-4" /></Link>
      </section>
    </div>
  )
}
