// The auth context object and the useAuth() hook live here, separate from the
// <AuthProvider> component, so Vite's fast refresh keeps working (component files
// should export only components).

import { createContext, useContext } from 'react'

import type { User } from '@/lib/types'

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
