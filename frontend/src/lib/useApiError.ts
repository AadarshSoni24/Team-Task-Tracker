'use client'

import { useCallback } from 'react'
import { useToast } from '@/components/Toast'
import { ApiError } from './api'
import type { FieldErrors } from './types'

/**
 * 400s with field errors go to the matching inputs; everything else becomes a toast.
 * Field errors for keys the form doesn't render are surfaced as a toast too.
 */
export function useApiError() {
  const toast = useToast()
  return useCallback(
    (err: unknown, fields?: { keys: string[]; set: (errors: FieldErrors) => void }) => {
      if (!(err instanceof ApiError)) {
        if ((err as Error)?.name === 'AbortError') return
        toast.error('Something went wrong. Please try again.')
        return
      }
      if (err.code === 'session_ended') return
      if (err.status === 400 && err.errors && fields) {
        const known: FieldErrors = {}
        const unknown: string[] = []
        for (const [key, msgs] of Object.entries(err.errors)) {
          if (fields.keys.includes(key)) known[key] = msgs
          else unknown.push(...msgs)
        }
        fields.set(known)
        if (unknown.length) toast.error(unknown.join(' '))
        else if (!Object.keys(known).length) toast.error(err.detail)
        return
      }
      toast.error(err.detail)
    },
    [toast],
  )
}

