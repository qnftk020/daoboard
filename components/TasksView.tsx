'use client'

import { useState } from 'react'
import { Task, TEAMS, VibeEvent } from '@/types/vibe'
import { formatRelativeTime } from '@/lib/format'

interface Props {
  tasks: Task[]
  allEvents: VibeEvent[]
  selectedTeam: string | null
}

type TaskFilter = 'all' | 'open' | 'done'

function getDaysSinceCreation(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

export default function TasksView({ tasks, allEvents, selectedTeam }: Props) {
  const [filter, setFilter] = useState<TaskFilter>('all')

  // 조별 태스크 매핑 (이벤트에서 조 정보 가져오기)
  const taskWithTeam = tasks.map((task) => {
    const event = allEvents.find((e) => e.id === task.id)
    return { ...task, team: event?.team }
  })

  // 필터링
  const filteredTasks = taskWithTeam.filter((task) => {
    if (filter === 'open' && task.done) return false
    if (filter === 'done' && !task.done) return false
    if (selectedTeam && selectedTeam !== 'test' && task.team !== selectedTeam) return false
    if (selectedTeam === 'test' && task.team !== 'test' && task.team !== undefined) return false
    return true
  })

  const openTasks = taskWithTeam.filter((t) => !t.done)
  const doneTasks = taskWithTeam.filter((t) => t.done)
  const overdueTasks = openTasks.filter((t) => getDaysSinceCreation(t.createdAt) > 7)

  const filters: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'all', label: '전체', count: taskWithTeam.length },
    { id: 'open', label: '진행 중', count: openTasks.length },
    { id: 'done', label: '완료', count: doneTasks.length },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <p className="text-[10px] font-medium text-cyan-600 sm:text-xs dark:text-cyan-400">진행 중</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">{openTasks.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <p className="text-[10px] font-medium text-green-600 sm:text-xs dark:text-green-400">완료</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">{doneTasks.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <p className="text-[10px] font-medium text-red-500 sm:text-xs dark:text-red-400">장기 미완료</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">{overdueTasks.length}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">7일 이상 미완료</p>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800/50 dark:bg-red-900/20">
          <h3 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-400">
            ⏰ 장기 미완료 태스크
          </h3>
          <div className="space-y-2">
            {overdueTasks.map((task) => {
              const team = task.team ? TEAMS.find((t) => t.id === task.team) : null
              const days = getDaysSinceCreation(task.createdAt)
              return (
                <div key={task.id} className="flex flex-col gap-1 rounded-lg bg-white/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:bg-gray-800/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 text-red-400">⬜</span>
                    <span className="truncate text-sm text-gray-800 dark:text-gray-200">{task.name}</span>
                    {team && (
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 pl-6 text-xs font-medium text-red-500 sm:pl-0">{days}일 경과</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === f.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-60">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Task List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const team = task.team ? TEAMS.find((t) => t.id === task.team) : null
              const days = getDaysSinceCreation(task.createdAt)
              const isOverdue = !task.done && days > 7

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    task.done
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : isOverdue
                        ? 'bg-red-50 dark:bg-red-900/10'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <span className={task.done ? 'text-green-500' : isOverdue ? 'text-red-400' : 'text-gray-400'}>
                    {task.done ? '✅' : isOverdue ? '🔴' : '⬜'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${task.done ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                      {task.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                      {task.done && task.completedAt
                        ? `완료: ${formatRelativeTime(task.completedAt)}`
                        : `생성: ${formatRelativeTime(task.createdAt)}`}
                      {team && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.name}
                        </span>
                      )}
                      {isOverdue && <span className="text-red-500">{days}일 경과</span>}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            {filter === 'open' ? '진행 중인 태스크가 없습니다' : filter === 'done' ? '완료된 태스크가 없습니다' : '태스크가 없습니다'}
          </p>
        )}
      </div>
    </div>
  )
}
