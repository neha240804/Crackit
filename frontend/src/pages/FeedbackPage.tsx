// Feedback (/feedback, in the top bar after ATS check): tell us what's broken, what you'd like,
// or how the interviewer did. Stored per account (POST /feedback); the page lists what you
// sent before. Single interviews are also rated as they end (features/interview/EndFeedback).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bug, CheckCircle2, Lightbulb, MessageCircle, Mic, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { PageHero } from '@/components/PageHero'
import { Button, Card, ErrorAlert } from '@/components/ui'
import { fieldClass } from '@/components/ui/styles'
import { api } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'

type Category = 'bug' | 'idea' | 'interviewer' | 'other'

interface FeedbackItem {
  id: string
  category: Category
  rating: number | null
  message: string
  created_at: string
}

const CATEGORIES: { id: Category; label: string; icon: typeof Bug; hint: string }[] = [
  { id: 'bug', label: "Something's broken", icon: Bug, hint: 'What happened, and what did you expect? Which page?' },
  { id: 'idea', label: 'An idea', icon: Lightbulb, hint: 'What would make Crackit more useful for you?' },
  { id: 'interviewer', label: 'The interviewer', icon: Mic, hint: 'Questions, voice, follow-ups, the report: what worked, what didn\'t?' },
  { id: 'other', label: 'Something else', icon: MessageCircle, hint: 'Anything on your mind.' },
]

const FACES = [
  { rating: 1, emoji: '😞', label: 'Poor' },
  { rating: 2, emoji: '😕', label: 'Not great' },
  { rating: 3, emoji: '😐', label: 'Okay' },
  { rating: 4, emoji: '🙂', label: 'Good' },
  { rating: 5, emoji: '🤩', label: 'Excellent' },
]

export function FeedbackPage() {
  const queryClient = useQueryClient()
  const mine = useQuery({ queryKey: ['my-feedback'], queryFn: () => api<FeedbackItem[]>('/feedback') })
  const [category, setCategory] = useState<Category>('idea')
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const send = useMutation({
    mutationFn: () => api<FeedbackItem>('/feedback', { method: 'POST', json: { category, rating, message } }),
    onSuccess: () => {
      setMessage('')
      setRating(null)
      setSent(true)
      void queryClient.invalidateQueries({ queryKey: ['my-feedback'] })
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSent(false)
    send.mutate()
  }

  const current = CATEGORIES.find((c) => c.id === category)!
  return (
    <div>
      <div className="mb-8">
        <PageHero compact eyebrow="Feedback" title="Tell us what you think"
          description="Crackit is new, and your feedback decides what gets better next. Every message is read." />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <fieldset>
              <legend className="mb-2.5 text-sm font-medium text-ink-700">What is it about?</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map(({ id, label, icon: Icon }) => {
                  const on = category === id
                  return (
                    <button key={id} type="button" aria-pressed={on} onClick={() => setCategory(id)}
                      className={cn('flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors',
                        on ? 'border-transparent bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-500/40' : 'border-ink-200 bg-white/60 text-ink-700 hover:border-ink-300')}>
                      <Icon className={cn('size-4 shrink-0', on ? 'text-brand-700' : 'text-ink-400')} aria-hidden /> {label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2.5 text-sm font-medium text-ink-700">How is Crackit so far? <span className="font-normal text-ink-400">(optional)</span></legend>
              <div className="flex gap-2" role="radiogroup" aria-label="Rating">
                {FACES.map((f) => (
                  <button key={f.rating} type="button" role="radio" aria-checked={rating === f.rating} aria-label={f.label} title={f.label}
                    onClick={() => setRating(rating === f.rating ? null : f.rating)}
                    className={cn('flex size-11 items-center justify-center rounded-xl text-2xl transition-[transform,background-color,opacity]',
                      rating === f.rating ? 'scale-110 bg-brand-50 ring-2 ring-brand-500/50' : rating === null ? 'bg-ink-100/60 hover:bg-ink-100' : 'bg-ink-100/40 opacity-50 hover:opacity-90')}>
                    <span aria-hidden>{f.emoji}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Your message</span>
              <textarea value={message} onChange={(e) => { setMessage(e.target.value); setSent(false) }} rows={6} maxLength={3000}
                placeholder={current.hint} className={cn(fieldClass, 'resize-y')} required minLength={3} />
            </label>

            {send.error && <ErrorAlert message={send.error.message} />}
            {sent && !send.error && (
              <p className="flex items-center gap-2 text-sm text-success-700" role="status">
                <CheckCircle2 className="size-4" aria-hidden /> Thanks! Your feedback was sent.
              </p>
            )}
            <Button type="submit" loading={send.isPending} disabled={message.trim().length < 3}>
              <Send className="size-4" aria-hidden /> Send feedback
            </Button>
          </form>
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold">What you've sent</h2>
          {mine.data && mine.data.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {mine.data.map((f) => (
                <li key={f.id} className="border-l-2 border-brand-200 pl-4">
                  <p className="text-xs text-ink-500">
                    {CATEGORIES.find((c) => c.id === f.category)?.label ?? f.category} · {formatDate(f.created_at)}
                    {f.rating && <> · {FACES[f.rating - 1].emoji}</>}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-700">{f.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Nothing yet. After each interview you can also rate it with an emoji; that goes straight to the people who build the interviewer.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
