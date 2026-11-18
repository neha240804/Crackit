// Layout for logged-in pages: a light top bar + the page (<Outlet />).
// A top bar (not a sidebar) fits a single-purpose app with only a few sections.
// The bar is solid paper with a hairline border: no blur, no translucency.

import { LogOut, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { Logo } from '@/components/Brand'
import { buttonClass } from '@/components/ui/styles'
import { useAuth } from '@/features/auth/context'
import { cn } from '@/lib/utils'

// `short` is shown on phones, where three full labels plus the account buttons don't fit.
const NAV = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home' },
  { to: '/resume', label: 'ATS check', short: 'ATS' },
  { to: '/prep', label: 'Question prep', short: 'Prep' },
]

export function AppShell() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6 sm:gap-8 sm:px-8">
          {/* phones: just the round mark, so the nav and account buttons fit on one line */}
          <Link to="/dashboard" aria-label="MockInterview home"><Logo className="max-sm:[&>span:last-child]:hidden" /></Link>
          <nav className="flex items-center gap-1 sm:gap-5" aria-label="Main">
            {NAV.map(({ to, label, short }) => (
              <NavLink key={to} to={to} className={({ isActive }) => cn(
                'relative px-1.5 py-1 text-sm transition-colors',
                isActive
                  ? 'font-medium text-ink-900 after:absolute after:inset-x-1.5 after:-bottom-[21px] after:h-px after:bg-ink-900'
                  : 'text-ink-500 hover:text-ink-900')}>
                <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link to="/interviews/new" className={buttonClass('primary', 'hidden px-4 py-2 sm:inline-flex')}>
              <Plus className="size-4" aria-hidden /> New interview
            </Link>
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 font-serif text-sm font-semibold text-brand-700"
              title={user?.email}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
            <button onClick={logout} className="rounded-full p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
              aria-label="Log out" title="Log out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
        <Outlet />
      </main>
    </div>
  )
}

/** Page title block: optional kicker, serif title, one-line description, optional action.
 * `compact` = for tool pages (ATS check, new interview) where the content matters more
 * than a large editorial title. */
export function PageHeader({ eyebrow, title, description, action, compact = false }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode; compact?: boolean
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-6', compact ? 'mb-8' : 'mb-12')}>
      <div className={compact ? 'max-w-3xl' : 'max-w-2xl'}>
        {eyebrow && <p className={cn('text-xs font-medium tracking-[0.14em] text-brand-700 uppercase', compact ? 'mb-3' : 'mb-4')}>{eyebrow}</p>}
        <h1 className={cn('leading-tight font-semibold', compact ? 'text-3xl sm:text-[2rem]' : 'text-4xl sm:text-[2.75rem]')}>{title}</h1>
        {description && <p className={cn('text-ink-500', compact ? 'mt-1.5 text-sm sm:text-[0.95rem]' : 'mt-3')}>{description}</p>}
      </div>
      {action}
    </header>
  )
}
