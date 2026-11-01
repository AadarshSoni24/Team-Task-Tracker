'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Task, TaskStatus } from '@/lib/types'
import { fullDate, relativeTime } from '@/lib/time'
import { Avatar } from './Avatar'
import { Skeleton } from './Skeleton'
import { StatusDropdown } from './StatusDropdown'

export function TaskCard({
  task,
  teamId,
  now,
  onStatusChange,
}: {
  task: Task
  teamId: string
  now: number
  onStatusChange: (task: Task, status: TaskStatus) => void
}) {
  const [dragging, setDragging] = useState(false)
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
      className={`group relative cursor-grab rounded-lg border border-line-strong bg-raised p-3 shadow-[0_1px_2px_rgb(0_0_0/0.3)] transition-all duration-150 hover:border-border-hover hover:bg-surface-card-hover active:cursor-grabbing ${
        dragging ? 'scale-[0.98] opacity-40' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="pt-px">
          <StatusDropdown status={task.status} onChange={(s) => onStatusChange(task, s)} />
        </div>
        <Link
          href={`/teams/${teamId}/tasks/${task.id}`}
          draggable={false}
          className="line-clamp-3 min-w-0 flex-1 text-[13px] leading-snug font-medium text-fg outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:outline-2 focus-visible:after:outline-accent/70"
        >
          {task.title}
        </Link>
      </div>
      {task.description && (
        <p className="mt-1.5 line-clamp-2 pl-[26px] text-[12px] leading-relaxed text-faint">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between pl-[26px] text-[11.5px] text-faint">
        <span className="flex min-w-0 items-center gap-1.5">
          {task.assigned_to ? (
            <>
              <Avatar name={task.assigned_to.name} id={task.assigned_to.id} size="xs" />
              <span className="truncate text-muted">{task.assigned_to.name}</span>
            </>
          ) : (
            'Unassigned'
          )}
        </span>
        <time dateTime={task.updated_at} title={`Updated ${fullDate(task.updated_at)}`} className="shrink-0 pl-2">
          {relativeTime(task.updated_at, now)}
        </time>
      </div>
    </li>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-raised p-3">
      <div className="flex gap-2.5">
        <Skeleton className="size-3.5 rounded-full" />
        <Skeleton className="h-3 flex-1" />
      </div>
      <Skeleton className="mt-2 ml-6 h-3 w-2/3" />
      <div className="mt-4 ml-6 flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  )
}

