'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, useUser } from '@/auth/AuthContext'
import { useTeams } from '@/auth/TeamsContext'
import { Avatar, TeamGlyph } from './Avatar'
import { IconGrid, IconLogOut, IconX } from './icons'
import { Wordmark } from './Logo'
import { RoleBadge } from './RoleBadge'
import { Skeleton } from './Skeleton'

const navItemClass = (isActive: boolean) =>
  `group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors duration-150 ${
    isActive ? 'bg-white/[0.07] text-fg' : 'text-muted hover:bg-white/[0.04] hover:text-fg'
  }`

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const user = useUser()
  const { logout } = useAuth()
  const { teams, loading } = useTeams()
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center justify-between px-3">
        <Link href="/dashboard" className="rounded-md px-1 py-0.5" aria-label="Cadence home">
          <Wordmark size={20} />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
            aria-label="Close navigation"
          >
            <IconX />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-4" aria-label="Main">
        <Link
          href="/dashboard"
          className={navItemClass(pathname === '/dashboard')}
          aria-current={pathname === '/dashboard' ? 'page' : undefined}
        >
          <IconGrid className={`text-faint ${pathname === '/dashboard' ? 'text-accent' : ''}`} />
          Dashboard
        </Link>

        <div className="mt-6 mb-1 flex items-center justify-between px-2">
          <h2 className="text-[11px] font-medium tracking-wide text-faint">Teams</h2>
          {!loading && <span className="text-[11px] text-faint tabular-nums">{teams.length}</span>}
        </div>
        <ul className="space-y-px">
          {loading &&
            [0, 1, 2].map((i) => (
              <li key={i} className="flex h-8 items-center gap-2.5 px-2">
                <Skeleton className="size-[18px] rounded-[5px]" />
                <Skeleton className="h-3 flex-1" />
              </li>
            ))}
          {!loading && teams.length === 0 && (
            <li className="px-2 py-1.5 text-[12px] text-faint">No teams yet</li>
          )}
          {teams.map((t) => {
            const active = pathname.startsWith(`/teams/${t.id}`)
            return (
              <li key={t.id}>
                <Link
                  href={`/teams/${t.id}`}
                  className={navItemClass(active)}
                  aria-current={active ? 'page' : undefined}
                >
                  <TeamGlyph name={t.name} id={t.id} />
                  <span className="truncate">{t.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-2">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <Avatar name={user.name} id={user.id} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-fg">{user.name}</div>
            <div className="mt-0.5">
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-muted transition-colors duration-150 hover:bg-white/[0.06] hover:text-fg"
          >
            <IconLogOut size={14} />
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

