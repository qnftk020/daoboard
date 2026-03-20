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

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  channels: { id: string; name: string }[]
}

interface DiscordSetupData {
  guilds: DiscordGuild[]
  current: { guildId: string | null; channelId: string | null }
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

interface DbStats {
  totalEvents: number
  typeCounts: Record<string, number>
  teamCounts: Record<string, number>
  channelCounts: Record<string, number>
  oldestEvent: string | null
  newestEvent: string | null
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(false)

  // Discord 채널 목록
  const [discordSetup, setDiscordSetup] = useState<DiscordSetupData | null>(null)
  const [discordLoading, setDiscordLoading] = useState(false)

  // DB 관리 상태
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [dbMessage, setDbMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState<string | null>(null)
  const [migrateLoading, setMigrateLoading] = useState(false)

  // 채널-팀 매핑
  const [channelTeamMap, setChannelTeamMap] = useState<Record<string, string>>({})
  const [channelMapEntries, setChannelMapEntries] = useState<{ channel_id: string; channel_name: string; team_id: string }[]>([])
  const [mapMessage, setMapMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchChannelTeamMap = async () => {
    try {
      const res = await fetch('/api/admin/channel-map')
      if (res.ok) {
        const data = await res.json()
        setChannelTeamMap(data.map || {})
        setChannelMapEntries(data.entries || [])
      }
    } catch {
      // ignore
    }
  }

  const handleMapChannel = async (channelId: string, channelName: string, teamId: string) => {
    setMapMessage(null)
    try {
      const res = await fetch('/api/admin/channel-map', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, channelName, teamId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMapMessage({ type: 'success', text: data.message })
        fetchChannelTeamMap()
      } else {
        setMapMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMapMessage({ type: 'error', text: '매핑 저장 실패' })
    }
  }

  const handleUnmapChannel = async (channelId: string) => {
    setMapMessage(null)
    try {
      const res = await fetch('/api/admin/channel-map', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      })
      if (res.ok) {
        setMapMessage({ type: 'success', text: '매핑 해제 완료' })
        fetchChannelTeamMap()
      }
    } catch {
      setMapMessage({ type: 'error', text: '매핑 해제 실패' })
    }
  }

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
      fetchDiscordGuilds()
      fetchDbStats()
      fetchChannelTeamMap()
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

  const fetchDiscordGuilds = async () => {
    setDiscordLoading(true)
    try {
      const res = await fetch('/api/admin/discord/guilds')
      if (res.ok) {
        const data: DiscordSetupData = await res.json()
        setDiscordSetup(data)
      }
    } catch {
      // ignore
    } finally {
      setDiscordLoading(false)
    }
  }

  const fetchDbStats = async () => {
    setDbLoading(true)
    try {
      const res = await fetch('/api/admin/db')
      if (res.ok) {
        setDbStats(await res.json())
      }
    } catch {
      // ignore
    } finally {
      setDbLoading(false)
    }
  }

  const handleDbReset = async (scope: string, team?: string) => {
    setDbMessage(null)
    try {
      const res = await fetch('/api/admin/db', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, team }),
      })
      const data = await res.json()
      if (res.ok) {
        setDbMessage({ type: 'success', text: data.message })
        fetchDbStats()
      } else {
        setDbMessage({ type: 'error', text: data.error })
      }
    } catch {
      setDbMessage({ type: 'error', text: '요청 실패' })
    }
    setConfirmReset(null)
  }

