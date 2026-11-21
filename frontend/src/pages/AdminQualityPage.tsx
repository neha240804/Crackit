// AI quality (/admin/quality): the online evaluation of real interviews, for the site owner.
// Only accounts listed in ADMIN_EMAILS see the nav link; the API answers 404 to everyone else.
// Same numbers as `python -m app.quality.summary` (backend/app/quality/): every finished
// interview is checked in code, a sample also by an AI judge on the owner's own Groq key.

import { useQuery } from '@tanstack/react-query'
import { Bot, Gauge, MessageSquareQuote, Smile, Timer } from 'lucide-react'
import { useState } from 'react'

import { PageHero } from '@/components/PageHero'
import { Badge, Card, ErrorAlert, Eyebrow, Spinner } from '@/components/ui'
import { api } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'

interface Check {
  check: string
  name: string
  rate: number
  target: number
  n: number
  source: 'code' | 'judge'
  below_target: boolean
  meaning: string
}

interface Example {
  interview: string
  turn?: number
  failed?: string[]
  answer?: string
  reply?: string
  judge?: string
  unsupported_claim?: string
}

interface RecentInterview {
  interview: string
  at: string
  title: string
  type: string | null
  turns: number
  passed: number
  total: number
  failed: string[]
  judge: 'done' | 'pending' | 'failed' | 'skipped'
  score: number | null
  rating: number | null
}

interface Quality {
  days: number
  interviews: number
  judge: Record<'done' | 'pending' | 'failed' | 'skipped', number>
  checks: Check[]
  latency_ms: { turns: number; median: number | null; p90: number | null }
  overall_score: { n: number; mean: number | null }
  user_rating: { n: number; mean: number | null }
  examples: Example[]
  recent: RecentInterview[]
  judge_settings: { enabled: boolean; sample_rate: number; daily_max: number }
  names?: Record<string, string> // check id -> readable name
}

const PERIODS = [1, 7, 30, 90]
const MIN_SAMPLES = 5 // below this a rate says little (same rule as the summary command)
const FACE = ['', '😞', '😕', '😐', '🙂', '🤩']

const seconds = (ms: number | null) => (ms == null ? '–' : `${(ms / 1000).toFixed(1)}s`)

