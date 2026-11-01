'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/api'
import type { FieldErrors, Team } from '@/lib/types'
import { useApiError } from '@/lib/useApiError'
import { Button } from './Button'
import { TextAreaField, TextField } from './Field'
import { IconX } from './icons'
import { Modal } from './Modal'

export function TeamModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (team: Team) => void
}) {
  const handleError = useApiError()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setErrors({})
    }
  }, [open])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setErrors({ name: ['Give your team a name.'] })
      return
    }
    setSubmitting(true)
    setErrors({})
    try {
      const team = await apiFetch<Team>('/teams/', {
        method: 'POST',
        body: { name: name.trim(), description: description.trim() },
      })
      onCreated(team)
      onClose()
    } catch (err) {
      handleError(err, { keys: ['name', 'description'], set: setErrors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="team-modal-title">
      <form onSubmit={onSubmit} noValidate>
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 id="team-modal-title" className="text-[14px] font-semibold">
            Create team
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-faint transition-colors hover:bg-white/[0.06] hover:text-fg"
            aria-label="Close"
          >
            <IconX size={14} />
          </button>
        </div>
        <p className="px-5 pt-1 text-[12.5px] text-muted">You&apos;ll be added as the first member.</p>
        <div className="space-y-4 px-5 pt-5 pb-5">
          <TextField
            label="Team name"
            placeholder="e.g. Platform Squad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            errors={errors.name}
            data-autofocus
          />
          <TextAreaField
            label="Description"
            placeholder="What does this team work on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            errors={errors.description}
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Create team
          </Button>
        </div>
      </form>
    </Modal>
  )
}

