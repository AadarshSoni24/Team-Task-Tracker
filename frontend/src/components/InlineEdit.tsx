'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { FieldError } from './Field'

/**
 * Click-to-edit text. Saves on blur or Cmd/Ctrl+Enter (Enter also saves single-line), Esc cancels.
 * `onSave` resolves to an error list to keep editing, or null when saved.
 */
export function InlineEdit({
  value,
  onSave,
  label,
  placeholder,
  multiline,
  required,
  className = '',
}: {
  value: string
  onSave: (next: string) => Promise<string[] | null>
  label: string
  placeholder: string
  multiline?: boolean
  required?: boolean
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [errors, setErrors] = useState<string[] | undefined>()
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const errId = `${label.replace(/\s+/g, '-').toLowerCase()}-err`

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      const len = ref.current.value.length
      ref.current.setSelectionRange(len, len)
    }
  }, [editing])

  async function commit() {
    if (savingRef.current) return
    const next = multiline ? draft.replace(/\s+$/, '') : draft.trim()
    if (next === value) {
      setEditing(false)
      setErrors(undefined)
      return
    }
    if (required && !next) {
      setErrors([`${label} can't be empty.`])
      return
    }
    savingRef.current = true
    setSaving(true)
    const result = await onSave(next)
    savingRef.current = false
    setSaving(false)
    if (result) {
      setErrors(result)
      ref.current?.focus()
    } else {
      setErrors(undefined)
      setEditing(false)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setDraft(value)
      setErrors(undefined)
      setEditing(false)
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !multiline)) {
      e.preventDefault()
      void commit()
    }
  }

  const shared = `w-full rounded-md px-2 -mx-2 transition-colors duration-150 ${className}`

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${label.toLowerCase()}`}
        className={`${shared} block cursor-text py-1 text-left hover:bg-white/[0.03] ${value ? '' : 'text-faint'} ${multiline ? 'whitespace-pre-wrap' : ''}`}
      >
        {value || placeholder}
      </button>
    )
  }

  const common = {
    ref,
    value: draft,
    'aria-label': label,
    'aria-invalid': !!errors,
    'aria-describedby': errors ? errId : undefined,
    placeholder,
    disabled: saving,
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
    onBlur: () => void commit(),
    onKeyDown,
    className: `${shared} block bg-white/[0.03] py-1 ring-1 ring-accent/40 focus:outline-none disabled:opacity-70`,
  }

  return (
    <div>
      {multiline ? <textarea {...common} rows={Math.max(4, draft.split('\n').length + 1)} className={`${common.className} resize-y`} /> : <input {...common} />}
      <FieldError id={errId} messages={errors} />
      <p className="mt-1 text-[11px] text-faint">
        {saving ? 'Saving…' : multiline ? 'Ctrl + Enter to save · Esc to cancel' : 'Enter to save · Esc to cancel'}
      </p>
    </div>
  )
}

