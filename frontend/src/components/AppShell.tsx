// Layout for logged-in pages: a light top bar + the page (<Outlet />).
// A top bar (not a sidebar) fits a single-purpose app with only a few sections.
// The bar is solid paper with a hairline border: no blur, no translucency.

import { LayoutGrid, LogOut, MessageSquareHeart, Plus } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'

import { Logo } from '@/components/Brand'
import { buttonClass } from '@/components/ui/styles'
import { useAuth } from '@/features/auth/context'
import { toolById } from '@/features/product'
import { cn } from '@/lib/utils'

// Ordered by the user's journey: home, study, check the resume, then tell us how it went.
// Mock interviews start from
// the one primary "New interview" button (and the dashboard), so they are not a nav item.
// `short` is shown on phones, where full labels plus the account buttons don't fit.
const NAV = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutGrid },
  { to: '/prep', label: toolById('prep').name, short: toolById('prep').short, icon: toolById('prep').icon },
  { to: '/resume', label: toolById('ats').name, short: toolById('ats').short, icon: toolById('ats').icon },
  { to: '/feedback', label: 'Feedback', short: 'Feedback', icon: MessageSquareHeart },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 sm:gap-8 sm:px-8">
          {/* phones: just the round mark, so the nav and account buttons fit on one line */}
          <Link to="/dashboard" aria-label="Crackit home"><Logo className="max-sm:[&>span:last-child]:hidden" /></Link>
          <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main">
            {/* Phones: icons only, plus the CURRENT page's short label, so you always know where
                you are; three labels + account buttons overflowed a 375 px screen. */}
            {NAV.map(({ to, label, short, icon: Icon }) => (
              <NavLink key={to} to={to} aria-label={label} title={label} className={({ isActive }) => cn(
                'group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] transition-colors sm:px-3 sm:text-sm',
                isActive ? 'active bg-ink-900/[0.06] font-medium text-ink-900' : 'text-ink-500 hover:bg-ink-900/[0.04] hover:text-ink-900')}>
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="hidden max-sm:group-[.active]:inline">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <Link to="/interviews/new" className={buttonClass('primary', 'px-3 py-2 sm:px-4')} aria-label="New interview">
              <Plus className="size-4" aria-hidden /> <span className="hidden sm:inline">New interview</span>
            </Link>
            {/* the avatar opens Settings (your own Groq key) */}
            <NavLink to="/settings" aria-label="Settings" title={`Settings · ${user?.email ?? ''}`}
              className={({ isActive }) => cn('flex size-9 items-center justify-center rounded-full bg-brand-100 font-serif text-sm font-semibold text-brand-700 transition-shadow hover:ring-2 hover:ring-brand-200',
                isActive && 'ring-2 ring-brand-500')}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </NavLink>
            <button onClick={logout} className="rounded-full p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
              aria-label="Log out" title="Log out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>
      {/* key = path: each page enters with a short rise (transform only, never opacity, so a
          paused animation can't leave the page invisible; see the word fade we removed). */}
      <main key={pathname} className="page-enter mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
        <Outlet />
      </main>
    </div>
  )
}
