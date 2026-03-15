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
  team?: string // '1' | '2' | '3' | '4' | '5'
}

export const TEAMS = [
  { id: '1', name: '1팀', color: '#8B5CF6' },  // purple
  { id: '2', name: '2팀', color: '#3B82F6' },  // blue
  { id: '3', name: '3팀', color: '#10B981' },  // green
  { id: '4', name: '4팀', color: '#F59E0B' },  // amber
  { id: '5', name: '5팀', color: '#EF4444' },  // red
  { id: 'test', name: '테스트', color: '#6B7280' },  // gray
] as const

export type TeamId = '1' | '2' | '3' | '4' | '5' | 'test'

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
