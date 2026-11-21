// Auth state for the whole app, shared through React Context.
//
// - The JWT lives in localStorage so a page refresh keeps you logged in.
// - The current user comes from GET /auth/me via TanStack Query (cached under ['me']).
// - login/register/logout update the token and the cache; components just call useAuth().

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { activateGroqKey, deactivateGroqKey } from '@/features/account/groqKey'
import { api, LOGOUT_EVENT, tokenStore } from '@/lib/api'
import type { TokenResponse, User } from '@/lib/types'

import { AuthContext, type AuthContextValue } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  // Token in React state (not just localStorage) so login/logout re-render the app.
  const [token, setToken] = useState<string | null>(() => tokenStore.get())
  const hasToken = token !== null

  const { data: user, isLoading } = useQuery({
    queryKey: ['me', token],
    queryFn: () => api<User>('/auth/me'),
    enabled: hasToken, // no token -> don't even ask
    retry: false,
    staleTime: Infinity, // the user's name/email rarely change during a session
  })

  // Unlock this user's own Groq key (kept encrypted in this browser) once they are known.
  useEffect(() => {
    if (user) void activateGroqKey(user.id)
  }, [user])

  const logout = useCallback(() => {
    deactivateGroqKey() // drop the decrypted key from memory; the encrypted copy stays for next login
    tokenStore.clear()
    setToken(null)
    queryClient.clear() // drop every cached response that belonged to this user
  }, [queryClient])

  // api.ts fires this event when the server says our token is invalid/expired.
  useEffect(() => {
    window.addEventListener(LOGOUT_EVENT, logout)
    return () => window.removeEventListener(LOGOUT_EVENT, logout)
  }, [logout])

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token } = await api<TokenResponse>('/auth/login', {
        method: 'POST',
        json: { email, password },
      })
      tokenStore.set(access_token)
      setToken(access_token) // triggers the ['me', token] query above
    },
    [],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await api<User>('/auth/register', { method: 'POST', json: { name, email, password } })
      await login(email, password)
    },
    [login],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: hasToken ? (user ?? null) : null,
      isLoading: hasToken && isLoading,
      login,
      register,
      logout,
    }),
    [hasToken, user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
