// Class-name helpers shared by components AND plain links (e.g. a <Link> styled as a button).
// They live outside the component file because React Fast Refresh only hot-reloads files
// that export nothing but components.

import { cn } from '@/lib/utils'

// primary = ink pill (the main action on a page); accent = sage; secondary = outlined.
export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-ink-900 text-paper hover:bg-ink-700 shadow-soft',
  accent: 'bg-brand-600 text-white hover:bg-brand-700 shadow-soft',
  secondary: 'bg-white text-ink-900 border border-ink-200 hover:border-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
}

export function buttonClass(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium',
    'transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px',
    'active:translate-y-0 disabled:pointer-events-none disabled:opacity-50',
    buttonStyles[variant],
    className,
  )
}

export const fieldClass = cn(
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900',
  'placeholder:text-ink-400 transition-colors hover:border-ink-300',
  'focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none',
)
