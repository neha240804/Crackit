// Password reset: /forgot-password asks for the email and sends a one-time link;
// /reset-password?token=... (the link) sets the new password. Logged-out pages.
// The server answers the same whether or not the email has an account, so the page does too.

import { CheckCircle2, MailCheck } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { Logo } from '@/components/Brand'
import { Button, ErrorAlert, Input } from '@/components/ui'
import { api } from '@/lib/api'

function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-14">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-12 inline-block" aria-label="Crackit home"><Logo /></Link>
        <h1 className="text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-ink-500">{lead}</p>
        {children}
        <p className="mt-8 text-center text-sm text-ink-500">
          <Link to="/login" className="font-medium text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  )
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email'))
    setError(null)
    setSubmitting(true)
    try {
      const res = await api<{ message: string }>('/auth/forgot-password', { method: 'POST', json: { email } })
      setSent(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Shell title="Reset your password" lead="Enter your account's email and we'll send you a link to choose a new password.">
      {sent ? (
        <div className="mt-10 flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-ink-700" role="status">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
          <p>{sent} It works once, for 30 minutes. Check your spam folder if it doesn't arrive.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <Input label="Email" name="email" type="email" required autoComplete="email" />
          {error && <ErrorAlert message={error} />}
          <Button type="submit" loading={submitting} className="w-full py-3">Send reset link</Button>
        </form>
      )}
    </Shell>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== String(form.get('confirm'))) {
      setError('The two passwords are different.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await api('/auth/reset-password', { method: 'POST', json: { token, password } })
      setDone(true)
      window.setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <Shell title="Link incomplete" lead="This page needs the link from the reset email. Open the link from the email, or request a new one.">
        <Link to="/forgot-password" className="mt-8 inline-block font-medium text-brand-700 underline underline-offset-4">Request a new link</Link>
      </Shell>
    )
  }
  return (
    <Shell title="Choose a new password" lead="Every device that was logged in will be signed out.">
      {done ? (
        <p className="mt-10 flex items-center gap-2 text-success-700" role="status">
          <CheckCircle2 className="size-5" aria-hidden /> Password changed. Taking you to log in…
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <Input label="New password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <Input label="Repeat it" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          {error && (
            <div className="space-y-2">
              <ErrorAlert message={error} />
              {/invalid or has expired/.test(error) && (
                <Link to="/forgot-password" className="text-sm font-medium text-brand-700 underline underline-offset-4">Request a new link</Link>
              )}
            </div>
          )}
          <Button type="submit" loading={submitting} className="w-full py-3">Change password</Button>
        </form>
      )}
    </Shell>
  )
}
