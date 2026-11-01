'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from '@/lib/api'
import type { Team } from '@/lib/types'
import { useApiError } from '@/lib/useApiError'

interface TeamsApi {
  teams: Team[]
  loading: boolean
  reload: () => Promise<void>
  addTeam: (team: Team) => void
}

const TeamsContext = createContext<TeamsApi | null>(null)

export function TeamsProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const handleError = useApiError()

  const reload = useCallback(async () => {
    try {
      const data = await apiFetch<Team[]>('/teams/')
      setTeams(data)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  useEffect(() => {
    void reload()
  }, [reload])

  const addTeam = useCallback((team: Team) => {
    setTeams((ts) => [team, ...ts.filter((t) => t.id !== team.id)])
  }, [])

  const value = useMemo(() => ({ teams, loading, reload, addTeam }), [teams, loading, reload, addTeam])
  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeams() {
  const ctx = useContext(TeamsContext)
  if (!ctx) throw new Error('useTeams must be used inside TeamsProvider')
  return ctx
}

