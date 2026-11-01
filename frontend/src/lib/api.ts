import { API_BASE_URL } from '@/config'
import type { FieldErrors } from './types'

const REFRESH_KEY = 'cadence.refresh'

// Access token lives only in memory; the refresh token persists in localStorage.
let accessToken: string | null = null
let refreshInFlight: Promise<void> | null = null
let authFailureHandler: (() => void) | null = null

export class ApiError extends Error {
  status: number
  detail: string
  errors?: FieldErrors
  code?: string

  constructor(status: number, detail: string, errors?: FieldErrors, code?: string) {
    super(detail)
    this.status = status
    this.detail = detail
    this.errors = errors
    this.code = code
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function hasAccessToken() {
  return accessToken !== null
}

export function setTokens(access: string, refresh: string) {
  accessToken = access
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(REFRESH_KEY, refresh)
  } catch {
    /* storage unavailable */
  }
}

export function clearTokens() {
  accessToken = null
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    /* storage unavailable */
  }
}

/** Registers the callback used when the session cannot be recovered. */
export function setAuthFailureHandler(handler: (() => void) | null) {
  authFailureHandler = handler
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: { detail?: unknown; errors?: FieldErrors; code?: string } | null = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON body */
  }
  const detail =
    typeof body?.detail === 'string' ? body.detail : `Request failed with status ${res.status}.`
  return new ApiError(res.status, detail, body?.errors, body?.code)
}

async function send(
  path: string,
  method: string,
  body: unknown,
  token: string | null,
  signal?: AbortSignal,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(API_BASE_URL.replace(/\/$/, '') + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError(0, "Can't reach the Cadence server. Check your connection and try again.")
  }
}

/** Rotates the token pair. Concurrent callers share a single in-flight request. */
export function refreshSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refresh = getRefreshToken()
      if (!refresh) throw new ApiError(401, 'You are not signed in.')
      const res = await send('/auth/refresh', 'POST', { refresh }, null)
      if (!res.ok) throw await toApiError(res)
      const data = (await res.json()) as { access: string; refresh: string }
      setTokens(data.access, data.refresh)
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

function failSession(): ApiError {
  clearTokens()
  authFailureHandler?.()
  return new ApiError(401, 'Your session has ended. Please log in again.', undefined, 'session_ended')
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  /** Send the bearer token and handle expiry (default true). */
  auth?: boolean
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options

  if (auth && refreshInFlight) {
    await refreshInFlight.catch(() => undefined)
  }

  const usedToken = auth ? accessToken : null
  let res = await send(path, method, body, usedToken, signal)

  if (auth && res.status === 401) {
    const err = await toApiError(res)
    if (err.code !== 'token_expired') throw failSession()

    // Another request may already have rotated the pair; only refresh if not.
    if (accessToken === usedToken) {
      try {
        await refreshSession()
      } catch (refreshErr) {
        if (refreshErr instanceof ApiError && refreshErr.status === 0) throw refreshErr
        throw failSession()
      }
    }
    res = await send(path, method, body, accessToken, signal)
    if (res.status === 401) throw failSession()
  }

  if (!res.ok) throw await toApiError(res)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

