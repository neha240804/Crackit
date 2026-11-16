// Feedback report for a finished interview. The report is generated on first visit
// (POST /report) and cached by the backend afterwards.

import { ArrowLeft, CheckCircle2, Lightbulb, MessageSquareText, RotateCcw, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { ScoreCard } from '@/components/Brand'
import { Badge, Card, ErrorAlert, Spinner } from '@/components/ui'
import { useInterview, useReport } from '@/features/interview/api'
import { formatDate } from '@/lib/utils'

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    </div>
  )
}

function List({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  if (!items.length) return null
  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700">{icon}{title}</h3>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-700">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </Card>
  )
}

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
      <Card className="mx-auto max-w-xl p-6 text-sm">
        This interview is still in progress.{' '}
        <Link to={`/interviews/${id}`} className="font-medium text-brand-600 underline">Continue it</Link>
      </Card>
    )
  }

  const r = report.data
  const isHr = s.config.interview_type === 'hr'
  const pace = r?.metrics.avg_wpm
  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Dashboard
      </Link>
      <PageHeader title={s.title} description={`${formatDate(s.created_at)} · ${s.config.duration_minutes} min with ${s.interviewer_name}`}
        action={<Link to="/interviews/new" className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-95">Practise again</Link>} />

      {report.isLoading && (
        <Card className="p-6">
          <Spinner label="Scoring your answers and writing feedback…" />
        </Card>
      )}
      {report.isError && <ErrorAlert message={report.error.message} />}

      {r && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard label="Overall" score={r.overall_score} hint="70+ ≈ would pass at this level" />
            <ScoreCard label={isHr ? 'Content' : 'Technical'} score={r.technical_score}
              hint={isHr ? 'Relevance and concrete examples' : 'Knowledge and correctness'} />
            <ScoreCard label="Communication" score={r.communication_score} hint="Clarity, pace, conciseness" />
            <ScoreCard label="Structure" score={r.structure_score} hint="Organisation (STAR for HR)" />
          </div>

          <Card className="p-5">
            <p className="text-sm text-ink-700">{r.summary}</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Speaking pace" value={pace ? `${pace} wpm` : '–'}
              hint={pace == null ? 'Typed answers have no pace' : pace < 110 ? 'A bit slow; aim for 120-160' : pace > 170 ? 'Fast; slow down a little' : 'Comfortable pace'} />
            <Stat label="Filler words" value={`${r.metrics.fillers_per_100_words} / 100 words`}
              hint={r.metrics.top_fillers.length ? `Most used: ${r.metrics.top_fillers.join(', ')}` : 'Nice and clean'} />
            <Stat label="Avg answer length" value={`${r.metrics.avg_answer_words} words`}
              hint={r.metrics.avg_answer_words < 40 ? 'Short; add an example' : 'Good amount of detail'} />
            <Stat label="Answers" value={r.metrics.answers}
              hint={r.metrics.speaking_seconds ? `${r.metrics.speaking_seconds}s of speaking` : 'Typed answers'} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <List title="Strengths" icon={<CheckCircle2 className="size-4 text-emerald-500" />} items={r.strengths} />
            <List title="Improve" icon={<TrendingUp className="size-4 text-amber-500" />} items={r.improvements} />
            <List title="Next steps" icon={<RotateCcw className="size-4 text-brand-500" />} items={r.next_steps} />
          </div>

          <h2 className="pt-2 text-sm font-semibold text-ink-700">Question by question</h2>
          {r.questions.map((q) => (
            <details key={q.question_index} className="group rounded-xl border border-ink-200 bg-white">
              <summary className="flex cursor-pointer items-start gap-3 p-4">
                <Badge tone={q.score >= 7 ? 'success' : q.score >= 5 ? 'warning' : 'danger'}>{q.score}/10</Badge>
                <span className="flex-1 text-sm font-medium">{q.question}</span>
              </summary>
              <div className="space-y-3 border-t border-ink-100 p-4 text-sm">
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-500"><MessageSquareText className="size-3.5" /> Your answer</p>
                  <p className="text-ink-700">{q.answer}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    {q.metrics.words} words{q.metrics.wpm ? ` · ${q.metrics.wpm} wpm` : ''} · {q.metrics.filler_count} filler words
                  </p>
                </div>
                {q.strengths.length > 0 && <p><span className="font-medium text-emerald-700">Good: </span>{q.strengths.join(' ')}</p>}
                {q.improvements.length > 0 && <p><span className="font-medium text-amber-700">Improve: </span>{q.improvements.join(' ')}</p>}
                <p className="flex gap-2 rounded-lg bg-brand-50 p-3 text-ink-700">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <span><span className="font-medium">A strong answer: </span>{q.ideal_answer}</span>
                </p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
