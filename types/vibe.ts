export type VibeEventType =
  | 'SESSION_START'
  | 'LOG'
  | 'MILESTONE'
  | 'TASK_ADD'
  | 'TASK_DONE'
  | 'SESSION_END'

export interface VibeEvent {
  id: string
  type: VibeEventType
  content: string
  timestamp: string
  author?: string
}

export interface Task {
  id: string
  name: string
  done: boolean
  createdAt: string
  completedAt?: string
}

export interface Milestone {
  id: string
  name: string
  achievedAt: string
}

export interface Session {
  id: string
  name: string
  startedAt: string
  endedAt?: string
  isActive: boolean
}

export interface DashboardState {
  session: Session | null
  events: VibeEvent[]
  tasks: Task[]
  milestones: Milestone[]
}

export const EVENT_ICONS: Record<VibeEventType, string> = {
  SESSION_START: '🚀',
  LOG: '📝',
  MILESTONE: '🏆',
  TASK_ADD: '📋',
  TASK_DONE: '✅',
  SESSION_END: '🏁',
}

export const VIBE_PREFIXES: Record<string, VibeEventType> = {
  '[VIBE:START]': 'SESSION_START',
  '[VIBE:LOG]': 'LOG',
  '[VIBE:MILESTONE]': 'MILESTONE',
  '[VIBE:TASK_ADD]': 'TASK_ADD',
  '[VIBE:TASK_DONE]': 'TASK_DONE',
  '[VIBE:END]': 'SESSION_END',
}
