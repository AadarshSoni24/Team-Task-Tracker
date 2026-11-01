'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, apiFetch } from '@/lib/api'
import type { FieldErrors, InviteResponse } from '@/lib/types'
import { useApiError } from '@/lib/useApiError'
import { Button } from './Button'
import { TextField } from './Field'
import { IconCheck, IconX } from './icons'
import { Modal } from './Modal'

export function InviteModal({
  open,
  onClose,
  teamId,
  teamName,
  onInvited,
}: {
  open: boolean
  onClose: () => void
  teamId: string
  teamName: string
  onInvited: (res: InviteResponse) => void
}) {
  const handleError = useApiError()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail('')
      setErrors({})
      setSuccess(null)
    }
  }, [open])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = email.trim()
    setSuccess(null)
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) {
      setErrors({ email: ['Enter a valid email address.'] })
      return
    }
    setSubmitting(true)
    setErrors({})
    try {
      const res = await apiFetch<InviteResponse>(`/teams/${teamId}/invite`, { method: 'POST', body: { email: value } })
      setSuccess(res.detail)
      setEmail('')
      onInvited(res)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ email: [err.detail] })
      else handleError(err, { keys: ['email'], set: setErrors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="invite-modal-title">
      <form onSubmit={onSubmit} noValidate>
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 id="invite-modal-title" className="text-[14px] font-semibold">
            Invite to {teamName}
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
        <p className="px-5 pt-1 text-[12.5px] text-muted">
          Existing users join right away. Anyone else joins automatically when they sign up.
        </p>
        <div className="space-y-3 px-5 pt-5 pb-5">
          {success && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-line-strong bg-raised px-3 py-2 text-[12.5px] text-fg animate-fade-up"
            >
              <IconCheck size={14} className="mt-0.5 shrink-0 text-muted" />
              <span>{success}</span>
            </div>
          )}
          <TextField
            label="Email address"
            type="email"
            autoComplete="off"
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            errors={errors.email}
            data-autofocus
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  )
}

