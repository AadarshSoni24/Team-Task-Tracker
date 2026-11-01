'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from './api'
import type { Activity } from './types'
import { useApiError } from './useApiError'

const POLL_MS = 5000
const PAGE = 50
const MAX_LIMIT = 200
const HIGHLIGHT_MS = 2400

function newestOf(items: Activity[]): string | null {
  let max: string | null = null
  for (const i of items) if (!max || new Date(i.created_at) > new Date(max)) max = i.created_at
  return max
}

/**
 * Team activity feed: initial load, 5s `since` polling while the tab is visible,
 * immediate refresh after the user's own actions, and "load more" up to 200.
 */
export function useActivity(teamId: string | undefined, enabled: boolean) {
  const handleError = useApiError()
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set())
  const [live, setLive] = useState(false)

  const itemsRef = useRef<Activity[]>([])
  const cursorRef = useRef<string | null>(null)
  const loadedRef = useRef(false)
  const busyRef = useRef(false)
  const queuedRef = useRef(false)
  const teamRef = useRef(teamId)
  const limitRef = useRef(PAGE)
  teamRef.current = teamId

  const apply = useCallback((next: Activity[]) => {
    itemsRef.current = next
    cursorRef.current = newestOf(next)
    setItems(next)
  }, [])

  const flash = useCallback((ids: string[]) => {
    if (!ids.length) return
    setNewIds((prev) => new Set([...prev, ...ids]))
    window.setTimeout(() => {
      setNewIds((prev) => {
        const n = new Set(prev)
        ids.forEach((id) => n.delete(id))
        return n
      })
    }, HIGHLIGHT_MS)
  }, [])

  // Initial load (and reset when switching teams).
  useEffect(() => {
    if (!teamId || !enabled) return
    let cancelled = false
    loadedRef.current = false
    limitRef.current = PAGE
    setLimit(PAGE)
    setLoading(true)
    apply([])
    apiFetch<Activity[]>(`/teams/${teamId}/activity/?limit=${PAGE}`)
      .then((data) => {
        if (cancelled) return
        apply(data)
        loadedRef.current = true
      })
      .catch((err) => !cancelled && handleError(err))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [teamId, enabled, apply, handleError])

  const poll = useCallback(async () => {
    const team = teamRef.current
    if (!team || !loadedRef.current) return
    if (busyRef.current) {
      queuedRef.current = true
      return
    }
    busyRef.current = true
    try {
      const since = cursorRef.current
      const path = since
        ? `/teams/${team}/activity/?since=${encodeURIComponent(since)}`
        : `/teams/${team}/activity/?limit=${limitRef.current}`
      const data = await apiFetch<Activity[]>(path)
      if (team !== teamRef.current || !data.length) return
      const seen = new Set(itemsRef.current.map((i) => i.id))
      const fresh = data.filter((d) => !seen.has(d.id))
      if (!fresh.length) return
      fresh.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      apply([...fresh, ...itemsRef.current])
      flash(fresh.map((f) => f.id))
    } catch {
      // Background polling stays quiet; the next tick will retry.
    } finally {
      busyRef.current = false
      if (queuedRef.current) {
        queuedRef.current = false
        void poll()
      }
    }
  }, [apply, flash])

  // Poll every 5s while the tab is visible; pause when hidden, resume on focus.
  useEffect(() => {
    if (!teamId || !enabled) return
    let timer: number | undefined
    const start = () => {
      if (timer !== undefined) return
      timer = window.setInterval(() => void poll(), POLL_MS)
      setLive(true)
    }
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer)
      timer = undefined
      setLive(false)
    }
    const resume = () => {
      if (document.visibilityState === 'hidden' || timer !== undefined) return
      void poll()
      start()
    }
    const onVisibility = () => (document.visibilityState === 'hidden' ? stop() : resume())
    if (document.visibilityState !== 'hidden') start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', resume)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', resume)
    }
  }, [teamId, enabled, poll])

  const loadMore = useCallback(async () => {
    const team = teamRef.current
    const next = Math.min(limitRef.current + PAGE, MAX_LIMIT)
    if (!team || next === limitRef.current) return
    setLoadingMore(true)
    try {
      const data = await apiFetch<Activity[]>(`/teams/${team}/activity/?limit=${next}`)
      if (team !== teamRef.current) return
      limitRef.current = next
      setLimit(next)
      // The larger newest-first page already includes anything polled in.
      apply(data)
    } catch (err) {
      handleError(err)
    } finally {
      setLoadingMore(false)
    }
  }, [apply, handleError])

  const hasMore = limit < MAX_LIMIT && items.length >= limit

  return { items, loading, loadingMore, newIds, live, refresh: poll, loadMore, hasMore, limit }
}

