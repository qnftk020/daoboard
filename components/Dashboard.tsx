'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPusherClient } from '@/lib/pusher-client'
import { DashboardState, VibeEvent, Session, Task, Milestone } from '@/types/vibe'
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
  const [state, setState] = useState<DashboardState>({
    session: null,
    events: [],
    tasks: [],
    milestones: [],
  })
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  const addEvent = useCallback((event: VibeEvent) => {
    setState((prev) => {
      const events = [...prev.events, event]
      return buildStateFromEvents(events)
    })
  }, [])

  // Load initial history
  useEffect(() => {
    fetch('/api/logs')
      .then((res) => res.json())
      .then((events: VibeEvent[]) => {
        if (events.length > 0) {
          setState(buildStateFromEvents(events))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Subscribe to Pusher
  useEffect(() => {
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
