// Shown when a page fails to render or a lazily loaded page can't be fetched (for example
// right after a deploy, when the old file names no longer exist). Without it the router showed
// its built-in "Unexpected Application Error!" screen with developer details.

import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import { Logo } from '@/components/Brand'

export function RouteError() {
  const error = useRouteError()
  // A chunk that no longer exists after a deploy: a reload fetches the new files.
  const stale = error instanceof Error && /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error.message)
  const notFound = isRouteErrorResponse(error) && error.status === 404
  if (import.meta.env.DEV) console.error(error)
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="max-w-md text-center">
        <Link to="/" aria-label="Crackit home" className="inline-block"><Logo /></Link>
        <h1 className="mt-10 text-3xl font-semibold">
          {notFound ? "This page doesn't exist" : stale ? 'Crackit was just updated' : 'Something went wrong'}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-500">
          {notFound
            ? 'The link may be old or mistyped.'
            : stale
              ? 'Reload the page to get the newest version.'
              : "Sorry about that. Reloading usually fixes it; your interviews and prep are saved."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()}
            className="rounded-full bg-ink-900 px-6 py-2.5 text-sm font-medium text-paper hover:bg-ink-700">
            Reload
          </button>
          <Link to="/" className="rounded-full px-6 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100">Go home</Link>
        </div>
      </div>
    </main>
  )
}
