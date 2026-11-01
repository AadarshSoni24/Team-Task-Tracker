'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { apiFetch } from '@/lib/api'
import type { FieldErrors, Task, TaskStatus, TeamDetail, UserRef } from '@/lib/types'
import { useApiError } from '@/lib/useApiError'
import { AssigneeDropdown } from './AssigneeDropdown'
import { TeamGlyph } from './Avatar'
import { Button } from './Button'
import { FieldError } from './Field'
import { IconChevronRight, IconX } from './icons'
import { Modal } from './Modal'
import { StatusDropdown } from './StatusDropdown'
import { useToast } from './Toast'

export function TaskModal({
  open,
  onClose,
  team,
  currentUserId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  team: TeamDetail
  currentUserId: string
  onCreated: (task: Task) => void
}) {
  const handleError = useApiError()
  const toast = useToast()
  const titleRef = useRef<HTMLInputElement>(null)

  const defaultAssignee = useCallback((): UserRef | null => {
    const me = team.members.find((m) => m.id === currentUserId) ?? team.members[0]
    return me ? { id: me.id, name: me.name } : null
  }, [team.members, currentUserId])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [assignee, setAssignee] = useState<UserRef | null>(defaultAssignee)
  const [createMore, setCreateMore] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setStatus('pending')
    setAssignee(defaultAssignee())
    setErrors({})
  }, [open, defaultAssignee])

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (submitting) return
    if (!title.trim()) {
      setErrors({ title: ['Give the task a title.'] })
      titleRef.current?.focus()
      return
    }
    setSubmitting(true)
    setErrors({})
    try {
      const body: Record<string, string> = { title: title.trim(), description: description.trim(), status }
      if (assignee) body.assigned_to = assignee.id
      const task = await apiFetch<Task>(`/teams/${team.id}/tasks/`, { method: 'POST', body })
      onCreated(task)
      if (createMore) {
        toast.success(`Created "${task.title}"`)
        setTitle('')
        setDescription('')
        titleRef.current?.focus()
      } else {
        onClose()
      }
    } catch (err) {
      handleError(err, { keys: ['title', 'description', 'assigned_to', 'status'], set: setErrors })
    } finally {
      setSubmitting(false)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="task-modal-title" className="max-w-[640px]">
      <form onSubmit={submit} onKeyDown={onKeyDown} noValidate>
        <div className="flex items-center gap-2 px-4 pt-3.5">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-line-strong bg-white/[0.02] px-1.5 text-[12px] font-medium text-muted">
            <TeamGlyph name={team.name} id={team.id} />
            <span className="max-w-[160px] truncate">{team.name}</span>
          </span>
          <IconChevronRight size={12} className="text-faint" />
          <h2 id="task-modal-title" className="text-[13px] font-medium text-fg">
            New task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-faint transition-colors hover:bg-white/[0.06] hover:text-fg"
            aria-label="Close"
          >
            <IconX size={14} />
          </button>
        </div>

        <div className="px-4 pt-3">
          <label htmlFor="task-title" className="sr-only">
            Task title
          </label>
          <input
            id="task-title"
            ref={titleRef}
            data-autofocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'task-title-err' : undefined}
            className="w-full bg-transparent text-[18px] font-semibold tracking-[-0.015em] text-fg placeholder:text-placeholder-dim focus:outline-none"
          />
          <FieldError id="task-title-err" messages={errors.title} />
          <label htmlFor="task-desc" className="sr-only">
            Description
          </label>
          <textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description…"
            rows={4}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'task-desc-err' : undefined}
            className="mt-1.5 w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-text-secondary placeholder:text-placeholder-dim focus:outline-none"
          />
          <FieldError id="task-desc-err" messages={errors.description} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-4 pt-1 pb-3.5">
          <StatusDropdown status={status} onChange={setStatus} variant="chip" />
          <AssigneeDropdown
            members={team.members}
            value={assignee}
            onChange={(id) => {
              const m = team.members.find((x) => x.id === id)
              if (m) setAssignee({ id: m.id, name: m.name })
            }}
          />
        </div>
        {(errors.assigned_to || errors.status) && (
          <div className="-mt-2 px-4 pb-3">
            <FieldError id="task-assignee-err" messages={[...(errors.assigned_to ?? []), ...(errors.status ?? [])]} />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-line px-4 py-3">
          <span className="mr-auto hidden text-[11.5px] text-faint sm:block">
            <kbd className="rounded border border-line-strong px-1 font-sans">Ctrl</kbd> +{' '}
            <kbd className="rounded border border-line-strong px-1 font-sans">Enter</kbd> to create
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted select-none">
            <button
              type="button"
              role="switch"
              aria-checked={createMore}
              aria-label="Create more"
              onClick={() => setCreateMore((v) => !v)}
              className={`relative h-4 w-7 rounded-full transition-colors duration-150 ${createMore ? 'bg-accent' : 'bg-toggle-off'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-3 rounded-full shadow transition-transform duration-150 ${
                  createMore ? 'translate-x-3 bg-black' : 'bg-white'
                }`}
              />
            </button>
            <span aria-hidden="true">Create more</span>
          </label>
          <Button type="submit" variant="primary" size="sm" loading={submitting}>
            Create task
          </Button>
        </div>
      </form>
    </Modal>
  )
}

