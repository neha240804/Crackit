// Routes.
//   public:            /  (landing), /login, /register
//   logged in (light): /dashboard, /resume (ATS check), /prep (question prep), /settings,
//                      /interviews/new, /interviews/:id/report
//   logged in (dark):  /interviews/:id  (full-screen interview room, no top bar)

import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'

import { AppShell } from '@/components/AppShell'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth/context'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { FeedbackPage } from '@/pages/FeedbackPage'
import { InterviewReportPage } from '@/pages/InterviewReportPage'
import { InterviewRoomPage } from '@/pages/InterviewRoomPage'
import { LandingPage } from '@/pages/LandingPage'
import { NewInterviewPage } from '@/pages/NewInterviewPage'
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/PasswordResetPages'
import { PrepPage } from '@/pages/PrepPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { ResumePage } from '@/pages/ResumePage'
import { SettingsPage } from '@/pages/SettingsPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <Spinner label="Loading…" />
  if (!user) return <Navigate to="/login" replace />
  return children
}

const router = createBrowserRouter([
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
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/resume', element: <ResumePage /> },
      { path: '/prep', element: <PrepPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/feedback', element: <FeedbackPage /> },
      { path: '/interviews/new', element: <NewInterviewPage /> },
      { path: '/interviews/:id/report', element: <InterviewReportPage /> },
    ],
  },
  {
    path: '/interviews/:id',
    element: (
      <RequireAuth>
        <InterviewRoomPage />
      </RequireAuth>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
