'use client'

import { useState, useEffect } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

interface StatusData {
  discord: {
    connected: boolean
    botName?: string
    guildName?: string
    channelName?: string
    error?: string
  }
  pusher: {
    connected: boolean
    error?: string
  }
  env: Record<string, boolean>
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> 연결됨
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> 미연결
    </span>
  )
}

function EnvBadge({ label, set }: { label: string; set: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
      <code className="text-xs text-gray-600 dark:text-gray-400">{label}</code>
      {set ? (
        <span className="text-xs text-green-600 dark:text-green-400">✓ 설정됨</span>
      ) : (
        <span className="text-xs text-red-500">✗ 미설정</span>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) {
      setLoggedIn(true)
      fetchStatus()
    } else {
      const data = await res.json()
      setLoginError(data.error)
    }
  }

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/status')
      if (res.ok) {
        setStatus(await res.json())
      } else if (res.status === 401) {
        setLoggedIn(false)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if already logged in
    fetch('/api/admin/status')
      .then((res) => {
        if (res.ok) {
          setLoggedIn(true)
          return res.json()
        }
        return null
      })
      .then((data) => {
        if (data) setStatus(data)
      })
  }, [])

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="text-3xl">⚡</span>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">DAOboard Admin</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">관리자 로그인</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="아이디 입력"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="비밀번호 입력"
              />
            </div>
            {loginError && <p className="text-sm text-red-500">{loginError}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              로그인
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            DAOboard <span className="text-sm font-normal text-purple-500">Admin</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ← 대시보드
          </a>
          <ThemeToggle />
        </div>
      </header>

      {loading && !status ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      ) : status ? (
        <div className="space-y-6">
          {/* Discord Bot Status */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">🤖 Discord 봇</h2>
              <StatusBadge ok={status.discord.connected} />
            </div>

            {status.discord.connected ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">봇 이름</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{status.discord.botName}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">서버</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{status.discord.guildName}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">채널</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">#{status.discord.channelName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">{status.discord.error}</p>
                {status.discord.botName && (
                  <p className="mt-1 text-xs text-gray-500">봇: {status.discord.botName}</p>
                )}
              </div>
            )}
          </div>

          {/* Pusher Status */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">📡 Pusher (WebSocket)</h2>
              <StatusBadge ok={status.pusher.connected} />
            </div>
            {!status.pusher.connected && status.pusher.error && (
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">{status.pusher.error}</p>
              </div>
            )}
            {status.pusher.connected && (
              <p className="text-sm text-green-600 dark:text-green-400">Pusher 환경변수가 올바르게 설정되어 있습니다.</p>
            )}
          </div>

          {/* Environment Variables */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">🔑 환경변수 상태</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <EnvBadge label="DISCORD_BOT_TOKEN" set={status.env.discordBotToken} />
              <EnvBadge label="DISCORD_GUILD_ID" set={status.env.discordGuildId} />
              <EnvBadge label="DISCORD_CHANNEL_ID" set={status.env.discordChannelId} />
              <EnvBadge label="PUSHER_APP_ID" set={status.env.pusherAppId} />
              <EnvBadge label="PUSHER_KEY" set={status.env.pusherKey} />
              <EnvBadge label="PUSHER_SECRET" set={status.env.pusherSecret} />
              <EnvBadge label="WEBHOOK_SECRET" set={status.env.webhookSecret} />
            </div>
          </div>

          {/* Refresh */}
          <div className="text-center">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {loading ? '확인 중...' : '🔄 상태 새로고침'}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
