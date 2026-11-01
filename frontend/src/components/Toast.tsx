'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { IconCheck, IconX } from './icons'

type ToastKind = 'error' | 'success' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
  leaving?: boolean
}

interface ToastApi {
  error: (message: string) => void
  success: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 160)
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++
      setToasts((ts) => [...ts.slice(-3), { id, kind, message }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3800)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      error: (m) => push('error', m),
      success: (m) => push('success', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-3 bottom-3 z-[80] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border border-line-strong bg-surface-popover/95 px-3 py-2.5 text-[13px] text-fg shadow-[0_12px_32px_-8px_rgb(0_0_0/0.6)] backdrop-blur transition-all duration-150 animate-toast-in ${
              t.leaving ? 'translate-x-4 opacity-0' : ''
            }`}
          >
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
                t.kind === 'error'
                  ? 'bg-rose-500/15 text-rose-400'
                  : 'bg-white/10 text-fg'
              }`}
            >
              {t.kind === 'error' ? <span className="text-[10px] font-bold">!</span> : <IconCheck size={11} />}
            </span>
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mr-1 rounded p-0.5 text-faint transition-colors hover:text-fg"
              aria-label="Dismiss notification"
            >
              <IconX size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

