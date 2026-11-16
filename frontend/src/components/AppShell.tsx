// Layout for logged-in pages: a light top bar + the page (<Outlet />).
// A top bar (not a sidebar) fits a single-purpose app with only a few sections.

import { FileText, LayoutDashboard, LogOut, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { Logo } from '@/components/Brand'
import { useAuth } from '@/features/auth/context'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resume', label: 'My resume', icon: FileText },
]

export function AppShell() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Link to="/dashboard" aria-label="MockInterview AI home"><Logo /></Link>
          <nav className="flex items-center gap-1" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} title={label} aria-label={label} className={({ isActive }) => cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900')}>
                <Icon className="size-4" aria-hidden /> <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/interviews/new"
              className="hidden items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 sm:flex">
              <Plus className="size-4" aria-hidden /> New interview
            </Link>
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
              title={user?.email}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
            <button onClick={logout} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label="Log out" title="Log out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </header>
  )
}
