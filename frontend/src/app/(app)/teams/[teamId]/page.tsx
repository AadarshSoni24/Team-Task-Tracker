'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTeams } from '@/auth/TeamsContext'
import { TeamGlyph } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { Timeline } from '@/components/Timeline'
import { ApiError, apiFetch } from '@/lib/api'
import type { InviteResponse, TeamDetail } from '@/lib/types'
import { useActivity } from '@/lib/useActivity'
import { useApiError } from '@/lib/useApiError'
import { NoAccessState, NotFoundState } from '@/components/StatusPages'
import { MembersTab } from '@/components/team/MembersTab'
import { TasksTab } from '@/components/team/TasksTab'

type Tab = 'tasks' | 'members' | 'activity'
const TABS: { id: Tab; label: string }[] = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'members', label: 'Members' },
  { id: 'activity', label: 'Activity' },
]

export default function TeamPage() {
  const params = useParams()
  const teamId = (params?.teamId as string) || ''
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const handleError = useApiError()
  const { reload: reloadTeams } = useTeams()
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [failure, setFailure] = useState<{ status: number; detail: string } | null>(null)

  const rawTab = searchParams.get('tab')
  const tab: Tab = rawTab === 'members' || rawTab === 'activity' ? rawTab : 'tasks'
  const ready = !!team && team.id === teamId
  const activity = useActivity(teamId, ready)

  const loadTeam = useCallback(async () => {
    try {
      const data = await apiFetch<TeamDetail>(`/teams/${teamId}/`)
      setTeam(data)
      setFailure(null)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
        setFailure({ status: err.status, detail: err.detail })
      } else {
        handleError(err)
      }
    }
  }, [teamId, handleError])

  useEffect(() => {
    setTeam(null)
    setFailure(null)
    void loadTeam()
  }, [loadTeam])

  function selectTab(next: Tab) {
    if (next === 'tasks') {
      router.replace(pathname)
    } else {
      router.replace(`${pathname}?tab=${next}`)
    }
  }

  function onInvited(res: InviteResponse) {
    if (res.user) {
      void loadTeam()
      void reloadTeams()
      void activity.refresh()
    }
  }

  if (failure) {
    return (
      <>
        <PageHeader crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: failure.status === 403 ? 'No access' : 'Not found' }]} />
        {failure.status === 403 ? <NoAccessState detail={failure.detail} /> : <NotFoundState what="team" />}
      </>
    )
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          {
            label: ready ? (
              <span className="flex items-center gap-2">
                <TeamGlyph name={team.name} id={team.id} />
                <span className="truncate">{team.name}</span>
              </span>
            ) : (
              <Skeleton className="h-3.5 w-32" />
            ),
          },
        ]}
      />

      <div className="flex shrink-0 items-center gap-1 border-b border-line px-3 md:px-5" role="tablist" aria-label="Team sections">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => selectTab(t.id)}
              className={`relative flex h-10 items-center gap-1.5 px-2.5 text-[13px] font-medium transition-colors duration-150 ${
                active ? 'text-fg' : 'text-muted hover:text-fg'
              }`}
            >
              {t.label}
              {t.id === 'members' && ready && <span className="text-[11.5px] text-faint tabular-nums">{team.members.length}</span>}
              <span
                aria-hidden="true"
                className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
          )
        })}
        {ready && team.description && (
          <p className="ml-auto hidden max-w-sm truncate pl-4 text-[12px] text-faint lg:block" title={team.description}>
            {team.description}
          </p>
        )}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="flex min-h-0 flex-1 flex-col">
        {!ready ? (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading team">
            <Skeleton className="h-7 w-72" />
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : tab === 'tasks' ? (
          <TasksTab team={team} activity={activity} />
        ) : tab === 'members' ? (
          <MembersTab team={team} onInvited={onInvited} />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-3xl flex-col px-4 py-6 md:px-8">
              <Timeline
                variant="full"
                items={activity.items}
                loading={activity.loading}
                newIds={activity.newIds}
                live={activity.live}
                hasMore={activity.hasMore}
                loadingMore={activity.loadingMore}
                onLoadMore={activity.loadMore}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

