// The ATS report: scores, a prioritised action plan, format checks, keyword coverage and
// an honest skill-gap analysis. Everything except the gap analysis is computed in code on
// the backend, so the same resume always gets the same score and every lost point has a reason.

import { Check, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, Eyebrow } from '@/components/ui'
import type { AnalysisResult } from '@/lib/types'
import { cn } from '@/lib/utils'

const scoreTone = (score: number) =>
  score >= 80 ? 'text-success-700' : score >= 60 ? 'text-warning-700' : 'text-danger-700'

const scoreBar = (score: number) =>
  score >= 80 ? 'bg-success-600' : score >= 60 ? 'bg-warning-600' : 'bg-danger-600'

function verdict(score: number) {
  if (score >= 85) return 'Ready to send. Small polish only.'
  if (score >= 70) return 'Solid, with a few clear fixes.'
  if (score >= 55) return 'Likely to be filtered. Fix the items below first.'
  return 'An ATS will struggle with this resume. Start with the top fixes.'
}

function Meter({ label, score, hint }: { label: string; score: number; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className={cn('font-serif text-xl font-semibold tabular-nums', scoreTone(score))}>{Math.round(score)}</p>
      </div>
      <div className="mt-2 h-1 rounded-full bg-ink-100" aria-hidden>
        <div className={cn('h-1 rounded-full', scoreBar(score))} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-500">{hint}</p>
    </div>
  )
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Chip({ children, found }: { children: ReactNode; found: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm',
      found ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')}>
      {found ? <Check className="size-3.5" aria-label="found" /> : <X className="size-3.5" aria-label="missing" />}
      {children}
    </span>
  )
}

function KeywordRow({ label, matched, missing }: { label: string; matched: string[]; missing: string[] }) {
  if (!matched.length && !missing.length) return null
  const total = matched.length + missing.length
  return (
    <div className="grid gap-3 border-t border-ink-200 py-5 first:border-t-0 first:pt-0 sm:grid-cols-[180px_1fr]">
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm text-ink-500">{matched.length} of {total} found</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {missing.map((s) => <Chip key={s} found={false}>{s}</Chip>)}
        {matched.map((s) => <Chip key={s} found>{s}</Chip>)}
      </div>
    </div>
  )
}

/** Turn the findings into an ordered to-do list: biggest score impact first. */
function actionPlan(result: AnalysisResult) {
  const items: { title: string; text: string; impact: 'High' | 'Medium' | 'Low' }[] = []
  for (const skill of result.match?.missing_must ?? []) {
    const gap = result.gaps?.gaps.find((g) => g.skill === skill)
    if (gap?.status === 'implied') {
      items.push({ title: `Name "${skill}" explicitly`, text: gap.suggestion, impact: 'High' })
    } else {
      items.push({ title: `Required skill missing: ${skill}`, text: gap?.suggestion ?? 'Add it only if you genuinely have it; otherwise build a small project that shows it.', impact: 'High' })
    }
  }
  for (const r of [...result.ats.rules].filter((r) => !r.passed).sort((a, b) => b.weight - a.weight)) {
    items.push({ title: r.label, text: r.detail, impact: r.weight >= 15 ? 'High' : r.weight >= 10 ? 'Medium' : 'Low' })
  }
  for (const skill of result.match?.missing_nice ?? []) {
    const gap = result.gaps?.gaps.find((g) => g.skill === skill)
    items.push({ title: `Preferred skill: ${skill}`, text: gap?.suggestion ?? 'Worth adding if you have real experience with it.', impact: 'Low' })
  }
  return items
}

const impactTone = { High: 'bg-danger-50 text-danger-700', Medium: 'bg-warning-50 text-warning-700', Low: 'bg-ink-100 text-ink-700' }

export function AtsReport({ result }: { result: AnalysisResult }) {
  const { ats, match, gaps, jd } = result
  const plan = actionPlan(result)
  const passed = ats.rules.filter((r) => r.passed).length

  return (
    <div className="space-y-14">
      {/* ------------------------------------------------ headline score */}
      <Card className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-ink-500 uppercase">ATS score</p>
          <p className={cn('mt-3 font-serif text-6xl leading-none font-semibold tabular-nums', scoreTone(result.overall_score))}>
            {Math.round(result.overall_score)}
          </p>
          <p className="mt-4 font-serif text-lg leading-snug">{verdict(result.overall_score)}</p>
          {jd && (
            <p className="mt-3 text-sm text-ink-500">
              Compared with <span className="font-medium text-ink-700">{jd.title ?? 'the job'}</span>
              {jd.company && ` at ${jd.company}`}{jd.seniority !== 'unknown' && ` · ${jd.seniority} level`}
            </p>
          )}
        </div>
        <div className="space-y-7 lg:border-l lg:border-ink-200 lg:pl-14">
          <Meter label="Format and structure" score={ats.score} hint={`${passed} of ${ats.rules.length} checks passed. Can an ATS read and rank it?`} />
          {match ? (
            <Meter label="Job match" score={match.score} hint="Required skills (65%), preferred skills (20%) and keywords (15%)." />
          ) : (
            <p className="rounded-xl bg-paper-deep/70 p-4 text-sm leading-relaxed text-ink-500">
              Add a job description to get a job-match score, missing keywords and a skill-gap analysis.
              The overall score then weighs relevance 65% and format 35%.
            </p>
          )}
        </div>
      </Card>

      {/* ------------------------------------------------ action plan */}
      {plan.length > 0 && (
        <Section eyebrow="How to improve it" title="Your action plan">
          <ol className="divide-y divide-ink-200 border-y border-ink-200">
            {plan.map((item, i) => (
              <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 sm:grid-cols-[3rem_1fr_auto]">
                <span className="font-serif text-lg text-ink-400">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{item.text}</p>
                </div>
                <span className={cn('col-start-2 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium sm:col-start-3 sm:self-start', impactTone[item.impact])}>
                  {item.impact} impact
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ------------------------------------------------ keywords */}
      {match && (
        <Section eyebrow="Keyword coverage" title="What the ATS is scanning for">
          <Card className="p-6 sm:p-8">
            <KeywordRow label="Required skills" matched={match.matched_must} missing={match.missing_must} />
            <KeywordRow label="Preferred skills" matched={match.matched_nice} missing={match.missing_nice} />
            <KeywordRow label="Other keywords" matched={match.matched_keywords} missing={match.missing_keywords} />
          </Card>
        </Section>
      )}

      {/* ------------------------------------------------ gaps */}
      {gaps && (
        <Section eyebrow="Skill gaps" title="An honest fit assessment">
          <blockquote className="border-l-2 border-brand-500 pl-5 font-serif text-lg leading-relaxed text-ink-700">{gaps.summary}</blockquote>
          {gaps.strengths.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {gaps.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-success-50 p-4 text-sm leading-relaxed text-ink-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-success-700" aria-hidden />{s}
                </li>
              ))}
            </ul>
          )}
          {gaps.gaps.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {gaps.gaps.map((g) => (
                <Card key={g.skill} className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-serif text-lg font-semibold">{g.skill}</p>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium',
                      g.status === 'implied' ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700')}>
                      {g.status === 'implied' ? 'Shown, not stated' : 'Missing'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">{g.explanation}</p>
                  <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm leading-relaxed text-ink-700">
                    <span className="font-medium text-brand-700">Next step: </span>{g.suggestion}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ------------------------------------------------ format checklist */}
      <Section eyebrow="Format checks" title="How an ATS reads your resume">
        <Card className="divide-y divide-ink-200">
          {ats.rules.map((r) => (
            <div key={r.id} className="flex gap-4 px-6 py-5">
              <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
                r.passed ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')}>
                {r.passed ? <Check className="size-3.5" aria-label="passed" /> : <X className="size-3.5" aria-label="failed" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.label}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{r.detail}</p>
              </div>
              <span className="text-sm text-ink-400 tabular-nums">{r.passed ? r.weight : 0}/{r.weight}</span>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  )
}
