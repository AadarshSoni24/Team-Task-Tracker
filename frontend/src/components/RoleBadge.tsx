import type { Role } from '@/lib/types'

export function RoleBadge({ role }: { role: Role }) {
  const admin = role === 'admin'
  return (
    <span
      className={`inline-flex h-[18px] items-center rounded px-1.5 text-[10.5px] font-medium tracking-wide ${
        admin ? 'bg-white/10 text-fg ring-1 ring-white/20' : 'bg-white/[0.04] text-muted ring-1 ring-white/10'
      }`}
    >
      {admin ? 'Admin' : 'Member'}
    </span>
  )
}

