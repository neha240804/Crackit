// Small reusable UI building blocks. Every page uses these, so the app looks consistent
// and a style change happens in one place.

import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

// ------------------------------------------------------------------ Button
type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secondary: 'bg-white text-ink-900 border border-ink-200 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
        'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60',
        buttonStyles[variant],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

// ------------------------------------------------------------------ Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm',
          'placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          'focus:outline-none',
          className,
        )}
        {...props}
      />
    </label>
  )
}

// ------------------------------------------------------------------ Card
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-ink-200 bg-white shadow-sm', className)}
      {...props}
    />
  )
}

// ------------------------------------------------------------------ Badge
type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

const badgeStyles: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        badgeStyles[tone],
      )}
    >
      {children}
    </span>
  )
}

// ------------------------------------------------------------------ Alert
export function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-500">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {label}
    </div>
  )
}
