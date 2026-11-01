import type { ReactNode } from 'react'

type Art = 'tasks' | 'teams' | 'activity' | 'comments' | 'lock' | 'compass' | 'members'

/** Original line illustrations, drawn on a 64px grid. */
function Illustration({ art }: { art: Art }) {
  const common = {
    width: 64,
    height: 64,
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (art) {
    case 'tasks':
      return (
        <svg {...common}>
          <rect x="14" y="12" width="36" height="42" rx="6" opacity=".5" />
          <rect x="18" y="8" width="36" height="42" rx="6" className="text-accent" stroke="currentColor" />
          <circle cx="27" cy="20" r="3" />
          <path d="M34 20h12M34 29h12M34 38h8" opacity=".6" />
          <circle cx="27" cy="29" r="3" />
          <path d="M25.5 38l1.2 1.2 2.6-2.6" className="text-accent" stroke="currentColor" />
          <circle cx="27" cy="38" r="3" className="text-accent" stroke="currentColor" />
        </svg>
      )
    case 'teams':
    case 'members':
      return (
        <svg {...common}>
          <circle cx="32" cy="24" r="7" className="text-accent" stroke="currentColor" />
          <path d="M19 47c1.6-7 6.6-10.5 13-10.5S43.4 40 45 47" className="text-accent" stroke="currentColor" />
          <circle cx="16" cy="28" r="5" opacity=".5" />
          <circle cx="48" cy="28" r="5" opacity=".5" />
          <path d="M7 45c.9-4.6 4-7 8.5-7M57 45c-.9-4.6-4-7-8.5-7" opacity=".5" />
          <path d="M32 6v4M24 9l1.5 3M40 9l-1.5 3" opacity=".6" />
        </svg>
      )
    case 'activity':
      return (
        <svg {...common}>
          <path d="M20 10v44" opacity=".35" strokeDasharray="2 4" />
          <circle cx="20" cy="18" r="4" className="text-accent" stroke="currentColor" />
          <path d="M30 16h20M30 21h12" opacity=".6" />
          <circle cx="20" cy="34" r="4" />
          <path d="M30 32h16M30 37h10" opacity=".45" />
          <circle cx="20" cy="50" r="4" opacity=".5" />
          <path d="M30 48h18" opacity=".3" />
        </svg>
      )
    case 'comments':
      return (
        <svg {...common}>
          <path d="M12 16h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H24l-8 6v-6h-4a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z" opacity=".5" />
          <path d="M30 26h22a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-2v5l-7-5H30a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4Z" className="text-accent" stroke="currentColor" />
          <path d="M33 34h14M33 39h9" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="16" y="28" width="32" height="24" rx="5" className="text-accent" stroke="currentColor" />
          <path d="M22 28v-6a10 10 0 0 1 20 0v6" />
          <circle cx="32" cy="38" r="3" />
          <path d="M32 41v4" />
        </svg>
      )
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="20" opacity=".5" />
          <circle cx="32" cy="32" r="14" />
          <path d="m37 27-3 7-7 3 3-7 7-3Z" className="text-accent" stroke="currentColor" />
          <path d="M32 8v4M32 52v4M8 32h4M52 32h4" opacity=".5" />
        </svg>
      )
  }
}

export function EmptyState({
  art,
  title,
  description,
  action,
  compact,
}: {
  art: Art
  title: string
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center animate-fade-up ${compact ? 'px-4 py-8' : 'px-6 py-16'}`}>
      <div className={`text-faint ${compact ? 'scale-75' : ''}`}>
        <Illustration art={art} />
      </div>
      <h3 className={`font-medium text-fg ${compact ? 'mt-1 text-[13px]' : 'mt-4 text-[14px]'}`}>{title}</h3>
      {description && <p className="mt-1 max-w-xs text-[12.5px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

