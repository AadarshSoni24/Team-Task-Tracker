export type Role = 'admin' | 'member'
export type TaskStatus = 'pending' | 'in_progress' | 'done'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  created_at: string
}

export interface UserRef {
  id: string
  name: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
}

export interface Team {
  id: string
  name: string
  description: string
  created_by: UserRef
  member_count: number
  created_at: string
}

export interface TeamDetail extends Team {
  members: TeamMember[]
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  team_id: string
  assigned_to: UserRef | null
  created_by: UserRef
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  text: string
  user: UserRef
  created_at: string
}

export type ActivityAction =
  | 'task_created'
  | 'task_updated'
  | 'status_changed'
  | 'commented'
  | 'member_added'

export interface Activity {
  id: string
  action: ActivityAction
  message: string
  actor: UserRef
  task_id: string | null
  created_at: string
}

export interface AuthResponse {
  user: User
  access: string
  refresh: string
}

export interface InviteResponse {
  detail: string
  user?: User
}

export type FieldErrors = Record<string, string[]>

