// Asked once, the moment an interview ends (before the report): how did it feel? Five emoji,
// one optional comment, and it never blocks the report: "Skip" and errors both go straight on.
// Stored on the interview (POST /interviews/{id}/feedback) as product feedback.

import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { sendInterviewFeedback } from './api'

const FACES = [
  { rating: 1, emoji: '😞', label: 'Poor' },
  { rating: 2, emoji: '😕', label: 'Not great' },
  { rating: 3, emoji: '😐', label: 'Okay' },
  { rating: 4, emoji: '🙂', label: 'Good' },
  { rating: 5, emoji: '🤩', label: 'Excellent' },
]

export function EndFeedback({ sessionId, interviewer, onDone }: {
  sessionId: string
  interviewer: string
  onDone: () => void
}) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)

  async function submit() {
    if (rating === null) return
    setSending(true)
    try {
      await sendInterviewFeedback(sessionId, rating, comment)
    } catch {
      // Feedback is optional: never keep the candidate from their report over it.
    }
    onDone()
  }

  const chosen = FACES.find((f) => f.rating === rating)
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#171614]/85 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="end-feedback-title">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#201f1c] p-7 text-center shadow-[0_20px_60px_rgb(0_0_0/0.45)] sm:p-8">
        <p className="text-xs font-medium tracking-[0.14em] text-brand-300 uppercase">Interview complete</p>
        <h2 id="end-feedback-title" className="mt-3 font-serif text-2xl font-semibold text-paper">
          How was your interview with {interviewer}?
        </h2>
        <p className="mt-2 text-sm text-ink-400">Your feedback helps us make the interviewer better.</p>

        <div className="mt-6 flex justify-center gap-2 sm:gap-3" role="radiogroup" aria-label="Rating">
          {FACES.map((f) => {
            const on = rating === f.rating
            return (
              <button key={f.rating} type="button" role="radio" aria-checked={on} aria-label={f.label} title={f.label}
                onClick={() => setRating(f.rating)}
                className={cn('flex size-12 items-center justify-center rounded-2xl text-[1.75rem] transition-[transform,background-color,opacity] duration-150 sm:size-14',
                  on ? 'scale-110 bg-brand-500/20 ring-2 ring-brand-300/70'
                    : rating === null ? 'bg-white/[0.04] hover:-translate-y-0.5 hover:bg-white/[0.08]'
                      : 'bg-white/[0.03] opacity-45 hover:opacity-80')}>
                <span aria-hidden>{f.emoji}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 h-5 text-sm text-ink-300" aria-live="polite">{chosen?.label}</p>

        {rating !== null && (
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3}
            placeholder={rating <= 3 ? 'What could be better? (optional)' : 'Anything you liked or would change? (optional)'}
            className="mt-4 w-full resize-none rounded-2xl border border-white/[0.08] bg-[#171614] px-4 py-3 text-sm text-paper placeholder:text-ink-500 focus:border-brand-300/50 focus:outline-none" />
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={onDone} disabled={sending}
            className="rounded-full px-5 py-2.5 text-sm text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-paper">
            Skip
          </button>
          <button type="button" onClick={() => void submit()} disabled={rating === null || sending}
            className="flex items-center gap-2 rounded-full bg-paper px-6 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-white disabled:opacity-40">
            {sending ? <Loader2 className="size-4 animate-spin" /> : null}
            Send and see report <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
