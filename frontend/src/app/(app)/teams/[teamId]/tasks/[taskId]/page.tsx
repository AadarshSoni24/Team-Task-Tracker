'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useUser } from '@/auth/AuthContext'
import { AssigneeDropdown } from '@/components/AssigneeDropdown'
import { Avatar } from '@/components/Avatar'
import { CommentList } from '@/components/CommentList'
import { IconArrowLeft } from '@/components/icons'
import { InlineEdit } from '@/components/InlineEdit'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { StatusDropdown } from '@/components/StatusDropdown'
import { useToast } from '@/components/Toast'
import { ApiError, apiFetch } from '@/lib/api'
import { STATUS_META } from '@/lib/status'
import type { Comment, FieldErrors, Task, TaskStatus, TeamDetail } from '@/lib/types'
import { fullDate, longDate, relativeTime } from '@/lib/time'
import { useApiError } from '@/lib/useApiError'
import { useTick } from '@/lib/useTick'
import { NoAccessState, NotFoundState } from '@/components/StatusPages'

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-2 py-1">
      <dt className="text-[12px] text-faint">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

export default function TaskDetailPage() {
  const params = useParams()
  const teamId = (params?.teamId as string) || ''
  const taskId = (params?.taskId as string) || ''
  const user = useUser()
  const toast = useToast()
  const handleError = useApiError()
  const now = useTick()
  const [task, setTask] = useState<Task | null>(null)
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [failure, setFailure] = useState<{ status: number; detail: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    setTask(null)
    setFailure(null)
    setCommentsLoading(true)
    const fail = (err: unknown) => {
      if (cancelled) return
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) setFailure({ status: err.status, detail: err.detail })
      else handleError(err)
    }
    apiFetch<Task>(`/tasks/${taskId}/`)
      .then((t) => !cancelled && setTask(t))
      .catch(fail)
    apiFetch<TeamDetail>(`/teams/${teamId}/`)
      .then((t) => !cancelled && setTeam(t))
      .catch(fail)
    apiFetch<Comment[]>(`/tasks/${taskId}/comments/`)
      .then((c) => !cancelled && setComments(c))
      .catch((err) => {
        if (!(err instanceof ApiError && (err.status === 403 || err.status === 404))) fail(err)
      })
      .finally(() => !cancelled && setCommentsLoading(false))
    return () => {
      cancelled = true
    }
  }, [teamId, taskId, handleError])

  const patch = useCallback(
    async (body: Record<string, string>, fieldKey: string): Promise<string[] | null> => {
      try {
        const updated = await apiFetch<Task>(`/tasks/${taskId}/`, { method: 'PATCH', body })
        setTask(updated)
        return null
      } catch (err) {
        let fieldErrors: string[] | null = null
        handleError(err, {
          keys: [fieldKey],
          set: (e: FieldErrors) => {
            fieldErrors = e[fieldKey] ?? null
          },
        })
        return fieldErrors ?? (err instanceof ApiError ? [err.detail] : ['Could not save.'])
      }
    },
    [taskId, handleError],
  )

  async function changeStatus(status: TaskStatus) {
    if (!task) return
    const previous = task.status
    setTask({ ...task, status })
    try {
      setTask(await apiFetch<Task>(`/tasks/${task.id}/`, { method: 'PATCH', body: { status } }))
    } catch (err) {
      setTask((t) => (t ? { ...t, status: previous } : t))
      if (err instanceof ApiError && err.code === 'session_ended') return
      toast.error(`Couldn't change status to ${STATUS_META[status].label}. ${err instanceof ApiError ? err.detail : ''}`)
    }
  }

  async function changeAssignee(memberId: string) {
    if (!task || !team) return
    const member = team.members.find((m) => m.id === memberId)
    if (!member) return
    const previous = task.assigned_to
    setTask({ ...task, assigned_to: { id: member.id, name: member.name } })
    try {
      setTask(await apiFetch<Task>(`/tasks/${task.id}/`, { method: 'PATCH', body: { assigned_to: memberId } }))
    } catch (err) {
      setTask((t) => (t ? { ...t, assigned_to: previous } : t))
      handleError(err)
    }
  }

  async function addComment(text: string): Promise<FieldErrors | null> {
    try {
      const c = await apiFetch<Comment>(`/tasks/${taskId}/comments/`, { method: 'POST', body: { text } })
      setComments((cs) => [...cs, c])
      return null
    } catch (err) {
      let fieldErrors: FieldErrors | null = null
      handleError(err, { keys: ['text'], set: (e) => (fieldErrors = e) })
      return fieldErrors && Object.keys(fieldErrors).length ? fieldErrors : {}
    }
  }

  const teamPath = `/teams/${teamId}`

  if (failure) {
    return (
      <>
        <PageHeader crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: failure.status === 403 ? 'No access' : 'Not found' }]} />
        {failure.status === 403 ? <NoAccessState detail={failure.detail} /> : <NotFoundState what="task" />}
      </>
    )
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: team ? team.name : <Skeleton className="h-3.5 w-24" />, to: teamPath },
          { label: task ? task.title : <Skeleton className="h-3.5 w-40" /> },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 px-4 py-6 md:px-10 md:py-8">
            <div className="mx-auto max-w-[720px]">
              <Link
                href={teamPath}
                className="inline-flex items-center gap-1.5 rounded text-[12.5px] text-muted transition-colors duration-150 hover:text-fg"
              >
                <IconArrowLeft size={14} />
                Back to {team?.name ?? 'team'}
              </Link>

              {!task ? (
                <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading task">
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-5/6" />
                </div>
              ) : (
                <div className="mt-5">
                  <InlineEdit
                    label="Title"
                    required
                    value={task.title}
                    placeholder="Task title"
                    onSave={(title) => patch({ title }, 'title')}
                    className="text-[22px] leading-snug font-semibold tracking-[-0.02em] text-fg"
                  />
                  <div className="mt-2">
                    <InlineEdit
                      label="Description"
                      multiline
                      value={task.description}
                      placeholder="Add a description…"
                      onSave={(description) => patch({ description }, 'description')}
                      className="text-[14px] leading-relaxed text-text-secondary"
                    />
                  </div>
                </div>
              )}

              <div className="my-8 h-px bg-line" />

              <CommentList comments={comments} loading={commentsLoading} currentUser={user} onSubmit={addComment} />
            </div>
          </div>

          <aside className="border-t border-line bg-surface-aside px-4 py-5 lg:border-t-0 lg:border-l md:px-5" aria-label="Task properties">
            <h2 className="mb-3 text-[12px] font-medium text-faint">Properties</h2>
            {!task || !team ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <dl className="space-y-0.5">
                <Property label="Status">
                  <div className="-ml-2">
                    <StatusDropdown status={task.status} onChange={changeStatus} variant="field" />
                  </div>
                </Property>
                <Property label="Assignee">
                  <div className="-ml-2">
                    <AssigneeDropdown members={team.members} value={task.assigned_to} onChange={changeAssignee} variant="field" />
                  </div>
                </Property>
                <div className="my-3 h-px bg-line" />
                <Property label="Created by">
                  <span className="flex items-center gap-2 text-[13px]">
                    <Avatar name={task.created_by.name} id={task.created_by.id} size="sm" />
                    <span className="truncate">{task.created_by.name}</span>
                  </span>
                </Property>
                <Property label="Created">
                  <time dateTime={task.created_at} title={fullDate(task.created_at)} className="text-[13px] text-muted">
                    {longDate(task.created_at)}
                  </time>
                </Property>
                <Property label="Last updated">
                  <time dateTime={task.updated_at} title={fullDate(task.updated_at)} className="text-[13px] text-muted">
                    {relativeTime(task.updated_at, now)}
                  </time>
                </Property>
              </dl>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}

