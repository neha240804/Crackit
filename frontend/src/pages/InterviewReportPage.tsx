// Feedback report for a finished interview. The report is generated on first visit
// (POST /report) and cached by the backend afterwards.

import { ArrowLeft, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { ScoreCard } from '@/components/Brand'
import { Card, ErrorAlert, Eyebrow, Spinner } from '@/components/ui'
import { buttonClass } from '@/components/ui/styles'
import { useInterview, useReport } from '@/features/interview/api'
import { cn, formatDate } from '@/lib/utils'

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <div className="py-6 sm:px-6 sm:first:pl-0">
      <p className="text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-ink-500">{hint}</p>
    </div>
  )
}

function List({ title, dot, items }: { title: string; dot: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <h3 className="border-b border-ink-200 pb-3 text-xl font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3 text-[0.94rem] leading-relaxed text-ink-700">
        {items.map((s, i) => (
          <li key={i} className="flex gap-3"><span className={cn('mt-2.5 size-1.5 shrink-0 rounded-full', dot)} />{s}</li>
        ))}
      </ul>
    </div>
  )
}

const questionTone = (score: number) => (score >= 7 ? 'text-success-700' : score >= 5 ? 'text-warning-700' : 'text-danger-700')

export function InterviewReportPage() {
  const { id = '' } = useParams()
  const session = useInterview(id)
  const done = session.data?.status === 'completed'
  const report = useReport(id, done)

  if (session.isLoading) return <Spinner />
  if (session.isError || !session.data) return <ErrorAlert message={session.error?.message ?? 'Not found'} />
  const s = session.data

  if (!done) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <p className="font-serif text-2xl font-semibold">This interview is still in progress.</p>
        <Link to={`/interviews/${id}`} className={buttonClass('primary', 'mt-6')}>Continue it</Link>
      </Card>
    )
  }

  const r = report.data
  const isHr = s.config.interview_type === 'hr'
  const pace = r?.metrics.avg_wpm
  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/dashboard" className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900">
        <ArrowLeft className="size-4" /> Dashboard
      </Link>
      <PageHeader eyebrow="Feedback report" title={s.title}
        description={`${formatDate(s.created_at)} · ${s.config.duration_minutes} minutes with ${s.interviewer_name}`}
        action={<Link to="/interviews/new" className={buttonClass('primary', 'px-6 py-3')}>Practise again</Link>} />

      {report.isLoading && (
        <Card className="p-8">
          <Spinner label="Scoring your answers and writing feedback…" />
        </Card>
      )}
      {report.isError && <ErrorAlert message={report.error.message} />}

      {r && (
        <div className="space-y-16">
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ScoreCard label="Overall" score={r.overall_score} hint="70 or more: likely to pass at this level" />
              <ScoreCard label={isHr ? 'Content' : 'Technical'} score={r.technical_score}
                hint={isHr ? 'Relevance and concrete examples' : 'Knowledge and correctness'} />
              <ScoreCard label="Communication" score={r.communication_score} hint="Clarity, pace, conciseness" />
              <ScoreCard label="Structure" score={r.structure_score}
                hint={isHr ? 'STAR: situation, task, action, result' : 'Order and flow of your answers'} />
            </div>
            <blockquote className="border-l-2 border-brand-500 pl-6 font-serif text-xl leading-relaxed text-ink-700 sm:text-2xl">
              {r.summary}
            </blockquote>
          </div>

          <section>
            <Eyebrow>How you spoke</Eyebrow>
            <div className="mt-4 grid divide-ink-200 border-y border-ink-200 sm:grid-cols-2 sm:divide-x lg:grid-cols-4 [&>*]:border-ink-200 max-sm:[&>*+*]:border-t">
              <Stat label="Pace" value={pace ? `${pace} wpm` : '–'}
                hint={pace == null ? 'Not enough speech to measure' : pace < 110 ? 'A bit slow; aim for 120-160' : pace > 170 ? 'Fast; slow down a little' : 'Comfortable pace'} />
              <Stat label="Filler words" value={`${r.metrics.fillers_per_100_words}/100`}
                hint={r.metrics.top_fillers.length ? `Most used: ${r.metrics.top_fillers.join(', ')}` : 'Nice and clean'} />
              <Stat label="Answer length" value={`${r.metrics.avg_answer_words} words`}
                hint={r.metrics.avg_answer_words < 40 ? 'Short; add an example' : 'Good amount of detail'} />
              <Stat label="Answers" value={r.metrics.answers}
                hint={r.metrics.speaking_seconds ? `${r.metrics.speaking_seconds}s of speaking` : 'Speaking time not recorded'} />
            </div>
          </section>

          <div className="grid gap-12 md:grid-cols-3 md:gap-10">
            <List title="Strengths" dot="bg-success-600" items={r.strengths} />
            <List title="To improve" dot="bg-warning-600" items={r.improvements} />
            <List title="Next steps" dot="bg-brand-600" items={r.next_steps} />
          </div>

          <section>
            <h2 className="text-3xl font-semibold">Question by question</h2>
            <div className="mt-6 space-y-3">
              {r.questions.map((q, i) => (
                <details key={q.question_index} className="group rounded-2xl border border-ink-200 bg-white shadow-soft transition-colors open:border-ink-300">
                  <summary className="flex cursor-pointer list-none items-start gap-5 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                    <span className="w-6 pt-0.5 font-serif text-sm text-ink-400">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 font-medium leading-relaxed">{q.question}</span>
                    <span className={cn('font-serif text-xl font-semibold tabular-nums', questionTone(q.score))}>{q.score}<span className="text-sm text-ink-400">/10</span></span>
                    <ChevronDown className="mt-1 size-4 shrink-0 text-ink-400 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="space-y-5 border-t border-ink-200 px-5 py-6 text-[0.94rem] leading-relaxed sm:pr-6 sm:pl-[4.25rem]">
                    <div>
                      <p className="mb-1.5 text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">Your answer</p>
                      <p className="text-ink-700">{q.answer}</p>
                      <p className="mt-2 text-xs text-ink-400">
                        {q.metrics.words} words{q.metrics.wpm ? ` · ${q.metrics.wpm} wpm` : ''} · {q.metrics.filler_count} filler words
                      </p>
                    </div>
                    {q.strengths.length > 0 && <p><span className="font-medium text-success-700">Good: </span>{q.strengths.join(' ')}</p>}
                    {q.improvements.length > 0 && <p><span className="font-medium text-warning-700">Improve: </span>{q.improvements.join(' ')}</p>}
                    <p className="rounded-xl bg-brand-50 p-4 text-ink-700">
                      <span className="font-medium text-brand-700">A strong answer: </span>{q.ideal_answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
