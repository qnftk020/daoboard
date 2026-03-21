'use client'

import { Task } from '@/types/vibe'

interface Props {
  tasks: Task[]
}

export default function ProgressBar({ tasks }: Props) {
  const total = tasks.length
  const done = tasks.filter((t) => t.done).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          ✅ 태스크 완료율
        </h3>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {done}/{total} 완료
        </span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-right text-lg font-bold text-gray-900 dark:text-white">{percent}%</p>

      {total > 0 && (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-sm">
              <span className={task.done ? 'text-green-500' : 'text-gray-400 dark:text-gray-600'}>
                {task.done ? '✅' : '⬜'}
              </span>
              <span className={task.done ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}>
                {task.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
