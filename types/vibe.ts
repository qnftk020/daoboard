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
  { id: '1', name: '1조', color: '#8B5CF6', notionUrl: 'https://www.notion.so/daolabus/1-32ab24a446a78064beb8ff787d1e6f81' },
  { id: '2', name: '2조', color: '#3B82F6', notionUrl: 'https://www.notion.so/daolabus/31ab24a446a781508dafe6ef2cbf608f' },
  { id: '3', name: '3조', color: '#10B981', notionUrl: 'https://www.notion.so/daolabus/3-32ab24a446a780aab396ecb38a487a15' },
  { id: '4', name: '4조', color: '#F59E0B', notionUrl: 'https://www.notion.so/daolabus/4-32ab24a446a7809eb97cede0e5f28bbc' },
  { id: '5', name: '5조', color: '#EF4444', notionUrl: 'https://www.notion.so/daolabus/5-323b24a446a78099a1b6cd521b9e7e67' },
  { id: '6', name: '6조', color: '#EC4899', notionUrl: 'https://www.notion.so/daolabus/6-32ab24a446a78018a1f4ea7f7601fc61' },
  { id: 'test', name: '테스트', color: '#6B7280', notionUrl: null },
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
