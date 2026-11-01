'use client'

import type { ReactNode } from 'react'
import type { Activity, ActivityAction } from '@/lib/types'
import { dayKey, dayLabel, fullDate, relativeTime } from '@/lib/time'
import { useTick } from '@/lib/useTick'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { IconMessage, IconPencil, IconPlus, IconSwap, IconUserPlus } from './icons'
import { Skeleton } from './Skeleton'

const ACTION_STYLE: Record<ActivityAction, { icon: ReactNode; cls: string; label: string }> = {
  task_created: { icon: <IconPlus size={11} strokeWidth={1.8} />, cls: 'text-fg bg-white/[0.08] ring-white/15', label: 'Task created' },
  task_updated: { icon: <IconPencil size={11} />, cls: 'text-fg bg-white/[0.08] ring-white/15', label: 'Task updated' },
  status_changed: { icon: <IconSwap size={11} />, cls: 'text-amber-400 bg-amber-500/10 ring-amber-500/20', label: 'Status changed' },
  commented: { icon: <IconMessage size={11} />, cls: 'text-text-subtle bg-white/[0.06] ring-white/10', label: 'Comment' },
  member_added: { icon: <IconUserPlus size={11} />, cls: 'text-fg bg-white/[0.08] ring-white/15', label: 'Member added' },
}

export function LiveIndicator({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-150 ${live ? 'text-fg' : 'text-faint'}`}
      title={live ? 'Checking for new activity every 5 seconds' : 'Paused while this tab is in the background'}
    >
      <span className="relative flex size-1.5">
        {live && <span className="absolute inset-0 rounded-full bg-fg animate-live" />}
        <span className={`relative size-1.5 rounded-full ${live ? 'bg-fg' : 'bg-faint'}`} />
      </span>
      {live ? 'Live' : 'Paused'}
    </span>
  )
}

function Message({ item }: { item: Activity }) {
  const name = item.actor?.name
  if (name && item.message.startsWith(name)) {
    return (
      <>
        <span className="font-medium text-fg">{name}</span>
        {item.message.slice(name.length)}
      </>
    )
  }
  return <>{item.message}</>
}

function groupByDay(items: Activity[]) {
  const groups: { key: string; label: string; items: Activity[] }[] = []
  for (const item of items) {
    const key = dayKey(item.created_at)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, label: dayLabel(item.created_at), items: [item] })
  }
  return groups
}

interface TimelineProps {
  items: Activity[]
  loading: boolean
  newIds: Set<string>
  live: boolean
  variant?: 'panel' | 'full'
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

export function Timeline({ items, loading, newIds, live, variant = 'panel', hasMore, loadingMore, onLoadMore }: TimelineProps) {
  const now = useTick()
  const full = variant === 'full'

  return (
    <section aria-labelledby={`timeline-${variant}`} className="flex min-h-0 flex-1 flex-col">
      <div className={`flex shrink-0 items-center justify-between ${full ? 'pb-4' : 'h-11 border-b border-line px-4'}`}>
        <h2 id={`timeline-${variant}`} className={`font-semibold ${full ? 'text-[15px]' : 'text-[13px]'}`}>
          Activity
        </h2>
        <LiveIndicator live={live} />
      </div>

      <div className={`min-h-0 flex-1 ${full ? '' : 'overflow-y-auto px-2 pt-1 pb-4'}`}>
        {loading ? (
          <div className="space-y-4 px-2 pt-3">
            <Skeleton className="h-3 w-16" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-5 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            art="activity"
            compact={!full}
            title="Nothing has happened yet"
            description="Create a task or leave a comment, and the story of your team's work will start here."
          />
        ) : (
          <>
            {groupByDay(items).map((g) => (
              <div key={g.key} className="pt-3">
                <h3 className={`sticky top-0 z-[1] mb-1 bg-panel/95 px-2 py-1 text-[11px] font-medium text-faint backdrop-blur`}>
                  {g.label}
                </h3>
                <ol className="relative">
                  {g.items.map((item, idx) => {
                    const style = ACTION_STYLE[item.action] ?? ACTION_STYLE.task_updated
                    const isLast = idx === g.items.length - 1
                    return (
                      <li
                        key={item.id}
                        className={`relative flex gap-3 rounded-md px-2 py-2 ${newIds.has(item.id) ? 'animate-highlight' : ''}`}
                      >
                        {!isLast && (
                          <span aria-hidden="true" className="absolute top-8 bottom-[-6px] left-[17.5px] w-px bg-line-strong" />
                        )}
                        <span
                          className={`relative mt-px flex size-5 shrink-0 items-center justify-center rounded-full ring-1 ${style.cls}`}
                          title={style.label}
                        >
                          {style.icon}
                        </span>
                        <div className={`min-w-0 flex-1 ${full ? 'sm:flex sm:items-baseline sm:gap-4' : ''}`}>
                          <p className="text-[12.5px] leading-snug text-muted [overflow-wrap:anywhere]">
                            <Message item={item} />
                          </p>
                          <time
                            dateTime={item.created_at}
                            title={fullDate(item.created_at)}
                            className={`block text-[11.5px] text-faint ${full ? 'mt-0.5 shrink-0 sm:mt-0 sm:ml-auto' : 'mt-0.5'}`}
                          >
                            {relativeTime(item.created_at, now)}
                          </time>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
            {onLoadMore && hasMore && (
              <div className="flex justify-center pt-4">
                <Button size="sm" onClick={onLoadMore} loading={loadingMore}>
                  Load more
                </Button>
              </div>
            )}
            {onLoadMore && !hasMore && items.length >= 200 && (
              <p className="pt-4 text-center text-[11.5px] text-faint">Showing the 200 most recent events.</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

