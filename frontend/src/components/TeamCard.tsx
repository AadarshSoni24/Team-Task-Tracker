import Link from 'next/link'
import type { Team } from '@/lib/types'
import { longDate, shortDate } from '@/lib/time'
import { TeamGlyph } from './Avatar'
import { IconChevronRight, IconUsers } from './icons'
import { Skeleton } from './Skeleton'

export function TeamCard({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="group flex flex-col rounded-xl border border-line bg-surface-card p-4 transition-all duration-150 hover:-translate-y-px hover:border-line-strong hover:bg-raised hover:shadow-[0_12px_32px_-16px_rgb(0_0_0/0.8)]"
    >
      <div className="flex items-start gap-3">
        <TeamGlyph name={team.name} id={team.id} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-fg">{team.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
            <IconUsers size={13} />
            {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
          </p>
        </div>
        <IconChevronRight
          size={14}
          className="mt-1 text-faint opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </div>
      <p className="mt-3 line-clamp-2 min-h-[2.8em] text-[12.5px] leading-relaxed text-muted">
        {team.description || <span className="text-faint italic">No description</span>}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11.5px] text-faint">
        <span className="truncate">
          Created by <span className="text-muted">{team.created_by.name}</span>
        </span>
        <time dateTime={team.created_at} title={longDate(team.created_at)} className="shrink-0 pl-2">
          {shortDate(team.created_at)}
        </time>
      </div>
    </Link>
  )
}

export function TeamCardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <div className="mt-4 flex justify-between border-t border-line pt-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

