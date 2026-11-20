// Small reusable UI building blocks. Every page uses these, so the app looks consistent
// and a style change happens in one place.

import { ArrowRight, Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

import { buttonClass, fieldClass, type ButtonVariant } from '@/components/ui/styles'
import { cn } from '@/lib/utils'

// ------------------------------------------------------------------ Button
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

export function Button({ variant = 'primary', loading = false, disabled, className, children, ...props }: ButtonProps) {
  return (
    <button disabled={disabled || loading} className={buttonClass(variant, className)} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

// ------------------------------------------------------------------ Inputs
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      <input id={inputId} className={cn(fieldClass, className)} {...props} />
    </label>
  )
}

// ------------------------------------------------------------------ Card
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-ink-200 bg-white shadow-soft', className)} {...props} />
}

// ------------------------------------------------------------------ Badge
type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

const badgeStyles: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', badgeStyles[tone])}>
      {children}
    </span>
  )
}

// ------------------------------------------------------------------ Feedback
export function ErrorAlert({ message }: { message: string }) {
  // Every AI feature needs the user's own Groq key (bring-your-own-key only). The server's
  // messages for a missing (428) or rejected key end with "in Settings": link straight there.
  const toSettings = /\bin Settings\b/.test(message)
  return (
    <div role="alert" className="rounded-xl border border-danger-50 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
      {message}
      {toSettings && (
        <Link to="/settings" className="ml-2 inline-flex items-center gap-1 font-medium underline underline-offset-2">
          Open Settings <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-500">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {label}
    </div>
  )
}

/** Small uppercase label above a section title (editorial "kicker"). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs font-medium tracking-[0.14em] text-brand-700 uppercase', className)}>{children}</p>
}
