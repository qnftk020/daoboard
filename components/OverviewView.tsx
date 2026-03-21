'use client'

import { VibeEvent, Task, Milestone, TEAMS } from '@/types/vibe'
import { formatRelativeTime } from '@/lib/format'

interface TeamStat {
  events: number
  tasks: number
  tasksDone: number
  milestones: number
  hasActiveSession: boolean
  lastActivity: string | null
}

interface Props {
  allEvents: VibeEvent[]
  tasks: Task[]
  milestones: Milestone[]
  teamStats: Record<string, TeamStat>
  onSelectTeam: (teamId: string) => void
  onSwitchToLive: () => void
}

function getWeekSummary(events: VibeEvent[]): { thisWeek: VibeEvent[]; lastWeek: VibeEvent[] } {
  const now = new Date()
  const startOfWeek = new Date(now)
  const day = startOfWeek.getDay()
  startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1))
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfLastWeek = new Date(startOfWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  const thisWeek = events.filter((e) => new Date(e.timestamp) >= startOfWeek)
  const lastWeek = events.filter(
    (e) => new Date(e.timestamp) >= startOfLastWeek && new Date(e.timestamp) < startOfWeek
  )
  return { thisWeek, lastWeek }
}

export default function OverviewView({ allEvents, tasks, milestones, teamStats, onSelectTeam, onSwitchToLive }: Props) {
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.done).length
  const overallPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const { thisWeek, lastWeek } = getWeekSummary(allEvents)
  const weekDelta = thisWeek.length - lastWeek.length

  const recentMilestones = milestones.slice(-3).reverse()

  // 활동이 없는 조 감지 (3일 이상)
  const inactiveTeams = TEAMS.filter((t) => t.id !== 'test').filter((team) => {
    const stat = teamStats[team.id]
    if (!stat || !stat.lastActivity) return true
    const daysSince = (Date.now() - new Date(stat.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince > 3
  })

  if (allEvents.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">⚡</span>
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">아직 데이터가 없습니다</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Discord에서 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">/daoboard start</code>로 첫 세션을 시작해 보세요
          </p>
          <div className="mt-6 space-y-2 text-left text-sm text-gray-400 dark:text-gray-500">
            <p><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">/daoboard start</code> — 세션 시작</p>
            <p><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">/daoboard task</code> — 태스크 추가</p>
            <p><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">/daoboard milestone</code> — 마일스톤 기록</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">전체 이벤트</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{allEvents.length}</p>
          <p className="mt-1 text-xs text-gray-400">
            이번 주 +{thisWeek.length}
            {weekDelta !== 0 && (
              <span className={weekDelta > 0 ? 'text-green-500' : 'text-red-400'}>
                {' '}({weekDelta > 0 ? '▲' : '▼'}{Math.abs(weekDelta)} vs 지난주)
              </span>
            )}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">태스크 완료율</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{overallPercent}%</p>
          <p className="mt-1 text-xs text-gray-400">{doneTasks}/{totalTasks} 완료</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">마일스톤</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{milestones.length}</p>
          <p className="mt-1 text-xs text-gray-400">달성 완료</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">활성 조</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {TEAMS.filter((t) => t.id !== 'test').length - inactiveTeams.length}
            <span className="text-lg font-normal text-gray-400">/{TEAMS.filter((t) => t.id !== 'test').length}</span>
          </p>
          {inactiveTeams.length > 0 && (
            <p className="mt-1 text-xs text-amber-500">{inactiveTeams.length}조 휴면</p>
          )}
        </div>
      </div>

      {/* Team Progress Cards */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          조별 진행 현황
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEAMS.filter((t) => t.id !== 'test').map((team) => {
            const stat = teamStats[team.id]
            if (!stat) return null
            const completionRate = stat.tasks > 0 ? Math.round((stat.tasksDone / stat.tasks) * 100) : 0
            const isInactive = inactiveTeams.some((t) => t.id === team.id)

            return (
              <button
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className={`group rounded-xl border p-4 text-left transition hover:shadow-md ${
                  isInactive
                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-900/10'
                    : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{team.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stat.hasActiveSession && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                        </span>
                        Live
                      </span>
                    )}
                    {isInactive && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        휴면
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%`, backgroundColor: team.color }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>태스크 {stat.tasksDone}/{stat.tasks}</span>
                  <span>마일스톤 {stat.milestones}</span>
                </div>

                {stat.lastActivity && (
                  <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                    마지막 활동: {formatRelativeTime(stat.lastActivity)}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Weekly Summary + Recent Milestones */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Summary */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            이번 주 요약
          </h3>
          {thisWeek.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5 dark:bg-blue-900/20">
                <span className="text-sm text-blue-700 dark:text-blue-300">로그</span>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {thisWeek.filter((e) => e.type === 'LOG').length}건
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-cyan-50 px-4 py-2.5 dark:bg-cyan-900/20">
                <span className="text-sm text-cyan-700 dark:text-cyan-300">태스크 추가</span>
                <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
                  {thisWeek.filter((e) => e.type === 'TASK_ADD').length}건
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-2.5 dark:bg-green-900/20">
                <span className="text-sm text-green-700 dark:text-green-300">태스크 완료</span>
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  {thisWeek.filter((e) => e.type === 'TASK_DONE').length}건
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2.5 dark:bg-amber-900/20">
                <span className="text-sm text-amber-700 dark:text-amber-300">마일스톤</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {thisWeek.filter((e) => e.type === 'MILESTONE').length}건
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">이번 주 활동이 아직 없습니다</p>
          )}
        </div>

        {/* Recent Milestones */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            최근 마일스톤
          </h3>
          {recentMilestones.length > 0 ? (
            <div className="space-y-3">
              {recentMilestones.map((m) => {
                const event = allEvents.find((e) => e.id === m.id)
                const team = event?.team ? TEAMS.find((t) => t.id === event.team) : null
                return (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
                    <span className="text-lg">🏆</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{m.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-amber-600/70 dark:text-amber-400/70">
                        {formatRelativeTime(m.achievedAt)}
                        {team && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: team.color }}
                          >
                            {team.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">아직 달성된 마일스톤이 없습니다</p>
          )}
        </div>
      </div>

      {/* Inactive Team Alert */}
      {inactiveTeams.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/50 dark:bg-amber-900/20">
          <h3 className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            ⚠️ 활동이 없는 조
          </h3>
          <p className="mb-3 text-xs text-amber-600/80 dark:text-amber-400/80">
            최근 3일 이상 활동이 없는 조입니다
          </p>
          <div className="flex flex-wrap gap-2">
            {inactiveTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/40"
              >
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: team.color }} />
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
