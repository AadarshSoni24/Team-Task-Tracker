'use client'

import { useRef, useState } from 'react'
import { STATUS_META } from '@/lib/status'
import type { Task, TaskStatus } from '@/lib/types'
import { StatusIcon } from './StatusIcon'
import { TaskCard, TaskCardSkeleton } from './TaskCard'

export function BoardColumn({
  status,
  tasks,
  teamId,
  now,
  loading,
  onStatusChange,
  onDropTask,
}: {
  status: TaskStatus
  tasks: Task[]
  teamId: string
  now: number
  loading: boolean
  onStatusChange: (task: Task, status: TaskStatus) => void
  onDropTask: (taskId: string, status: TaskStatus) => void
}) {
  const [over, setOver] = useState(false)
  const depth = useRef(0)

  return (
    <section
      aria-label={`${STATUS_META[status].label} column`}
      onDragEnter={(e) => {
        e.preventDefault()
        depth.current++
        setOver(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        depth.current = 0
        setOver(false)
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDropTask(id, status)
      }}
      className={`flex w-[280px] shrink-0 flex-col rounded-xl border transition-colors duration-150 md:w-auto md:min-w-[240px] md:flex-1 ${
        over ? 'border-accent/50 bg-accent/[0.04]' : 'border-line bg-surface-column'
      }`}
    >
      <header className="flex h-10 shrink-0 items-center gap-2 px-3">
        <StatusIcon status={status} />
        <h3 className="text-[12.5px] font-medium">{STATUS_META[status].label}</h3>
        <span className="text-[12px] text-faint tabular-nums">{loading ? '' : tasks.length}</span>
      </header>
      <ul className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {loading ? (
          [0, 1].map((i) => <TaskCardSkeleton key={i} />)
        ) : tasks.length === 0 ? (
          <li
            className={`flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-[12px] transition-colors duration-150 ${
              over ? 'border-accent/40 text-accent' : 'border-line-strong text-faint'
            }`}
          >
            {over ? 'Drop to move here' : 'Drag a task here'}
          </li>
        ) : (
          tasks.map((t) => <TaskCard key={t.id} task={t} teamId={teamId} now={now} onStatusChange={onStatusChange} />)
        )}
      </ul>
    </section>
  )
}

