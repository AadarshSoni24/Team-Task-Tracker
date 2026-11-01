'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { IconCheck } from './icons'

export interface MenuOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  hint?: string
}

interface SelectMenuProps<T extends string> {
  value: T | null
  options: MenuOption<T>[]
  onChange: (value: T) => void
  /** Accessible name for the trigger button. */
  label: string
  /** Small heading shown at the top of the menu. */
  heading?: string
  children: ReactNode
  triggerClassName?: string
  disabled?: boolean
  align?: 'start' | 'end'
  width?: number
  emptyText?: string
}

export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  label,
  heading,
  children,
  triggerClassName = '',
  disabled,
  align = 'start',
  width = 220,
  emptyText = 'Nothing to choose from',
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const close = useCallback((refocus = true) => {
    setOpen(false)
    setPos(null)
    if (refocus) btnRef.current?.focus()
  }, [])

  function openMenu() {
    if (disabled) return
    const idx = options.findIndex((o) => o.value === value)
    setActive(idx >= 0 ? idx : 0)
    setOpen(true)
  }

  // Position the menu next to the trigger, flipping above when there's no room below.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const h = menuRef.current?.offsetHeight ?? 200
    const vw = window.innerWidth
    let left = align === 'end' ? r.right - width : r.left
    left = Math.max(8, Math.min(left, vw - width - 8))
    let top = r.bottom + 4
    if (top + h > window.innerHeight - 8 && r.top - h - 4 > 8) top = r.top - h - 4
    setPos({ top, left })
    menuRef.current?.focus()
  }, [open, align, width])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return
      close(false)
    }
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return
      close(false)
    }
    const onResize = () => close(false)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, close])

  function choose(i: number) {
    const opt = options[i]
    if (!opt) return
    close()
    if (opt.value !== value) onChange(opt.value)
  }

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % Math.max(options.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + options.length) % Math.max(options.length, 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(options.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      choose(active)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      close()
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (open) close()
          else openMenu()
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            openMenu()
          }
        }}
        className={triggerClassName}
      >
        {children}
      </button>
      {open && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
            onKeyDown={onMenuKey}
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width }}
            className={`fixed z-[60] max-h-72 overflow-y-auto rounded-lg border border-line-strong bg-surface-popover p-1 shadow-[0_16px_40px_-8px_rgb(0_0_0/0.7)] outline-none transition-opacity duration-150 ${pos ? 'opacity-100' : 'opacity-0'}`}
          >
            {heading && <div className="px-2 pt-1 pb-1.5 text-[11px] font-medium text-faint">{heading}</div>}
            {options.length === 0 && <div className="px-2 py-2 text-[12px] text-faint">{emptyText}</div>}
            {options.map((o, i) => (
              <div
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onClick={(e) => {
                  e.stopPropagation()
                  choose(i)
                }}
                className={`flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] transition-colors duration-100 ${
                  i === active ? 'bg-white/[0.06] text-fg' : 'text-text-menu'
                }`}
              >
                {o.icon}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="truncate text-[11.5px] text-faint">{o.hint}</span>}
                {o.value === value && <IconCheck size={13} className="shrink-0 text-accent" />}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

