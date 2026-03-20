'use client'

import { useEffect, useRef } from 'react'
import { VibeEvent, EVENT_ICONS, TEAMS } from '@/types/vibe'

interface Props {
  events: VibeEvent[]
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateStr = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  if (date.toDateString() === today.toDateString()) return `오늘 · ${dateStr}`
  if (date.toDateString() === yesterday.toDateString()) return `어제 · ${dateStr}`
  return dateStr
}

function getDateKey(iso: string): string {
  return new Date(iso).toDateString()
}

const TYPE_COLORS: Record<string, string> = {
  SESSION_START: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  LOG: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20',
  MILESTONE: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
  TASK_ADD: 'border-cyan-300 bg-cyan-50 dark:bg-cyan-900/20',
  TASK_DONE: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  SESSION_END: 'border-gray-400 bg-gray-50 dark:bg-gray-800/50',
}

function getTeamColor(teamId?: string): string | null {
  if (!teamId) return null
  const team = TEAMS.find((t) => t.id === teamId)
  return team?.color || null
}

function TeamBadge({ teamId }: { teamId: string }) {
  const team = TEAMS.find((t) => t.id === teamId)
  if (!team) return null
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
      style={{ backgroundColor: team.color }}
    >
      {team.name}
    </span>
  )
}

export default function Timeline({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  if (events.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          📜 세션 타임라인
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">이벤트가 없습니다. Discord에서 /vibe 명령어를 사용해 보세요.</p>
      </div>
    )
  }

  // Precompute date separators to avoid mutable variable during render
  const dateSeparators = new Set<number>()
  let prevDateKey = ''
  for (let i = 0; i < events.length; i++) {
    const dateKey = getDateKey(events[i].timestamp)
    if (dateKey !== prevDateKey) {
      dateSeparators.add(i)
      prevDateKey = dateKey
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          📜 세션 타임라인
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {events.length}개 이벤트
        </span>
      </div>

      <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
        {events.map((event, i) => {
          const teamColor = getTeamColor(event.team)

          return (
            <div key={event.id}>
              {/* Date Separator */}
              {dateSeparators.has(i) && (
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    {formatDate(event.timestamp)}
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>
              )}

              {/* Event Card */}
              <div
                className={`flex items-start gap-3 rounded-xl border-l-4 px-4 py-3 transition-all ${TYPE_COLORS[event.type] ?? ''} ${i === events.length - 1 ? 'animate-pulse-once' : ''}`}
                style={teamColor ? { borderLeftColor: teamColor } : undefined}
              >
                <span className="mt-0.5 text-lg">{EVENT_ICONS[event.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {event.content}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    {formatTime(event.timestamp)}
                    {event.author && ` · ${event.author}`}
                    {event.team && <TeamBadge teamId={event.team} />}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
