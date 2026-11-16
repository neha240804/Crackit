// Brand pieces shared by every page: logo and score card.

import { AudioLines } from 'lucide-react'

import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-sm">
        <AudioLines className="size-4" aria-hidden />
      </span>
      <span className={cn('font-semibold tracking-tight whitespace-nowrap', dark ? 'text-white' : 'text-ink-900')}>
        MockInterview<span className="text-brand-500"> AI</span>
      </span>
    </span>
  )
}

export function ScoreCard({ label, score, hint }: { label: string; score: number; hint: string }) {
  const tone = score >= 75 ? 'text-emerald-600' : score >= 55 ? 'text-amber-600' : 'text-red-600'
  const bar = score >= 75 ? 'bg-emerald-500' : score >= 55 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">{label}</p>
      <p className={cn('mt-1 text-3xl font-semibold tabular-nums', tone)}>{Math.round(score)}</p>
      <div className="mt-2 h-1.5 rounded-full bg-ink-100" aria-hidden>
        <div className={cn('h-1.5 rounded-full', bar)} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-500">{hint}</p>
    </Card>
  )
}
