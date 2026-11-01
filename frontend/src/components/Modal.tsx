'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  onClose,
  labelledBy,
  className = 'max-w-md',
  children,
}: {
  open: boolean
  onClose: () => void
  labelledBy: string
  className?: string
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(raf)
    }
    setShown(false)
    const t = window.setTimeout(() => setMounted(false), 160)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open || !mounted) return
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const target =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [open, mounted])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 pt-[10vh] sm:p-4 sm:pt-[12vh]">
      <div
        className={`fixed inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-150 ${shown ? 'opacity-100' : 'opacity-0'}`}
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onKeyDown={onKeyDown}
        className={`relative w-full rounded-xl border border-line-strong bg-surface-modal shadow-[0_24px_64px_-12px_rgb(0_0_0/0.75),inset_0_1px_0_rgb(255_255_255/0.04)] transition duration-150 ease-out ${
          shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-[0.97] opacity-0'
        } ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

