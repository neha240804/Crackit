// The top of every app page: a dark band with an eyebrow, the title, one line of context,
// optional chips (e.g. the steps of a tool) and up to four live numbers on the right.
// One shared component, so Dashboard, Question prep, New interview, ATS check, the report and
// Settings open the same way: the same dark editorial band as the dashboard's "habits" block,
// with colour carried by small icon badges (sage, honey, clay, mist), never gradients.

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface HeroStat {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone: string // icon badge, e.g. 'bg-warning-50 text-warning-700'
  onClick?: () => void // makes the tile a button (e.g. "Starred" opens the list)
  title?: string
}

export function PageHero({ eyebrow, title, description, chips, stats, action, compact = false }: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  chips?: ReactNode // a row under the description (steps, filters, tags)
  stats?: HeroStat[]
  action?: ReactNode // a button on the right when there are no stats
  compact?: boolean // tool pages (New interview, ATS check, Settings): less height
}) {
  const grid = !stats ? '' : stats.length >= 4 ? 'grid-cols-2 sm:grid-cols-4 lg:w-[30rem]' : stats.length === 3 ? 'grid-cols-3 lg:w-[26rem]' : 'grid-cols-2 lg:w-[15rem]'
  return (
    <section className={cn('rounded-3xl bg-ink-900 text-paper', compact ? 'px-6 py-6 sm:px-8 sm:py-7' : 'px-6 py-8 sm:px-10 sm:py-10')}>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.14em] text-brand-300 uppercase">{eyebrow}</p>
          <h1 className={cn('leading-tight font-semibold text-paper', compact ? 'mt-2 text-2xl sm:text-[2rem]' : 'mt-3 text-3xl sm:text-[2.4rem]')}>{title}</h1>
          {description && <p className={cn('max-w-2xl leading-relaxed text-ink-300', compact ? 'mt-2 text-sm' : 'mt-3 text-sm sm:text-base')}>{description}</p>}
          {chips && <div className={cn('flex flex-wrap gap-2', compact ? 'mt-4' : 'mt-6')}>{chips}</div>}
        </div>
        {stats && (
          <div className={cn('grid gap-2.5 sm:gap-3', grid)}>
            {stats.map(({ label, value, icon: Icon, tone, onClick, title: tip }) => {
              const body = (
                <>
                  <span className={cn('flex size-7 items-center justify-center rounded-full', tone)}><Icon className="size-3.5" aria-hidden /></span>
                  <span className="mt-3 font-serif text-3xl leading-none font-semibold text-paper tabular-nums">{value}</span>
                  <span className="mt-1.5 max-w-full truncate text-[11px] tracking-[0.1em] text-ink-400 uppercase">{label}</span>
                </>
              )
              const box = 'flex flex-col items-start rounded-2xl bg-white/[0.07] p-4 text-left ring-1 ring-white/10'
              return onClick
                ? <button key={label} type="button" onClick={onClick} title={tip} className={cn(box, 'transition-colors hover:bg-white/[0.12]')}>{body}</button>
                : <div key={label} className={box} title={tip}>{body}</div>
            })}
          </div>
        )}
        {!stats && action && <div className="lg:self-center">{action}</div>}
      </div>
    </section>
  )
}

/** A step chip for the hero's `chips` row: a coloured icon badge, a number and a label. */
export function HeroStep({ n, icon: Icon, tone, children }: { n: number; icon: LucideIcon; tone: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pr-3.5 pl-1.5 text-[13px] text-ink-100 ring-1 ring-white/10">
      <span className={cn('flex size-6 items-center justify-center rounded-full', tone)}><Icon className="size-3.5" aria-hidden /></span>
      <span><span className="text-ink-400">{n}.</span> {children}</span>
    </span>
  )
}
