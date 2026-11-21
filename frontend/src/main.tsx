// Entry point. Providers wrap the app so every component can use them:
// QueryClientProvider -> server data cache (TanStack Query)
// AuthProvider        -> current user + login/logout

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { ApiError } from '@/lib/api'
import { AuthProvider } from '@/features/auth/AuthProvider'
// Self-hosted fonts (no request to Google): Fraunces for headings, Inter for text.
import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      // Retry only what can succeed on a second try: network errors (status 0), timeouts,
      // rate limits and server errors. A 4xx answer (not found, forbidden, "add your key")
      // won't change, and the default 3 retries kept e.g. a deleted interview's report on a
      // blank spinner for ~7 s before its message appeared (audit, Nov 2026).
      retry: (failures, error) => {
        const status = error instanceof ApiError ? error.status : 0
        const final = status >= 400 && status < 500 && status !== 408 && status !== 429
        return !final && failures < 2
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
