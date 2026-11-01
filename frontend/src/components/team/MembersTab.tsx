'use client'

import { useState } from 'react'
import { useUser } from '@/auth/AuthContext'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { IconUserPlus } from '@/components/icons'
import { InviteModal } from '@/components/InviteModal'
import { RoleBadge } from '@/components/RoleBadge'
import type { InviteResponse, TeamDetail } from '@/lib/types'

export function MembersTab({ team, onInvited }: { team: TeamDetail; onInvited: (res: InviteResponse) => void }) {
  const user = useUser()
  const [inviteOpen, setInviteOpen] = useState(false)
  const isAdmin = user.role === 'admin'

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Members</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {team.members.length} {team.members.length === 1 ? 'person' : 'people'} on {team.name}
            </p>
          </div>
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
              <IconUserPlus size={14} />
              Invite member
            </Button>
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-line">
          {team.members.length === 0 ? (
            <EmptyState art="members" title="No members yet" description="Invite people to start working together." />
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-surface-card text-[11.5px] text-faint">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Name
                  </th>
                  <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium sm:text-left">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {team.members.map((m) => (
                  <tr key={m.id} className="border-t border-line transition-colors duration-150 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.name} id={m.id} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-fg">
                            <span className="truncate">{m.name}</span>
                            {m.id === user.id && <span className="text-[11px] font-normal text-faint">(you)</span>}
                          </div>
                          <div className="truncate text-[12px] text-faint sm:hidden">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted sm:table-cell">{m.email}</td>
                    <td className="px-4 py-2.5 text-right sm:text-left">
                      <RoleBadge role={m.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isAdmin && (
        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          teamId={team.id}
          teamName={team.name}
          onInvited={onInvited}
        />
      )}
    </div>
  )
}

