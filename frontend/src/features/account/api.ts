// Account settings: the user's own Groq key. Bring-your-own-key only: every AI feature needs it.
//
// The key is kept only in this browser, encrypted (see groqKey.ts); the server stores nothing.
// Adding a key = ask the server to check it with Groq (POST /account/groq-key/check, nothing
// saved), then encrypt and keep it here. The hooks below keep the same shape as when the key
// lived on the server, so Settings and the Dashboard read it the same way.

import { useMutation } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

import { useAuth } from '@/features/auth/context'
import { api } from '@/lib/api'

import { forgetGroqKey, groqKeyInfo, storeGroqKey, subscribeGroqKey } from './groqKey'

export interface GroqKeyStatus {
  saved: boolean
  hint: string | null
  added_at: string | null
  readable: boolean
}

const NONE: GroqKeyStatus = { saved: false, hint: null, added_at: null, readable: true }

/** This user's key status in this browser (re-renders when it is added or removed). */
export function useGroqKey() {
  const { user } = useAuth()
  // Snapshot = a string, so React can compare it cheaply between renders.
  const snapshot = useSyncExternalStore(subscribeGroqKey, () => (user ? JSON.stringify(groqKeyInfo(user.id)) : 'null'))
  const info = JSON.parse(snapshot) as { hint: string; addedAt: string } | null
  const data: GroqKeyStatus = info ? { saved: true, hint: info.hint, added_at: info.addedAt, readable: true } : NONE
  return { data, isLoading: false }
}

export function useSaveGroqKey() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (apiKey: string) => {
      const { hint } = await api<{ valid: boolean; hint: string }>('/account/groq-key/check', { method: 'POST', json: { api_key: apiKey } })
      if (!user) throw new Error('Log in again to add your key.')
      await storeGroqKey(user.id, apiKey.trim(), hint)
    },
  })
}

export function useRemoveGroqKey() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async () => { if (user) forgetGroqKey(user.id) },
  })
}
