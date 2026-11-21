import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type {
  InterviewConfig,
  InterviewReport,
  InterviewSession,
  InterviewSummary,
  InterviewTurn,
} from '@/lib/types'

export function useInterviews() {
  return useQuery({ queryKey: ['interviews'], queryFn: () => api<InterviewSummary[]>('/interviews') })
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: ['interview', id],
    // deadline_ms is computed here (outside render) from the server's remaining seconds.
    queryFn: async () => {
      const session = await api<InterviewSession>(`/interviews/${id}`)
      return { ...session, deadline_ms: Date.now() + session.remaining_seconds * 1000 }
    },
    staleTime: Infinity, // the room drives its own state after loading once
  })
}

/** Interviews that can still be started in the rolling 24 hours (5: what a free Groq key
 * carries; backend/app/services/interview_allowance.py). */
export interface InterviewAllowance {
  limit: number
  used: number
  remaining: number
  next_available_at: string | null
}

export function useInterviewAllowance() {
  return useQuery({
    queryKey: ['interview-allowance'],
    queryFn: () => api<InterviewAllowance>('/interviews/allowance'),
    refetchInterval: 60_000, // the window rolls: a slot can free up while the page is open
  })
}

/** "today at 14:20" or "tomorrow at 09:05", in the user's own time zone. */
export function formatNextSlot(iso: string) {
  const at = new Date(iso)
  const time = at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${at.toDateString() === new Date().toDateString() ? 'today' : 'tomorrow'} at ${time}`
}

export function useStartInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: InterviewConfig) =>
      api<InterviewSession>('/interviews', { method: 'POST', json: config }),
    onSuccess: (session) => {
      queryClient.setQueryData(['interview', session.id], {
        ...session,
        deadline_ms: Date.now() + session.remaining_seconds * 1000,
      })
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['interview-allowance'] })
    },
  })
}

// Plain functions (not hooks): the interview room calls these from its voice loop.
// Each converts the server's remaining_seconds into an absolute deadline right away.
const withDeadline = (turn: InterviewTurn) => ({
  ...turn,
  deadline_ms: Date.now() + turn.remaining_seconds * 1000,
})

export function sendAudioAnswer(id: string, audio: Blob) {
  const form = new FormData()
  const ext = audio.type.includes('ogg') ? 'ogg' : audio.type.includes('mp4') ? 'm4a' : 'webm'
  form.append('audio', audio, `answer.${ext}`)
  return api<InterviewTurn>(`/interviews/${id}/answer`, { method: 'POST', body: form }).then(withDeadline)
}

/** Typed answer, or a spoken answer already transcribed during the pause (with its length). */
export function sendTextAnswer(id: string, text: string, durationSec?: number | null) {
  const form = new FormData()
  form.append('text', text)
  if (durationSec) form.append('duration_sec', String(durationSec))
  return api<InterviewTurn>(`/interviews/${id}/answer`, { method: 'POST', body: form }).then(withDeadline)
}

/** Speech-to-text only; doesn't change the interview (used speculatively during pauses). */
export function transcribeAudio(id: string, audio: Blob) {
  const form = new FormData()
  form.append('audio', audio, `answer.${audio.type.includes('ogg') ? 'ogg' : 'webm'}`)
  return api<{ text: string; duration_sec: number | null }>(`/interviews/${id}/transcribe`, {
    method: 'POST',
    body: form,
  })
}

/** Start the interview clock (idempotent: safe to call again when resuming). */
export function beginInterview(id: string) {
  return api<InterviewTurn>(`/interviews/${id}/begin`, { method: 'POST' }).then(withDeadline)
}

export function endInterview(id: string) {
  return api<InterviewTurn>(`/interviews/${id}/end`, { method: 'POST' }).then(withDeadline)
}

/** The candidate's emoji rating (1-5) of the interview, plus an optional comment. */
export function sendInterviewFeedback(id: string, rating: number, comment: string) {
  return api<void>(`/interviews/${id}/feedback`, {
    method: 'POST',
    json: { rating, comment: comment.trim() || null },
  })
}

export function useReport(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['interview-report', id],
    queryFn: () => api<InterviewReport>(`/interviews/${id}/report`, { method: 'POST' }),
    enabled,
    staleTime: Infinity,
    retry: 1,
  })
}
