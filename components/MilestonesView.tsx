'use client'

import { Milestone, VibeEvent, TEAMS } from '@/types/vibe'
import { formatRelativeTime } from '@/lib/format'

interface Props {
  milestones: Milestone[]
  allEvents: VibeEvent[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function MilestonesView({ milestones, allEvents }: Props) {
  // 조별 마일스톤 그룹핑
  const milestonesByTeam = new Map<string, Milestone[]>()
  const noTeamMilestones: Milestone[] = []

  for (const m of milestones) {
    const event = allEvents.find((e) => e.id === m.id)
    const teamId = event?.team
    if (teamId) {
      if (!milestonesByTeam.has(teamId)) milestonesByTeam.set(teamId, [])
      milestonesByTeam.get(teamId)!.push(m)
    } else {
      noTeamMilestones.push(m)
    }
  }

  if (milestones.length === 0) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🏆</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">아직 달성된 마일스톤이 없습니다</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Discord에서 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">/daoboard milestone</code>으로 기록하세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-5 dark:from-amber-900/20 dark:to-amber-800/20">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">전체 마일스톤</p>
          <p className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-300">{milestones.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">참여 조</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{milestonesByTeam.size}</p>
        </div>
        {milestones.length > 0 && (
          <div className="col-span-2 rounded-2xl bg-white p-5 shadow-sm sm:col-span-1 dark:bg-gray-900">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">최근 달성</p>
            <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
              {milestones[milestones.length - 1].name}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {formatRelativeTime(milestones[milestones.length - 1].achievedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6 dark:bg-gray-900">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          마일스톤 타임라인
        </h3>

        <div className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-amber-200 dark:bg-amber-800/50" />

          {[...milestones].reverse().map((m, i) => {
            const event = allEvents.find((e) => e.id === m.id)
            const team = event?.team ? TEAMS.find((t) => t.id === event.team) : null

            return (
              <div key={m.id} className={`relative flex items-start gap-4 py-4 ${i === 0 ? 'animate-fade-in' : ''}`}>
                {/* Dot */}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <span className="text-sm">🏆</span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{m.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-600/70 dark:text-amber-400/70">
                    {formatDate(m.achievedAt)}
                    {event?.author && ` · ${event.author}`}
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
      </div>

      {/* By Team */}
      {milestonesByTeam.size > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            조별 마일스톤
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {TEAMS.filter((t) => t.id !== 'test' && milestonesByTeam.has(t.id)).map((team) => {
              const teamMilestones = milestonesByTeam.get(team.id)!
              return (
                <div key={team.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{team.name}</span>
                    <span className="text-xs text-gray-400">{teamMilestones.length}개</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teamMilestones.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        🏆 {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
