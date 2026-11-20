// Difficulty, shown the same way everywhere: signal bars (1-3) in the difficulty's colour, and
// a picker of three colour-coded cards (sage easy, honey intermediate, clay hard). Used by
// Question prep and New interview. Colours and hints live in features/interview/constants.ts.

import { DIFFICULTY, EXPERIENCE, LEVEL_HINT } from '@/features/interview/constants'
import type { ExperienceLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Signal-strength bars (1-3 filled) that show a difficulty at a glance. */
export function LevelBars({ level, fill }: { level: number; fill: string }) {
  return (
    <span className="flex items-end gap-[3px]" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn('w-1.5 rounded-sm', i <= level ? fill : 'bg-ink-200')} style={{ height: 4 + i * 4 }} />
      ))}
    </span>
  )
}

/** Three cards; the selected one fills with its colour; a line below says what it means. The
 * bars sit under the label at every width: side by side, "Intermediate" crowded its bars in
 * narrow columns (New interview's settings card). */
export function LevelPicker({ value, onChange, className }: { value: ExperienceLevel; onChange: (v: ExperienceLevel) => void; className?: string }) {
  return (
    <div className={className}>
      <div className="grid max-w-xl grid-cols-3 gap-2.5" role="radiogroup" aria-label="Difficulty">
        {EXPERIENCE.map((e) => {
          const d = DIFFICULTY[e.id]
          const on = value === e.id
          return (
            <button key={e.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(e.id)}
              className={cn('flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 sm:px-3.5',
                on ? cn('border-transparent font-medium text-ink-900 shadow-soft ring-2', d.tile, d.ring) : 'border-ink-200 bg-white/60 text-ink-700 hover:border-ink-300 hover:bg-white')}>
              <span className="text-[13px] sm:text-sm">{e.label}</span>
              <LevelBars level={d.level} fill={d.bar} />
            </button>
          )
        })}
      </div>
      <p className="mt-2.5 text-xs text-ink-500">{LEVEL_HINT[value]}</p>
    </div>
  )
}
