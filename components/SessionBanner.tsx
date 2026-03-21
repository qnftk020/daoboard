'use client'

import { useEffect, useState } from 'react'
import { Session } from '@/types/vibe'

interface Props {
  session: Session | null
}

function formatElapsed(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (hours > 0) return `${hours}시간 ${minutes}분`
  if (minutes > 0) return `${minutes}분 ${seconds}초`
  return `${seconds}초`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SessionBanner({ session }: Props) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (!session?.isActive || !session.startedAt) return

    const update = () => setElapsed(formatElapsed(session.startedAt))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [session])

  if (!session) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6 text-center dark:border-gray-700 dark:bg-white/5">
        <p className="text-gray-500 dark:text-gray-400">세션이 아직 시작되지 않았습니다</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Discord에서 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">/daoboard start</code> 으로 시작하세요
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white shadow-lg dark:from-purple-700 dark:to-indigo-800">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium uppercase tracking-wider text-purple-200">현재 세션</span>
          {session.isActive ? (
            <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              Live
            </span>
          ) : (
            <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-xs font-semibold text-gray-300">
              종료됨
            </span>
          )}
        </div>

        <h2 className="text-xl font-bold sm:text-2xl break-words">{session.name}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-purple-200 sm:gap-4">
          <span>시작: {formatTime(session.startedAt)}</span>
          {session.isActive && elapsed && (
            <span className="rounded-lg bg-white/10 px-2 py-1 font-mono text-white">
              ⏱ {elapsed}
            </span>
          )}
          {session.endedAt && <span>종료: {formatTime(session.endedAt)}</span>}
        </div>
      </div>
    </div>
  )
}
