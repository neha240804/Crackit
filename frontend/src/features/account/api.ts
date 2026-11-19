// Account settings: the user's own Groq key (bring-your-own-key) and today's free allowance.
//
// The key is write-only from here: we send it once (PUT), and the server only ever answers
// with whether one is saved and a short hint ("gsk_…a1b2"). The key is never kept in the
// browser (no localStorage, no query cache), so nothing on this device can leak it later.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

export interface GroqKeyStatus {
  saved: boolean
  hint: string | null
  added_at: string | null
  readable: boolean
}

export type UsageAction = 'interview' | 'prep' | 'ats' | 'resume'
export type Usage = Record<UsageAction, { used: number; limit: number }>

export function useGroqKey() {
  return useQuery({ queryKey: ['groq-key'], queryFn: () => api<GroqKeyStatus>('/account/groq-key') })
}

export function useUsage() {
  return useQuery({ queryKey: ['usage'], queryFn: () => api<Usage>('/usage') })
}

export function useSaveGroqKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (apiKey: string) => api<GroqKeyStatus>('/account/groq-key', { method: 'PUT', json: { api_key: apiKey } }),
    onSuccess: (status) => {
      queryClient.setQueryData(['groq-key'], status)
      void queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
  })
}

export function useRemoveGroqKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/account/groq-key', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.setQueryData<GroqKeyStatus>(['groq-key'], { saved: false, hint: null, added_at: null, readable: true })
      void queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
  })
}
