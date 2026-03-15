'use client'

import { Milestone } from '@/types/vibe'

interface Props {
  milestones: Milestone[]
}

export default function MilestoneTracker({ milestones }: Props) {
  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          🏆 마일스톤
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">아직 달성된 마일스톤이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        🏆 마일스톤
      </h3>
      <div className="flex flex-wrap gap-2">
        {milestones.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          >
            🏆 {m.name}
          </span>
        ))}
      </div>
    </div>
  )
}
