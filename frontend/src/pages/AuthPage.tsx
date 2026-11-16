// Login and registration (one component; `mode` decides which).

import { CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'

import { Logo } from '@/components/Brand'
import { Button, ErrorAlert, Input } from '@/components/ui'
import { useAuth } from '@/features/auth/context'

const POINTS = [
  'Real voice conversation with follow-up questions',
  'Feedback on every answer and your speaking style',
  'Practise any topic, your resume, a job post or HR',
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 to-accent-600 p-12 text-white lg:flex lg:flex-col">
        <Link to="/"><Logo dark /></Link>
        <div className="my-auto">
          <h2 className="text-3xl leading-snug font-semibold">Interviews are conversations.<br />Practise them like one.</h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-brand-100"><CheckCircle2 className="size-5 text-white" /> {p}</li>
            ))}
          </ul>
        </div>
        <div className="absolute -right-24 -bottom-24 size-80 rounded-full bg-white/10" aria-hidden />
      </div>

      {/* form */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          <h1 className="text-2xl font-semibold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {isRegister ? 'Free, and ready in a minute.' : 'Log in to continue practising.'}
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isRegister && <Input label="Full name" name="name" required autoComplete="name" />}
            <Input label="Email" name="email" type="email" required autoComplete="email" />
            <Input label="Password" name="password" type="password" required minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {error && <ErrorAlert message={error} />}
            <Button type="submit" loading={submitting} className="w-full py-2.5">
              {isRegister ? 'Create account' : 'Log in'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-ink-500">
            {isRegister ? 'Already have an account? ' : 'New here? '}
            <Link to={isRegister ? '/login' : '/register'} className="font-medium text-brand-600 hover:underline">
              {isRegister ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
