// Routes.
//   public:            /  (landing), /login, /register, /forgot-password, /reset-password, /privacy
//   logged in (light): /dashboard, /resume (ATS check), /prep (question prep), /settings,
//                      /feedback, /interviews/new, /interviews/:id/report, /admin/quality (owner)
//   logged in (dark):  /interviews/:id  (full-screen interview room, no top bar)
//
// Public pages are in the main bundle (first visits land on them). Logged-in pages load
// when first opened (`lazy`): the app used to be ONE 570 KB script that every visitor of the
// landing page downloaded, interview room and prep included.

import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'

import { AppShell } from '@/components/AppShell'
import { RouteError } from '@/components/RouteError'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth/context'
import { AuthPage } from '@/pages/AuthPage'
import { LandingPage } from '@/pages/LandingPage'
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/PasswordResetPages'
import { PrivacyPage } from '@/pages/PrivacyPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <Spinner label="Loading…" />
  if (!user) return <Navigate to="/login" replace />
  return children
}

const router = createBrowserRouter([
  {
    // One error page for every route (a crash, or a page file gone after a deploy), and a
    // spinner while the first lazily loaded page arrives.
    errorElement: <RouteError />,
    hydrateFallbackElement: <Spinner label="Loading…" />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/register', element: <AuthPage mode="register" /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      {
        element: (
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        ),
        errorElement: <RouteError />,
        children: [
          { path: '/dashboard', lazy: async () => ({ Component: (await import('@/pages/DashboardPage')).DashboardPage }) },
          { path: '/resume', lazy: async () => ({ Component: (await import('@/pages/ResumePage')).ResumePage }) },
          { path: '/prep', lazy: async () => ({ Component: (await import('@/pages/PrepPage')).PrepPage }) },
          { path: '/settings', lazy: async () => ({ Component: (await import('@/pages/SettingsPage')).SettingsPage }) },
          { path: '/feedback', lazy: async () => ({ Component: (await import('@/pages/FeedbackPage')).FeedbackPage }) },
          { path: '/interviews/new', lazy: async () => ({ Component: (await import('@/pages/NewInterviewPage')).NewInterviewPage }) },
          // Site owner only (ADMIN_EMAILS); the API answers 404 to everyone else.
          { path: '/admin/quality', lazy: async () => ({ Component: (await import('@/pages/AdminQualityPage')).AdminQualityPage }) },
          { path: '/interviews/:id/report', lazy: async () => ({ Component: (await import('@/pages/InterviewReportPage')).InterviewReportPage }) },
        ],
      },
      {
        path: '/interviews/:id',
        lazy: async () => {
          const { InterviewRoomPage } = await import('@/pages/InterviewRoomPage')
          return { element: <RequireAuth><InterviewRoomPage /></RequireAuth> }
        },
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