export function AdminQualityPage() {
  const [days, setDays] = useState(7)
  const quality = useQuery({
    queryKey: ['admin-quality', days],
    queryFn: () => api<Quality>(`/admin/quality?days=${days}`),
  })
  const q = quality.data
  const below = q?.checks.filter((c) => c.below_target).length ?? 0

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin · online evaluation"
        title="AI quality"
        description="How the interviewer and the reports did on real interviews: every finished interview is checked in code, a sample is also read by an AI judge on your own Groq key."
        chips={
          <div className="flex gap-1 rounded-full bg-white/[0.07] p-1 ring-1 ring-white/10" role="group" aria-label="Period">
            {PERIODS.map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d}
                className={cn('rounded-full px-3.5 py-1 text-sm transition-colors',
                  days === d ? 'bg-paper font-medium text-ink-900' : 'text-ink-300 hover:text-paper')}>
                {d === 1 ? '24 hours' : `${d} days`}
              </button>
            ))}
          </div>
        }
        stats={[
          { label: 'Checked', value: q?.interviews ?? '–', icon: Gauge, tone: 'bg-brand-100 text-brand-700' },
          { label: 'Judged', value: q?.judge.done ?? '–', icon: Bot, tone: 'bg-mist-100 text-mist-700' },
          { label: 'Reply', value: seconds(q?.latency_ms.median ?? null), icon: Timer, tone: 'bg-warning-50 text-warning-700',
            title: `Median interviewer reply time${q?.latency_ms.p90 != null ? `, 90th percentile ${seconds(q.latency_ms.p90)}` : ''}` },
          { label: 'Rating', value: q?.user_rating.mean != null ? q.user_rating.mean.toFixed(1) : '–', icon: Smile,
            tone: 'bg-clay-100 text-clay-700', title: q ? `Students' emoji rating, ${q.user_rating.n} ratings` : undefined },
        ]}
      />

      {quality.isLoading && <Spinner label="Loading quality checks…" />}
      {quality.error && <ErrorAlert message={(quality.error as Error).message} />}

      {q && (
        <>
          {!q.judge_settings.enabled && (
            <p className="rounded-xl border border-warning-50 bg-warning-50 px-4 py-3 text-sm text-warning-700">
              The AI judge is off, so only the code checks run. Add your own Groq key to the server&apos;s <code>.env</code> as{' '}
              <code className="font-medium">ONLINE_EVAL_GROQ_KEY</code> and restart the backend to also check answers given away,
              topic, calculations and the report&apos;s claims.
            </p>
          )}

          {q.interviews === 0 ? (
            <Card className="p-8 text-center text-ink-500">
              No finished interviews with a report in this period yet. Checks appear here as soon as students finish one.
            </Card>
          ) : (
            <>
              <section>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <Eyebrow>Checks against the eval targets</Eyebrow>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {below === 0 ? 'Everything with enough data is on target' : `${below} check${below > 1 ? 's' : ''} below target`}
                    </h2>
                  </div>
                  <p className="text-sm text-ink-500">
                    Judge: {q.judge.done} judged · {q.judge.pending} pending · {q.judge.failed} failed · {q.judge.skipped} code only
                  </p>
                </div>
                <Card className="mt-4 divide-y divide-ink-100">
                  {q.checks.map((c) => <CheckRow key={c.check} c={c} />)}
                </Card>
                <p className="mt-2 text-xs text-ink-400">
                  The black tick is the target. A rate turns red only with at least {MIN_SAMPLES} samples. Turn checks count
                  interviewer turns; report checks count interviews (claims for “report claims grounded”).
                </p>
              </section>

              <div className="grid gap-8 lg:grid-cols-2">
                <section>
                  <Eyebrow>Read these first</Eyebrow>
                  <h2 className="mt-1 text-2xl font-semibold">Recent failures</h2>
                  <div className="mt-4 space-y-3">
                    {q.examples.length === 0 && <Card className="p-5 text-sm text-ink-500">No failures in this period.</Card>}
                    {q.examples.map((e, i) => <FailureCard key={i} e={e} names={q.names ?? {}} />)}
                  </div>
                </section>
                <section>
                  <Eyebrow>Latest checked</Eyebrow>
                  <h2 className="mt-1 text-2xl font-semibold">Interviews</h2>
                  <Card className="mt-4 divide-y divide-ink-100">
                    {q.recent.map((r) => <InterviewRow key={r.interview} r={r} names={q.names ?? {}} />)}
                  </Card>
                </section>
              </div>

              <p className="text-sm text-ink-500">
                Mean report score {q.overall_score.mean ?? '–'} ({q.overall_score.n} reports) · interviewer reply time median{' '}
                {seconds(q.latency_ms.median)}, 90th percentile {seconds(q.latency_ms.p90)} ({q.latency_ms.turns} turns, AI step only).
                When a check fails, add the case to the matching offline eval dataset and fix it there (docs/EVALS.md, section 8).
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}

function CheckRow({ c }: { c: Check }) {
  const few = c.n < MIN_SAMPLES
  const tone = few ? 'neutral' : c.below_target ? 'danger' : 'success'
  const bar = few ? 'bg-ink-300' : c.below_target ? 'bg-danger-600' : 'bg-success-600'
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_14rem_6.5rem] sm:items-center">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {c.name}
          <span className="text-[11px] font-normal tracking-[0.08em] text-ink-400 uppercase">{c.source === 'judge' ? 'AI judge' : 'code'}</span>
        </p>
        <p className="mt-0.5 text-sm text-ink-500">{c.meaning}</p>
      </div>
      <div className="relative h-2 rounded-full bg-ink-100" title={`${c.rate}% of ${c.n}, target ${c.target}%`}>
        <div className={cn('h-2 rounded-full', bar)} style={{ width: `${c.rate}%` }} />
        <div className="absolute -top-1 h-4 w-0.5 bg-ink-900" style={{ left: `${c.target}%` }} aria-hidden />
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Badge tone={tone}>{c.rate}%</Badge>
        <span className="text-xs text-ink-400 tabular-nums">n={c.n}</span>
      </div>
    </div>
  )
}

// names can be missing from an older backend during a deploy: fall back to the check ids.
const readable = (ids: string[], names: Record<string, string> = {}) => ids.map((id) => names[id] ?? id).join(' · ')

function FailureCard({ e, names }: { e: Example; names: Record<string, string> }) {
  const label = e.unsupported_claim ? 'Report claim not supported' : e.judge ? 'AI judge' : readable(e.failed ?? [], names)
  return (
    <Card className="p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium text-danger-700">
          <MessageSquareQuote className="size-4" aria-hidden /> {label}
        </span>
        {e.turn != null && <span className="text-xs text-ink-400">turn {e.turn}</span>}
      </div>
      {e.answer && <p className="mt-2 text-ink-500"><span className="font-medium text-ink-700">Candidate:</span> {e.answer}</p>}
      {e.reply && <p className="mt-1.5 text-ink-500"><span className="font-medium text-ink-700">Interviewer:</span> {e.reply}</p>}
      {e.judge && <p className="mt-2 text-ink-600">{e.judge}</p>}
      {e.unsupported_claim && <p className="mt-2 text-ink-600">“{e.unsupported_claim}”</p>}
    </Card>
  )
}

function InterviewRow({ r, names }: { r: RecentInterview; names: Record<string, string> }) {
  const ok = r.failed.length === 0
  const empty = r.total === 0 // ended before any answer: nothing to check
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', empty ? 'bg-ink-300' : ok ? 'bg-success-600' : 'bg-danger-600')} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={r.title}>{r.title}</p>
        <p className="text-xs text-ink-400">
          {formatDate(r.at)} · {empty ? 'ended before any answer' : `${r.turns} turns · ${r.passed}/${r.total} checks passed`}
          {r.judge === 'done' ? ' · AI judged' : r.judge === 'pending' ? ' · judge pending' : r.judge === 'failed' ? ' · judge failed' : ''}
        </p>
        {!ok && <p className="mt-1 text-xs text-danger-700">{readable(r.failed, names)}</p>}
      </div>
      <div className="shrink-0 text-right text-sm">
        {r.score != null && <p className="font-medium tabular-nums">{r.score}</p>}
        {r.rating != null && <p title={`Rated ${r.rating}/5`}>{FACE[r.rating]}</p>}
      </div>
    </div>
  )
}