  const handleMigrate = async () => {
    setMigrateLoading(true)
    setDbMessage(null)
    try {
      const res = await fetch('/api/admin/migrate', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setDbMessage({ type: 'success', text: `${data.message}: ${data.inserted}개 저장, ${data.skipped}개 스킵` })
        fetchDbStats()
      } else {
        setDbMessage({ type: 'error', text: data.error || '마이그레이션 실패' })
      }
    } catch {
      setDbMessage({ type: 'error', text: '마이그레이션 요청 실패' })
    } finally {
      setMigrateLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/admin/status')
      .then((res) => {
        if (res.ok) {
          setLoggedIn(true)
          fetchDiscordGuilds()
          fetchDbStats()
          fetchChannelTeamMap()
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

  // 활성 채널 (DB에서 데이터가 들어온 채널)
  const activeChannelNames = dbStats?.channelCounts ? Object.keys(dbStats.channelCounts) : []

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 transition hover:opacity-80">
          <span className="text-2xl">⚡</span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            DAOboard <span className="text-sm font-normal text-purple-500">Admin</span>
          </h1>
        </a>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {loading && !status ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      ) : status ? (
        <div className="space-y-6">
          {/* Discord 연동 상태 (간소화) */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔗 Discord 연동</h2>
              <StatusBadge ok={status.discord.connected} />
            </div>

            {status.discord.connected ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                  <span className="text-lg">✅</span> 연결 완료
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-white/60 p-3 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">봇 이름</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{status.discord.botName}</p>
                  </div>
                  <div className="rounded-lg bg-white/60 p-3 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">서버</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{status.discord.guildName}</p>
                  </div>
                  <div className="rounded-lg bg-white/60 p-3 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">로그 채널</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">#{status.discord.channelName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">{status.discord.error}</p>
              </div>
            )}
          </div>

          {/* 채널 관리 (봇 현황 + 팀 매핑 통합) */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">📋 채널 관리</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  봇이 연결된 채널에 팀을 매핑하면 <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">/daoboard</code> 사용 시 팀이 자동 인식됩니다
                </p>
              </div>
              <div className="flex items-center gap-2">
                {discordLoading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                )}
                <button
                  onClick={() => { fetchDiscordGuilds(); fetchChannelTeamMap() }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  🔄 새로고침
                </button>
              </div>
            </div>

            {status.discord.connected ? (
              discordSetup && discordSetup.guilds.length > 0 ? (
                discordSetup.guilds.map((guild) => {
                  const TEAM_OPTIONS = [
                    { id: '1', name: '1팀', color: '#8B5CF6' },
                    { id: '2', name: '2팀', color: '#3B82F6' },
                    { id: '3', name: '3팀', color: '#10B981' },
                    { id: '4', name: '4팀', color: '#F59E0B' },
                    { id: '5', name: '5팀', color: '#EF4444' },
                  ]

                  // 매핑된 채널과 미매핑 채널 분리
                  const mappedChannels = guild.channels.filter((ch) => channelTeamMap[ch.id])
                  const unmappedChannels = guild.channels.filter((ch) => !channelTeamMap[ch.id])

                  return (
                    <div key={guild.id}>
                      {/* 서버 정보 */}
                      <div className="mb-4 flex items-center gap-2">
                        {guild.icon ? (
                          <img src={guild.icon} alt="" className="h-6 w-6 rounded-full" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            {guild.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{guild.name}</span>
                        <span className="text-xs text-gray-400">
                          {guild.channels.length}개 채널 · {mappedChannels.length}개 팀 연결
                        </span>
                      </div>

                      {/* 팀이 연결된 채널 */}
                      {mappedChannels.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 text-xs font-medium text-green-600 dark:text-green-400">✅ 팀 연결됨</p>
                          <div className="space-y-1.5">
                            {mappedChannels.map((channel) => {
                              const teamId = channelTeamMap[channel.id]
                              const team = TEAM_OPTIONS.find((t) => t.id === teamId)
                              const hasData = activeChannelNames.includes(channel.name)
                              const isLogChannel = status?.discord.channelName === channel.name
                              return (
                                <div
                                  key={channel.id}
                                  className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-2.5 dark:bg-green-900/20"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-500">#</span>
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">{channel.name}</span>
                                    <span className="text-gray-300 dark:text-gray-600">→</span>
                                    {team && (
                                      <span
                                        className="rounded px-2 py-0.5 text-xs font-bold text-white"
                                        style={{ backgroundColor: team.color }}
                                      >
                                        {team.name}
                                      </span>
                                    )}
                                    {hasData && (
                                      <span className="flex items-center gap-1 text-xs text-green-500">
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                                        </span>
                                        {dbStats?.channelCounts?.[channel.name] || 0}건
                                      </span>
                                    )}
                                    {isLogChannel && (
                                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">로그 채널</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* 팀 변경 */}
                                    <select
                                      value={teamId}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleMapChannel(channel.id, channel.name, e.target.value)
                                        }
                                      }}
                                      className="rounded border border-green-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-green-700 dark:bg-gray-800 dark:text-gray-300"
                                    >
                                      {TEAM_OPTIONS.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleUnmapChannel(channel.id)}
                                      className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                    >
                                      해제
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* 미연결 채널 */}
                      {unmappedChannels.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                            채널 선택 → 팀 연결 ({unmappedChannels.length}개 미연결)
                          </p>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {unmappedChannels.map((channel) => {
                              const isLogChannel = status?.discord.channelName === channel.name
                              const hasData = activeChannelNames.includes(channel.name)
                              return (
                                <div
                                  key={channel.id}
                                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                                    isLogChannel
                                      ? 'bg-purple-50 dark:bg-purple-900/20'
                                      : hasData
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'bg-gray-50 dark:bg-gray-800'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="text-gray-400">#</span>
                                    <span className="truncate">{channel.name}</span>
                                    {isLogChannel && (
                                      <span className="text-[10px] text-purple-500">로그</span>
                                    )}
                                    {hasData && !isLogChannel && (
                                      <span className="flex items-center gap-1 text-[10px] text-blue-500">
                                        <span className="h-1 w-1 rounded-full bg-blue-500" />
                                        데이터 있음
                                      </span>
                                    )}
                                  </span>
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleMapChannel(channel.id, channel.name, e.target.value)
                                        e.target.value = ''
                                      }
                                    }}
                                    className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                  >
                                    <option value="">팀 선택</option>
                                    {TEAM_OPTIONS.map((t) => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : !discordLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">채널 정보를 불러올 수 없습니다.</p>
              ) : null
            ) : (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  ⚠️ Discord 봇이 연결되지 않았습니다
                </p>
                <p className="mt-1 text-xs text-red-500/70 dark:text-red-400/70">
                  봇이 연결되어야 채널-팀 매핑을 설정할 수 있습니다. 위 Discord 연동 상태를 확인해주세요.
                </p>
              </div>
            )}

            {/* 결과 메시지 */}
            {mapMessage && (
              <div
                className={`mt-4 rounded-lg p-3 ${
                  mapMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                <p className="text-sm">{mapMessage.text}</p>
              </div>
            )}
          </div>

          {/* Pusher + 환경변수 (한 카드로 합침) */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">⚙️ 시스템 상태</h2>
              <StatusBadge ok={status.pusher.connected} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${status.pusher.connected ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                <span>📡</span> Pusher {status.pusher.connected ? '연결됨' : '미연결'}
              </div>
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${status.env.supabaseUrl ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                <span>🗄️</span> Supabase {status.env.supabaseUrl ? '연결됨' : '미설정'}
              </div>
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${status.env.webhookSecret ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                <span>🔑</span> Webhook {status.env.webhookSecret ? '설정됨' : '미설정'}
              </div>
            </div>
          </div>

          {/* DB 관리 */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">🗄️ 데이터베이스 관리</h2>
              <button
                onClick={fetchDbStats}
                disabled={dbLoading}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {dbLoading ? '로딩...' : '🔄 새로고침'}
              </button>
            </div>

            {dbStats ? (
              <div className="space-y-4">
                {/* 통계 카드 */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                    <p className="text-xs text-purple-600 dark:text-purple-400">전체 이벤트</p>
                    <p className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-300">{dbStats.totalEvents}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400">가장 오래된 이벤트</p>
                    <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {dbStats.oldestEvent ? new Date(dbStats.oldestEvent).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <p className="text-xs text-green-600 dark:text-green-400">최신 이벤트</p>
                    <p className="mt-1 text-sm font-semibold text-green-700 dark:text-green-300">
                      {dbStats.newestEvent ? new Date(dbStats.newestEvent).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                </div>

                {/* 타입별 + 팀별 통계 */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">이벤트 타입별</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(dbStats.typeCounts).map(([type, count]) => (
                        <span key={type} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">팀별 이벤트</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(dbStats.teamCounts).map(([team, count]) => (
                        <span key={team} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {team === '없음' ? '팀 미지정' : `${team}팀`}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Discord → Supabase 마이그레이션 */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        📥 Discord → Supabase 마이그레이션
                      </p>
                      <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70">
                        Discord 채널의 기존 메시지를 DB로 가져옵니다
                      </p>
                    </div>
                    <button
                      onClick={handleMigrate}
                      disabled={migrateLoading}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {migrateLoading ? '처리 중...' : '마이그레이션'}
                    </button>
                  </div>
                </div>

                {/* 데이터 초기화 */}
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="mb-3 text-sm font-medium text-red-700 dark:text-red-400">⚠️ 데이터 초기화</p>

                  <div className="space-y-2">
                    {/* 팀별 삭제 */}
                    {Object.keys(dbStats.teamCounts).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(dbStats.teamCounts).map(([team, count]) => {
                          const teamKey = team === '없음' ? 'none' : team
                          const isConfirming = confirmReset === `team-${teamKey}`
                          return (
                            <button
                              key={team}
                              onClick={() => {
                                if (isConfirming) {
                                  handleDbReset('team', teamKey)
                                } else {
                                  setConfirmReset(`team-${teamKey}`)
                                }
                              }}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                isConfirming
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : 'border border-red-300 text-red-600 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30'
                              }`}
                            >
                              {isConfirming
                                ? `정말 삭제? (${count}개)`
                                : `${team === '없음' ? '팀 미지정' : `${team}팀`} 삭제 (${count})`}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* 전체 삭제 */}
                    <div className="border-t border-red-200 pt-2 dark:border-red-800">
                      {confirmReset === 'all' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            ⚠️ 전체 {dbStats.totalEvents}개 이벤트가 삭제됩니다. 정말요?
                          </span>
                          <button
                            onClick={() => handleDbReset('all')}
                            className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
                          >
                            삭제 확인
                          </button>
                          <button
                            onClick={() => setConfirmReset(null)}
                            className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmReset('all')}
                          className="rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          🗑️ 전체 데이터 초기화 ({dbStats.totalEvents}개)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* DB 결과 메시지 */}
                {dbMessage && (
                  <div
                    className={`rounded-lg p-3 ${
                      dbMessage.type === 'success'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    <p className="text-sm">{dbMessage.text}</p>
                  </div>
                )}
              </div>
            ) : dbLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-purple-500 border-t-transparent" />
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">DB 조회 중...</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">DB 정보를 불러올 수 없습니다.</p>
            )}
          </div>

          {/* Refresh */}
          <div className="text-center">
            <button
              onClick={() => { fetchStatus(); fetchDiscordGuilds(); fetchDbStats() }}
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
