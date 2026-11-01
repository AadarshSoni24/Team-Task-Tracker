'use client'

import { useState } from 'react'
import { STATUS_META } from '@/lib/status'
import type { Task, TaskStatus } from '@/lib/types'
import { useTick } from '@/lib/useTick'
import { IconChevronDown } from './icons'
import { StatusIcon } from './StatusIcon'
import { TaskRow } from './TaskRow'

export function TaskList({
  tasks,
  statuses,
  teamId,
  onStatusChange,
}: {
  tasks: Task[]
  statuses: TaskStatus[]
  teamId: string
  onStatusChange: (task: Task, status: TaskStatus) => void
}) {
  const now = useTick()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  return (
    <div className="pb-6">
      {statuses.map((status) => {
        const group = tasks.filter((t) => t.status === status)
        const isCollapsed = collapsed[status]
        const regionId = `group-${status}`
        return (
          <section key={status} aria-label={STATUS_META[status].label}>
            <h3 className="sticky top-0 z-[2]">
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={regionId}
                onClick={() => setCollapsed((c) => ({ ...c, [status]: !c[status] }))}
                className="flex h-9 w-full items-center gap-2 border-y border-line bg-surface-card px-4 text-left text-[12.5px] font-medium transition-colors duration-150 hover:bg-surface-popover md:px-5"
              >
                <IconChevronDown
                  size={12}
                  className={`text-faint transition-transform duration-150 ${isCollapsed ? '-rotate-90' : ''}`}
                />
                <StatusIcon status={status} />
                <span className="text-fg">{STATUS_META[status].label}</span>
                <span className="text-faint tabular-nums">{group.length}</span>
              </button>
            </h3>
            {!isCollapsed && (
              <ul id={regionId}>
                {group.length === 0 ? (
                  <li className="px-4 py-3 pl-[52px] text-[12px] text-faint md:px-5 md:pl-[56px]">
                    Nothing {status === 'done' ? 'finished' : STATUS_META[status].label.toLowerCase()} right now.
                  </li>
                ) : (
                  group.map((t) => (
                    <TaskRow key={t.id} task={t} teamId={teamId} now={now} onStatusChange={onStatusChange} />
                  ))
                )}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

