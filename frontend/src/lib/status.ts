import type { TaskStatus } from './types'

export const STATUS_ORDER: TaskStatus[] = ['pending', 'in_progress', 'done']

export const STATUS_META: Record<TaskStatus, { label: string; text: string; dot: string }> = {
  pending: { label: 'Pending', text: 'text-status-pending', dot: 'bg-status-pending' },
  in_progress: { label: 'In Progress', text: 'text-status-progress', dot: 'bg-status-progress' },
  done: { label: 'Done', text: 'text-status-done', dot: 'bg-status-done' },
}

