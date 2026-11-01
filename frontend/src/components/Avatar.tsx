const PALETTE = [
  'var(--color-avatar-1)',
  'var(--color-avatar-2)',
  'var(--color-avatar-3)',
  'var(--color-avatar-4)',
  'var(--color-avatar-5)',
  'var(--color-avatar-6)',
  'var(--color-avatar-7)',
  'var(--color-avatar-8)',
  'var(--color-avatar-9)',
]

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const SIZES = { xs: 'size-4 text-[8px]', sm: 'size-5 text-[9px]', md: 'size-6 text-[10px]', lg: 'size-8 text-[12px]' }

export function Avatar({
  name,
  id,
  size = 'sm',
  className = '',
}: {
  name: string
  id?: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const bg = PALETTE[hash(id ?? name) % PALETTE.length]
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight text-white/95 ring-1 ring-black/30 select-none ${SIZES[size]} ${className}`}
      style={{ backgroundColor: bg }}
    >
      {initials(name)}
    </span>
  )
}

/** Square glyph used to represent teams. */
export function TeamGlyph({ name, id, size = 'sm' }: { name: string; id: string; size?: 'sm' | 'lg' }) {
  const bg = PALETTE[hash(id) % PALETTE.length]
  const cls = size === 'lg' ? 'size-9 rounded-lg text-[14px]' : 'size-[18px] rounded-[5px] text-[10px]'
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center font-semibold text-white ${cls}`}
      style={{ backgroundColor: bg }}
    >
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </span>
  )
}

