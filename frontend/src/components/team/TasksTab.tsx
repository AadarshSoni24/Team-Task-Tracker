'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/auth/AuthContext'
import { BoardColumn } from '@/components/BoardColumn'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { IconBoard, IconList, IconPlus } from '@/components/icons'
import { StatusIcon } from '@/components/StatusIcon'
import { TaskList } from '@/components/TaskList'
import { TaskModal } from '@/components/TaskModal'
import { TaskRowSkeleton } from '@/components/TaskRow'
import { Timeline } from '@/components/Timeline'
import { useToast } from '@/components/Toast'
import { ApiError, apiFetch } from '@/lib/api'
import { STATUS_META, STATUS_ORDER } from '@/lib/status'
import type { Task, TaskStatus, TeamDetail } from '@/lib/types'
import type { useActivity } from '@/lib/useActivity'
import { useApiError } from '@/lib/useApiError'
import { useTick } from '@/lib/useTick'

type Filter = 'all' | TaskStatus
type View = 'list' | 'board'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...STATUS_ORDER.map((s) => ({ value: s as Filter, label: STATUS_META[s].label })),
]

export function TasksTab({ team, activity }: { team: TeamDetail; activity: ReturnType<typeof useActivity> }) {
  const user = useUser()
  const toast = useToast()
  const handleError = useApiError()
  const now = useTick()
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<View>('list')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const { refresh } = activity

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cadence.view')
      if (stored === 'board') setView('board')
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cadence.view', view)
    }
  }, [view])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const query = filter === 'all' ? '' : `?status=${filter}`
    apiFetch<Task[]>(`/teams/${team.id}/tasks/${query}`)
      .then((data) => !cancelled && setTasks(data))
      .catch((err) => !cancelled && handleError(err))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [team.id, filter, handleError])

  // Optimistic: move the task immediately, roll back with a toast on failure.
  const changeStatus = useCallback(
    async (task: Task, status: TaskStatus) => {
      const previous = task.status
      if (previous === status) return
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status } : t)))
      try {
        const updated = await apiFetch<Task>(`/tasks/${task.id}/`, { method: 'PATCH', body: { status } })
        setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)))
        void refresh()
      } catch (err) {
        setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: previous } : t)))
        if (err instanceof ApiError && err.code === 'session_ended') return
        const detail = err instanceof ApiError ? err.detail : 'Something went wrong.'
        toast.error(`Couldn't move "${task.title}" to ${STATUS_META[status].label}. ${detail}`)
      }
    },
    [refresh, toast],
  )

  const onDropTask = useCallback(
    (taskId: string, status: TaskStatus) => {
      const task = tasks.find((t) => t.id === taskId)
      if (task) void changeStatus(task, status)
    },
    [tasks, changeStatus],
  )

  const visible = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
  const noTasksAtAll = !loading && filter === 'all' && tasks.length === 0

  const newTaskButton = (
    <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
      <IconPlus size={13} strokeWidth={2} />
      New task
    </Button>
  )

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2 md:px-5">
          <div role="group" aria-label="Filter by status" className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 py-0.5">
            {FILTERS.map((f) => {
              const active = filter === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.value)}
                  className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-colors duration-150 ${
                    active
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-line-strong text-muted hover:bg-white/[0.04] hover:text-fg'
                  }`}
                >
                  {f.value !== 'all' && <StatusIcon status={f.value} size={12} />}
                  {f.label}
                </button>
              )
            })}
          </div>
          <div role="group" aria-label="View" className="flex shrink-0 rounded-md border border-line-strong p-0.5">
            {(
              [
                { v: 'list', label: 'List', icon: <IconList size={14} /> },
                { v: 'board', label: 'Board', icon: <IconBoard size={14} /> },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={view === o.v}
                onClick={() => setView(o.v)}
                className={`inline-flex h-6 items-center gap-1.5 rounded px-2 text-[12px] font-medium transition-colors duration-150 ${
                  view === o.v ? 'bg-white/[0.08] text-fg' : 'text-faint hover:text-fg'
                }`}
              >
                {o.icon}
                <span className="hidden sm:inline">{o.label}</span>
              </button>
            ))}
          </div>
          {newTaskButton}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {noTasksAtAll ? (
            <EmptyState
              art="tasks"
              title="No tasks yet. Add the first one."
              description="Break the work into small pieces your team can pick up and move forward."
              action={newTaskButton}
            />
          ) : view === 'list' ? (
            loading ? (
              <div aria-busy="true" aria-label="Loading tasks">
                <div className="h-9 border-b border-line bg-surface-card" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <TaskRowSkeleton key={i} />
                ))}
              </div>
            ) : filter !== 'all' && visible.length === 0 ? (
              <EmptyState
                art="tasks"
                title={`No ${STATUS_META[filter].label.toLowerCase()} tasks`}
                description="Try another filter, or create a task with this status."
                action={
                  <Button size="sm" onClick={() => setFilter('all')}>
                    Show all tasks
                  </Button>
                }
              />
            ) : (
              <TaskList
                tasks={visible}
                statuses={filter === 'all' ? STATUS_ORDER : [filter]}
                teamId={team.id}
                onStatusChange={changeStatus}
              />
            )
          ) : (
            <div className="flex h-full min-h-[420px] gap-3 p-3 md:p-4">
              {STATUS_ORDER.map((s) => (
                <BoardColumn
                  key={s}
                  status={s}
                  tasks={visible.filter((t) => t.status === s)}
                  teamId={team.id}
                  now={now}
                  loading={loading}
                  onStatusChange={changeStatus}
                  onDropTask={onDropTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="hidden w-[320px] shrink-0 flex-col border-l border-line lg:flex xl:w-[348px]" aria-label="Team activity">
        <Timeline
          items={activity.items}
          loading={activity.loading}
          newIds={activity.newIds}
          live={activity.live}
        />
      </aside>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        team={team}
        currentUserId={user.id}
        onCreated={(task) => {
          if (filter === 'all' || task.status === filter) setTasks((ts) => [task, ...ts])
          void refresh()
        }}
      />
    </div>
  )
}

