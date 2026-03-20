import { ChatInputCommandInteraction, TextChannel } from 'discord.js'
import { sendWebhook } from '../utils/webhook'
import { VibeEventType } from '../../types/vibe'

const SUBCOMMAND_MAP: Record<string, { type: VibeEventType; prefix: string; emoji: string; label: string }> = {
  start: { type: 'SESSION_START', prefix: '[VIBE:START]', emoji: '🚀', label: '세션 시작' },
  log: { type: 'LOG', prefix: '[VIBE:LOG]', emoji: '📝', label: '로그' },
  milestone: { type: 'MILESTONE', prefix: '[VIBE:MILESTONE]', emoji: '🏆', label: '마일스톤' },
  task: { type: 'TASK_ADD', prefix: '[VIBE:TASK_ADD]', emoji: '📋', label: '태스크 추가' },
  done: { type: 'TASK_DONE', prefix: '[VIBE:TASK_DONE]', emoji: '✅', label: '태스크 완료' },
  end: { type: 'SESSION_END', prefix: '[VIBE:END]', emoji: '🏁', label: '세션 종료' },
}

// In-memory task tracker
const activeTasks = new Map<string, Set<string>>()

// Channel-Team mapping cache
let channelTeamMap: Record<string, string> = {}

export async function loadChannelTeamMap(): Promise<void> {
  // Load from env (JSON format) or API
  const envMap = process.env.CHANNEL_TEAM_MAP
  if (envMap) {
    try {
      channelTeamMap = JSON.parse(envMap)
      console.log('📋 채널-조 매핑 로드:', Object.keys(channelTeamMap).length, '개')
      return
    } catch {
      console.error('CHANNEL_TEAM_MAP 파싱 실패')
    }
  }

  // Fallback: fetch from API
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  try {
    const res = await fetch(`${appUrl}/api/admin/channel-map`)
    if (res.ok) {
      const data = await res.json()
      channelTeamMap = data.map || {}
      console.log('📋 채널-조 매핑 API에서 로드:', Object.keys(channelTeamMap).length, '개')
    }
  } catch {
    console.log('⚠️ 채널-조 매핑 로드 실패, 빈 맵으로 시작')
  }
}

export function updateChannelTeamMap(map: Record<string, string>): void {
  channelTeamMap = map
}

function getTeamFromChannel(channelId: string): string | undefined {
  return channelTeamMap[channelId]
}

export async function handleDaoboardCommand(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand()
  const content = interaction.options.getString('content') ?? ''

  const config = SUBCOMMAND_MAP[subcommand]
  if (!config) {
    await interaction.reply({ content: '❌ 알 수 없는 명령어입니다.', flags: 64 })
    return
  }

  // Auto-detect team from channel
  const team = getTeamFromChannel(interaction.channelId)
  const taskKey = team || 'global'

  // task: 태스크 등록
  if (subcommand === 'task') {
    if (!content) {
      await interaction.reply({ content: '❌ 태스크 이름을 입력해주세요.', flags: 64 })
      return
    }
    if (!activeTasks.has(taskKey)) activeTasks.set(taskKey, new Set())
    activeTasks.get(taskKey)!.add(content)
  }

  // done: 매칭 검증
  if (subcommand === 'done') {
    const tasks = activeTasks.get(taskKey)
    if (!content) {
      // content 없으면 등록된 태스크 목록 보여주기
      if (tasks && tasks.size > 0) {
        const taskList = [...tasks].map((t, i) => `${i + 1}. \`${t}\``).join('\n')
        await interaction.reply({
          content: `📋 **현재 등록된 태스크:**\n${taskList}\n\n완료할 태스크 이름을 입력해주세요:\n\`/daoboard done [태스크명]\``,
          flags: 64,
        })
      } else {
        await interaction.reply({ content: '📋 등록된 태스크가 없습니다.', flags: 64 })
      }
      return
    }
    if (tasks && tasks.size > 0 && !tasks.has(content)) {
      const similar = [...tasks].filter(
        (t) => t.toLowerCase().includes(content.toLowerCase()) || content.toLowerCase().includes(t.toLowerCase())
      )
      const taskList = [...tasks].map((t) => `  • \`${t}\``).join('\n')
      const suggestion = similar.length > 0
        ? `\n\n💡 혹시 이 태스크인가요?\n${similar.map((t) => `  → **${t}**`).join('\n')}`
        : ''

      await interaction.reply({
        content: `⚠️ **"${content}"** 와 일치하는 태스크가 없습니다.\n\n📋 현재 태스크:\n${taskList}${suggestion}`,
        flags: 64,
      })
      return
    }
    if (tasks) tasks.delete(content)
  }

  // start: 태스크 초기화
  if (subcommand === 'start') {
    activeTasks.set(taskKey, new Set())
  }

  // end: content 자동 처리
  if (subcommand === 'end') {
    // content 없으면 "세션 종료"로 자동 설정
  } else if (!content) {
    await interaction.reply({ content: '❌ 내용을 입력해주세요.', flags: 64 })
    return
  }

  const vibeLogChannelId = process.env.DISCORD_CHANNEL_ID
  const teamTag = team ? `[TEAM:${team}] ` : ''
  const effectiveContent = content || (subcommand === 'end' ? '세션 종료' : '')
  const formattedMessage = `${config.prefix} ${teamTag}${effectiveContent}`

  // Post to #vibe-log channel
  if (vibeLogChannelId) {
    try {
      const channel = await interaction.client.channels.fetch(vibeLogChannelId)
      if (channel instanceof TextChannel) {
        await channel.send(formattedMessage)
      }
    } catch (error) {
      console.error('채널 메시지 전송 실패:', error)
    }
  }

  // Send webhook
  const channelName = interaction.channel && 'name' in interaction.channel ? (interaction.channel.name ?? undefined) : undefined
  const event = {
    id: interaction.id,
    type: config.type,
    content: effectiveContent,
    timestamp: new Date().toISOString(),
    author: interaction.user.username,
    team: team || undefined,
    channelId: interaction.channelId,
    channelName,
  }

  try {
    await sendWebhook(event)
  } catch (error) {
    console.error('Webhook 전송 실패:', error)
  }

  // Reply
  const teamLabel = team ? ` [${team}조]` : ''
  const noTeamWarning = !team ? '\n⚠️ 이 채널에 조가 연결되지 않았습니다. Admin에서 설정해주세요.' : ''

  await interaction.reply({
    content: `${config.emoji}${teamLabel} **${config.label}** ${effectiveContent}${noTeamWarning}`,
  })
}
