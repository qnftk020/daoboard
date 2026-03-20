'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { getPusherClient } from '@/lib/pusher-client'
import { DashboardState, VibeEvent, Session, Task, Milestone, TEAMS } from '@/types/vibe'
import SessionBanner from './SessionBanner'
import ProgressBar from './ProgressBar'
import Timeline from './Timeline'
import OverviewView from './OverviewView'
import TasksView from './TasksView'
import MilestonesView from './MilestonesView'

type TabId = 'overview' | 'live' | 'tasks' | 'milestones'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'live', label: 'Live', icon: '⚡' },
  { id: 'tasks', label: 'Tasks', icon: '📋' },
  { id: 'milestones', label: 'Milestones', icon: '🏆' },
]

function buildStateFromEvents(events: VibeEvent[]): DashboardState {
  let session: Session | null = null
  const tasks: Task[] = []
  const milestones: Milestone[] = []

  for (const event of events) {
    switch (event.type) {
      case 'SESSION_START':
        session = {
          id: event.id,
          name: event.content,
          startedAt: event.timestamp,
          isActive: true,
        }
        break
      case 'SESSION_END':
        if (session) {
          session.endedAt = event.timestamp
          session.isActive = false
        }
        break
      case 'TASK_ADD':
        tasks.push({
          id: event.id,
          name: event.content,
          done: false,
          createdAt: event.timestamp,
        })
        break
      case 'TASK_DONE': {
        const task = tasks.find((t) => t.name === event.content && !t.done)
        if (task) {
          task.done = true
          task.completedAt = event.timestamp
        }
        break
      }
      case 'MILESTONE':
        milestones.push({
          id: event.id,
          name: event.content,
          achievedAt: event.timestamp,
        })
        break
    }
  }

  return { session, events, tasks, milestones }
}

export default function Dashboard() {
  const [allEvents, setAllEvents] = useState<VibeEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const MAX_EVENTS = 5000

  const addEvent = useCallback((event: VibeEvent) => {
    setAllEvents((prev) => {
      const next = [...prev, event]
      return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next
    })
  }, [])

  // Filter events by team
  const filteredEvents = useMemo(() => {
    if (!selectedTeam) return allEvents
    if (selectedTeam === 'test') {
      return allEvents.filter((e) => e.team === 'test' || !e.team)
    }
    return allEvents.filter((e) => e.team === selectedTeam)
  }, [allEvents, selectedTeam])

  // Build state from filtered events
  const state = useMemo(() => buildStateFromEvents(filteredEvents), [filteredEvents])
  const allState = useMemo(() => buildStateFromEvents(allEvents), [allEvents])

  // Team stats
  const teamStats = useMemo(() => {
    const stats: Record<string, { events: number; tasks: number; tasksDone: number; milestones: number; hasActiveSession: boolean; lastActivity: string | null }> = {}
    for (const team of TEAMS) {
      const teamEvents = team.id === 'test'
        ? allEvents.filter((e) => e.team === 'test' || !e.team)
        : allEvents.filter((e) => e.team === team.id)
      const teamTasks = teamEvents.filter((e) => e.type === 'TASK_ADD')
      const teamTasksDone = teamEvents.filter((e) => e.type === 'TASK_DONE')
      const teamMilestones = teamEvents.filter((e) => e.type === 'MILESTONE')
      const lastStart = teamEvents.filter((e) => e.type === 'SESSION_START').pop()
      const lastEnd = teamEvents.filter((e) => e.type === 'SESSION_END').pop()
      const hasActiveSession = lastStart
        ? !lastEnd || new Date(lastStart.timestamp) > new Date(lastEnd.timestamp)
        : false
      const lastActivity = teamEvents.length > 0 ? teamEvents[teamEvents.length - 1].timestamp : null

      stats[team.id] = {
        events: teamEvents.length,
        tasks: teamTasks.length,
        tasksDone: teamTasksDone.length,
        milestones: teamMilestones.length,
        hasActiveSession,
        lastActivity,
      }
    }
    return stats
  }, [allEvents])

  // Active session count for Live tab badge
  const activeSessionCount = useMemo(() => {
    return TEAMS.filter((t) => t.id !== 'test' && teamStats[t.id]?.hasActiveSession).length
  }, [teamStats])

  // Load initial history
  useEffect(() => {
    fetch('/api/logs', { cache: 'no-store' })
      .then((res) => res.json())
      .then((events: VibeEvent[]) => {
        if (events.length > 0) {
          setAllEvents(events)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Subscribe to Pusher
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) return

    const pusher = getPusherClient()
    const channel = pusher.subscribe('daoboard')

    channel.bind('pusher:subscription_succeeded', () => setConnected(true))
    channel.bind('vibe-update', (data: VibeEvent) => addEvent(data))

    pusher.connection.bind('connected', () => setConnected(true))
    pusher.connection.bind('disconnected', () => setConnected(false))

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [addEvent])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status + Team Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          {connected ? 'Pusher 연결됨' : '연결 대기 중...'}
        </div>

        {/* Team Quick Filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedTeam(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedTeam === null
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            전체
          </button>
          {TEAMS.filter((t) => t.id !== 'test').map((team) => {
            const isSelected = selectedTeam === team.id
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(isSelected ? null : team.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  isSelected
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
                style={isSelected ? { backgroundColor: team.color } : undefined}
              >
                <span className="flex items-center gap-1">
                  {!isSelected && (
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: team.color }} />
                  )}
                  {team.name}
                  {teamStats[team.id]?.hasActiveSession && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                    </span>
                  )}
                </span>
              </button>
            )
          })}
          {/* 테스트 탭 */}
          <button
            onClick={() => setSelectedTeam(selectedTeam === 'test' ? null : 'test')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedTeam === 'test'
                ? 'bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <span className="flex items-center gap-1">
              {selectedTeam !== 'test' && (
                <span className="h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-300" />
              )}
              테스트
            </span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/80">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {/* Live badge */}
            {tab.id === 'live' && activeSessionCount > 0 && activeTab !== 'live' && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                {activeSessionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewView
          allEvents={selectedTeam ? filteredEvents : allEvents}
          tasks={state.tasks}
          milestones={state.milestones}
          teamStats={teamStats}
          onSelectTeam={(teamId) => {
            setSelectedTeam(teamId)
            setActiveTab('live')
          }}
          onSwitchToLive={() => setActiveTab('live')}
        />
      )}

      {activeTab === 'live' && (
        <div className="space-y-6">
          <SessionBanner session={state.session} />
          <div className="grid gap-6 md:grid-cols-2">
            <ProgressBar tasks={state.tasks} />
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                🏆 마일스톤
              </h3>
              {state.milestones.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {state.milestones.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    >
                      🏆 {m.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">아직 달성된 마일스톤이 없습니다</p>
              )}
            </div>
          </div>
          <Timeline events={state.events} />
        </div>
      )}

      {activeTab === 'tasks' && (
        <TasksView
          tasks={allState.tasks}
          allEvents={allEvents}
          selectedTeam={selectedTeam}
        />
      )}

      {activeTab === 'milestones' && (
        <MilestonesView
          milestones={selectedTeam ? state.milestones : allState.milestones}
          allEvents={allEvents}
        />
      )}
    </div>
  )
}
