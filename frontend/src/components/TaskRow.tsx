'use client'

import Link from 'next/link'
import type { Task, TaskStatus } from '@/lib/types'
import { fullDate, relativeTime } from '@/lib/time'
import { Avatar } from './Avatar'
import { IconUser } from './icons'
import { Skeleton } from './Skeleton'
import { StatusDropdown } from './StatusDropdown'

export function TaskRow({
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
  return (
    <li className="group relative flex h-10 items-center gap-3 border-b border-line/60 px-4 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.025] md:px-5">
      <StatusDropdown status={task.status} onChange={(s) => onStatusChange(task, s)} />
      <Link
        href={`/teams/${teamId}/tasks/${task.id}`}
        className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg outline-none after:absolute after:inset-0 focus-visible:after:rounded-md focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent/70"
      >
        {task.title}
      </Link>
      <span className="hidden min-w-0 items-center gap-1.5 text-[12px] text-muted sm:flex sm:w-36">
        {task.assigned_to ? (
          <>
            <Avatar name={task.assigned_to.name} id={task.assigned_to.id} size="sm" />
            <span className="truncate">{task.assigned_to.name}</span>
          </>
        ) : (
          <>
            <IconUser size={14} className="text-faint" />
            <span className="text-faint">Unassigned</span>
          </>
        )}
      </span>
      <span className="sm:hidden">
        {task.assigned_to && <Avatar name={task.assigned_to.name} id={task.assigned_to.id} size="sm" />}
      </span>
      <time
        dateTime={task.updated_at}
        title={`Updated ${fullDate(task.updated_at)}`}
        className="w-16 shrink-0 text-right text-[11.5px] text-faint tabular-nums"
      >
        {relativeTime(task.updated_at, now)}
      </time>
    </li>
  )
}

export function TaskRowSkeleton() {
  return (
    <div className="flex h-10 items-center gap-3 border-b border-line/60 px-4 md:px-5">
      <Skeleton className="size-3.5 rounded-full" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="ml-auto hidden h-3 w-24 sm:block" />
      <Skeleton className="h-3 w-10" />
    </div>
  )
}

