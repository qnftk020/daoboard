'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { getPusherClient } from '@/lib/pusher-client'
import { DashboardState, VibeEvent, Session, Task, Milestone, TEAMS } from '@/types/vibe'
import SessionBanner from './SessionBanner'
import ProgressBar from './ProgressBar'
import MilestoneTracker from './MilestoneTracker'
import Timeline from './Timeline'

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
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null) // null = 전체

  const addEvent = useCallback((event: VibeEvent) => {
    setAllEvents((prev) => [...prev, event])
  }, [])

  // Calculate available weeks from events
  const weekInfo = useMemo(() => {
    if (allEvents.length === 0) return { weeks: [], startDate: null }
    const timestamps = allEvents.map((e) => new Date(e.timestamp).getTime())
    const earliest = new Date(Math.min(...timestamps))
    // Start of the first week (Monday)
    const startDate = new Date(earliest)
    startDate.setHours(0, 0, 0, 0)
    const day = startDate.getDay()
    startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1)) // Monday

    const latest = new Date(Math.max(...timestamps))
    const totalWeeks = Math.ceil((latest.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))

    const weeks = Array.from({ length: Math.max(totalWeeks, 1) }, (_, i) => ({
      num: i + 1,
      start: new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000),
      end: new Date(startDate.getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
    }))

    return { weeks, startDate }
  }, [allEvents])

  // Filter events by team + week
  const filteredEvents = useMemo(() => {
    let events = allEvents
    if (selectedTeam) {
      if (selectedTeam === 'test') {
        // 테스트 탭: team이 'test'이거나 team이 없는(undefined) 이벤트
        events = events.filter((e) => e.team === 'test' || !e.team)
      } else {
        events = events.filter((e) => e.team === selectedTeam)
      }
    }
    if (selectedWeek !== null && weekInfo.weeks[selectedWeek - 1]) {
      const week = weekInfo.weeks[selectedWeek - 1]
      events = events.filter((e) => {
        const t = new Date(e.timestamp).getTime()
        return t >= week.start.getTime() && t < week.end.getTime()
      })
    }
    return events
  }, [allEvents, selectedTeam, selectedWeek, weekInfo])

  // Build state from filtered events
  const state = useMemo(() => buildStateFromEvents(filteredEvents), [filteredEvents])

  // Team stats
  const teamStats = useMemo(() => {
    const stats: Record<string, { events: number; tasks: number; tasksDone: number; milestones: number; hasActiveSession: boolean }> = {}
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

      stats[team.id] = {
        events: teamEvents.length,
        tasks: teamTasks.length,
        tasksDone: teamTasksDone.length,
        milestones: teamMilestones.length,
        hasActiveSession,
      }
    }
    return stats
  }, [allEvents])

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
      {/* Connection status */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
        {connected ? 'Pusher 연결됨' : '연결 대기 중...'}
      </div>

      {/* Team Tabs */}
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">팀별 보기</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* 전체 탭 */}
          <button
            onClick={() => setSelectedTeam(null)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedTeam === null
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            전체
            <span className="ml-1.5 text-xs opacity-60">{allEvents.length}</span>
          </button>

          {/* 팀별 탭 */}
          {TEAMS.map((team) => {
            const stats = teamStats[team.id]
            const isSelected = selectedTeam === team.id
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isSelected
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
                style={isSelected ? { backgroundColor: team.color } : undefined}
              >
                <span className="flex items-center gap-1.5">
                  {!isSelected && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                  {team.name}
                  <span className="text-xs opacity-60">{stats.events}</span>
                  {stats.hasActiveSession && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Week Filter */}
      {weekInfo.weeks.length > 1 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">📅 주차별 보기</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedWeek(null)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedWeek === null
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              전체
            </button>
            {weekInfo.weeks.map((week) => {
              const label = `${week.num}주차`
              const dateRange = `${week.start.getMonth() + 1}/${week.start.getDate()}~${week.end.getMonth() + 1}/${week.end.getDate()}`
              const isCurrentWeek = new Date() >= week.start && new Date() < week.end
              return (
                <button
                  key={week.num}
                  onClick={() => setSelectedWeek(week.num)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    selectedWeek === week.num
                      ? 'bg-purple-600 text-white'
                      : isCurrentWeek
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                  <span className="ml-1 opacity-50">{dateRange}</span>
                  {isCurrentWeek && selectedWeek !== week.num && (
                    <span className="ml-1 text-[10px]">now</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Team Overview Cards (전체 보기일 때만) */}
      {selectedTeam === null && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TEAMS.filter((t) => t.id !== 'test').map((team) => {
            const stats = teamStats[team.id]
            const completionRate = stats.tasks > 0 ? Math.round((stats.tasksDone / stats.tasks) * 100) : 0
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className="group rounded-xl bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:bg-gray-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name}
                  </span>
                  {stats.hasActiveSession && (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                      </span>
                      Live
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">이벤트</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.events}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">태스크</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {stats.tasksDone}/{stats.tasks}
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${completionRate}%`,
                        backgroundColor: team.color,
                      }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">마일스톤</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{stats.milestones}🏆</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Session Banner */}
      <SessionBanner session={state.session} />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProgressBar tasks={state.tasks} />
        <MilestoneTracker milestones={state.milestones} />
      </div>

      {/* Timeline */}
      <Timeline events={state.events} />
    </div>
  )
}
