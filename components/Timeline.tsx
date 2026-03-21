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

  // 핵심 이벤트와 로그 분리
  const keyEvents = events.filter((e) => e.type !== 'LOG')
  const logEvents = events.filter((e) => e.type === 'LOG')

  if (events.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          📜 타임라인
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">이벤트가 없습니다. Discord에서 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">/daoboard</code> 명령어를 사용해 보세요.</p>
      </div>
    )
  }

  // Precompute date separators for key events
  const dateSeparators = new Set<number>()
  let prevDateKey = ''
  for (let i = 0; i < keyEvents.length; i++) {
    const dateKey = getDateKey(keyEvents[i].timestamp)
    if (dateKey !== prevDateKey) {
      dateSeparators.add(i)
      prevDateKey = dateKey
    }
  }

  return (
    <div className="space-y-4">
      {/* 핵심 이벤트 타임라인 */}
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            📜 타임라인
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {keyEvents.length}개 이벤트
          </span>
        </div>

        {keyEvents.length > 0 ? (
          <div className={`space-y-2 overflow-y-auto pr-1 ${keyEvents.length > 10 ? 'max-h-[500px]' : keyEvents.length > 5 ? 'max-h-[350px]' : ''}`}>
            {keyEvents.map((event, i) => {
              const teamColor = getTeamColor(event.team)
              return (
                <div key={event.id}>
                  {dateSeparators.has(i) && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        {formatDate(event.timestamp)}
                      </span>
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    </div>
                  )}
                  <div
                    className={`flex items-start gap-2 rounded-xl border-l-4 px-3 py-2.5 transition-all sm:gap-3 sm:px-4 sm:py-3 ${TYPE_COLORS[event.type] ?? ''} ${i === keyEvents.length - 1 ? 'animate-fade-in' : ''}`}
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
            <div ref={logEvents.length === 0 ? bottomRef : undefined} />
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">세션, 태스크, 마일스톤 이벤트가 없습니다.</p>
        )}
      </div>

      {/* 활동 로그 (접기/펼치기) */}
      {logEvents.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-900">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between px-6 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-t-2xl dark:focus-visible:ring-offset-gray-900">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                📝 활동 로그
              </h3>
              <span className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                {logEvents.length}개
                <span className="transition group-open:rotate-180">▾</span>
              </span>
            </summary>
            <div className={`space-y-1 overflow-y-auto px-6 pb-4 ${logEvents.length > 10 ? 'max-h-[400px]' : logEvents.length > 5 ? 'max-h-[280px]' : ''}`}>
              {logEvents.map((event, i) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${i === logEvents.length - 1 ? 'animate-fade-in bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                >
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {formatTime(event.timestamp)}
                  </span>
                  <span className="min-w-0 flex-1 text-gray-700 dark:text-gray-300 truncate">
                    {event.content}
                  </span>
                  {event.author && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      {event.author}
                    </span>
                  )}
                  {event.team && <TeamBadge teamId={event.team} />}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
