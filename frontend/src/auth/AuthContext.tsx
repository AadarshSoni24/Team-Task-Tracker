'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  ApiError,
  apiFetch,
  clearTokens,
  getRefreshToken,
  hasAccessToken,
  refreshSession,
  setAuthFailureHandler,
  setTokens,
} from '@/lib/api'
import type { AuthResponse, Role, User } from '@/lib/types'

type Status = 'loading' | 'authenticated' | 'anonymous'

interface AuthApi {
  user: User | null
  status: Status
  login: (email: string, password: string) => Promise<void>
  register: (input: { name: string; email: string; password: string; role: Role }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const router = useRouter()

  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null)
      setStatus('anonymous')
      router.replace('/login')
    })
    return () => setAuthFailureHandler(null)
  }, [router])

  // Restore the session on load: rotate the stored refresh token, then load the profile.
  useEffect(() => {
    if (!getRefreshToken()) {
      setStatus('anonymous')
      return
    }
    ;(async () => {
      try {
        if (!hasAccessToken()) await refreshSession()
        const me = await apiFetch<User>('/auth/me')
        setUser(me)
        setStatus('authenticated')
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 0)) clearTokens()
        setUser(null)
        setStatus('anonymous')
      }
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
    setTokens(res.access, res.refresh)
    setUser(res.user)
    setStatus('authenticated')
  }, [])

  const register = useCallback(
    async (input: { name: string; email: string; password: string; role: Role }) => {
      const res = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: input,
        auth: false,
      })
      setTokens(res.access, res.refresh)
      setUser(res.user)
      setStatus('authenticated')
    },
    [],
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setStatus('anonymous')
    router.replace('/login')
  }, [router])

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** For use under RequireAuth, where a user is guaranteed. */
export function useUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('No authenticated user')
  return user
}

