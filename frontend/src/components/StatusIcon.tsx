import type { TaskStatus } from '@/lib/types'

export function StatusIcon({ status, size = 14 }: { status: TaskStatus; size?: number }) {
  if (status === 'pending') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
        <circle cx="7" cy="7" r="5.6" fill="none" stroke="var(--color-status-pending)" strokeWidth="1.5" />
      </svg>
    )
  }
  if (status === 'in_progress') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
        <circle cx="7" cy="7" r="5.6" fill="none" stroke="var(--color-status-progress)" strokeWidth="1.5" />
        <path d="M7 3.4a3.6 3.6 0 0 1 0 7.2Z" fill="var(--color-status-progress)" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
      <circle cx="7" cy="7" r="6.35" fill="var(--color-status-done)" />
      <path d="m4.4 7.2 1.8 1.8 3.5-3.7" fill="none" stroke="var(--color-status-done-check)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

