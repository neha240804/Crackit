// Home after login: stats, interviews in progress, recent results, quick-start topics.

import { ArrowRight, Award, Clock3, Mic, Plus, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/AppShell'
import { Badge, Card, ErrorAlert, Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth/context'
import { useInterviews } from '@/features/interview/api'
import { POPULAR_TOPICS } from '@/features/interview/constants'
import { formatDate } from '@/lib/utils'

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <div>
        <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const interviews = useInterviews()
  const list = interviews.data ?? []
  const done = list.filter((i) => i.status === 'completed')
  const scored = done.map((i) => i.overall_score).filter((s): s is number => s != null)
  const active = list.filter((i) => i.status === 'active')
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null
  const minutes = done.reduce((sum, i) => sum + i.duration_minutes, 0)

  return (
    <div>
      <PageHeader
        title={`Hi ${user?.name.split(' ')[0] ?? 'there'}, ready to practise?`}
        description="Every session ends with feedback you can act on."
        action={
          <Link to="/interviews/new" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95">
            <Plus className="size-4" /> New interview
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Mic className="size-5" />} label="Interviews done" value={done.length} />
        <Stat icon={<TrendingUp className="size-5" />} label="Average score" value={avg ?? '–'} />
        <Stat icon={<Award className="size-5" />} label="Best score" value={scored.length ? Math.max(...scored) : '–'} />
        <Stat icon={<Clock3 className="size-5" />} label="Minutes practised" value={minutes} />
      </div>

      {active.length > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">Unfinished interview{active.length > 1 ? 's' : ''}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {active.map((i) => (
              <Link key={i.id} to={`/interviews/${i.id}`} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-ink-700 shadow-sm hover:shadow">
                {i.title} <ArrowRight className="size-4 text-amber-600" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink-700">Recent interviews</h2>
          {interviews.isLoading && <Spinner />}
          {interviews.isError && <ErrorAlert message={interviews.error.message} />}
          {!interviews.isLoading && done.length === 0 && (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Mic className="size-6" /></span>
              <p className="font-medium">No interviews yet</p>
              <p className="max-w-sm text-sm text-ink-500">Start with a short 5-minute session on a topic you know. Your results will show up here.</p>
              <Link to="/interviews/new" className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Start your first interview</Link>
            </Card>
          )}
          <div className="space-y-2">
            {done.slice(0, 12).map((i) => (
              <Link key={i.id} to={`/interviews/${i.id}/report`}>
                <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.title}</p>
                    <p className="text-xs text-ink-500">{formatDate(i.created_at)} · {i.duration_minutes} min</p>
                  </div>
                  {i.overall_score != null ? (
                    <Badge tone={i.overall_score >= 75 ? 'success' : i.overall_score >= 55 ? 'warning' : 'danger'}>{i.overall_score}/100</Badge>
                  ) : (
                    <Badge>view report</Badge>
                  )}
                  <ArrowRight className="size-4 text-ink-400" />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <aside>
          <h2 className="mb-3 text-sm font-semibold text-ink-700">Quick start</h2>
          <Card className="p-5">
            <p className="text-sm text-ink-500">Jump into a topic interview:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR_TOPICS.map((t) => (
                <Link key={t} to={`/interviews/new?topic=${encodeURIComponent(t)}`}
                  className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-700">
                  {t}
                </Link>
              ))}
            </div>
            <div className="mt-5 border-t border-ink-100 pt-4 text-sm">
              <p className="font-medium">Personalise it</p>
              <p className="mt-1 text-ink-500">Upload your resume to get questions about your own projects.</p>
              <Link to="/resume" className="mt-2 inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">My resume <ArrowRight className="size-3.5" /></Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
