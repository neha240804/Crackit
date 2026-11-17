// Login and registration (one component; `mode` decides which).
// Layout: a quiet editorial panel on the left (desktop only), the form on the right.

import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'

import { Logo } from '@/components/Brand'
import { Button, ErrorAlert, Eyebrow, Input } from '@/components/ui'
import { useAuth } from '@/features/auth/context'

const POINTS = [
  'A spoken conversation with real follow-up questions',
  'Feedback on every answer and on how you speak',
  'Any topic, your resume, a job post or behavioral',
]

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const isRegister = mode === 'register'

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    setError(null)
    setSubmitting(true)
    try {
      if (isRegister) await register(String(form.get('name')), email, password)
      else await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[1.05fr_1fr]">
      {/* editorial panel */}
      <aside className="hidden flex-col border-r border-ink-200/80 bg-paper-deep/70 p-14 lg:flex">
        <Link to="/" aria-label="MockInterview home"><Logo /></Link>
        <div className="my-auto max-w-md">
          <Eyebrow>Voice mock interviews</Eyebrow>
          <p className="mt-6 font-serif text-[2.6rem] leading-[1.1] font-semibold tracking-tight">
            Interviews are conversations. <em className="font-medium text-brand-700">Practise them like one.</em>
          </p>
          <ul className="mt-10 space-y-4 text-ink-500">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-600" />{p}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-ink-400">Free to use · No camera recording</p>
      </aside>

      {/* form */}
      <main className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-12 inline-block lg:hidden" aria-label="MockInterview home"><Logo /></Link>
          <h1 className="text-4xl font-semibold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-3 text-ink-500">
            {isRegister ? 'Free, and ready in a minute.' : 'Log in to continue practising.'}
          </p>
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {isRegister && <Input label="Full name" name="name" required autoComplete="name" />}
            <Input label="Email" name="email" type="email" required autoComplete="email" />
            <Input label="Password" name="password" type="password" required minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {error && <ErrorAlert message={error} />}
            <Button type="submit" loading={submitting} className="w-full py-3">
              {isRegister ? 'Create account' : 'Log in'}
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-ink-500">
            {isRegister ? 'Already have an account? ' : 'New here? '}
            <Link to={isRegister ? '/login' : '/register'}
              className="font-medium text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
              {isRegister ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
