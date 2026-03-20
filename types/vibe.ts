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
  team?: string
  channelId?: string
  channelName?: string
  projectId?: string
  phaseId?: string
  dueDate?: string
  assignee?: string
  status?: 'active' | 'archived'
  source?: 'discord' | 'admin' | 'migration' | 'ai-assisted'
}

export interface Project {
  id: string
  name: string
  startDate: string
  endDate?: string
  status: 'active' | 'archived'
}

export interface Phase {
  id: string
  projectId: string
  name: string
  order: number
  startDate?: string
  endDate?: string
}

export const TEAMS = [
  { id: '1', name: '1조', color: '#8B5CF6' },  // purple
  { id: '2', name: '2조', color: '#3B82F6' },  // blue
  { id: '3', name: '3조', color: '#10B981' },  // green
  { id: '4', name: '4조', color: '#F59E0B' },  // amber
  { id: '5', name: '5조', color: '#EF4444' },  // red
  { id: '6', name: '6조', color: '#EC4899' },  // pink
  { id: 'test', name: '테스트', color: '#6B7280' },  // gray
] as const

export type TeamId = '1' | '2' | '3' | '4' | '5' | '6' | 'test'

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
