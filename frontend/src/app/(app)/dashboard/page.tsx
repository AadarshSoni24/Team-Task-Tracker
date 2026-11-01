'use client'

import { useState } from 'react'
import { useUser } from '@/auth/AuthContext'
import { useTeams } from '@/auth/TeamsContext'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { IconPlus } from '@/components/icons'
import { PageHeader } from '@/components/PageHeader'
import { RoleBadge } from '@/components/RoleBadge'
import { Skeleton } from '@/components/Skeleton'
import { TeamCard, TeamCardSkeleton } from '@/components/TeamCard'
import { TeamModal } from '@/components/TeamModal'
import { useToast } from '@/components/Toast'
import { greeting } from '@/lib/time'

export default function DashboardPage() {
  const user = useUser()
  const { teams, loading, addTeam } = useTeams()
  const [modalOpen, setModalOpen] = useState(false)
  const toast = useToast()
  const isAdmin = user.role === 'admin'
  const firstName = user.name.split(' ')[0] || user.name

  const createButton = isAdmin && (
    <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
      <IconPlus size={13} strokeWidth={2} />
      Create team
    </Button>
  )

  return (
    <>
      <PageHeader crumbs={[{ label: 'Dashboard' }]} actions={createButton} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] md:text-[24px]">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-[13px] text-muted">Here&apos;s where your teams stand today.</p>

          <dl className="mt-6 grid grid-cols-2 divide-x divide-line overflow-hidden rounded-xl border border-line bg-surface-card sm:max-w-md">
            <div className="px-4 py-3">
              <dt className="text-[11.5px] text-faint">Teams</dt>
              <dd className="mt-0.5 text-[20px] font-semibold tabular-nums">
                {loading ? <Skeleton className="mt-1.5 h-5 w-8" /> : teams.length}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-[11.5px] text-faint">Your role</dt>
              <dd className="mt-2">
                <RoleBadge role={user.role} />
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-fg">Your teams</h2>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <TeamCardSkeleton key={i} />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong">
                <EmptyState
                  art="teams"
                  title="No teams yet"
                  description={
                    isAdmin
                      ? 'Create your first team to start planning work together.'
                      : "You haven't been added to a team yet. Ask an admin to invite you, and it will show up here."
                  }
                  action={createButton}
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t) => (
                  <TeamCard key={t.id} team={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {isAdmin && (
        <TeamModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={(team) => {
            addTeam(team)
            toast.success(`${team.name} is ready.`)
          }}
        />
      )}
    </>
  )
}

