import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// cn('px-2', isActive && 'bg-brand-50', className): combine class names; when two Tailwind
// classes conflict (px-2 vs px-4), the later one wins instead of both being applied.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
