import { ChatInputCommandInteraction, AutocompleteInteraction, TextChannel } from 'discord.js'
import { sendWebhook } from '../utils/webhook'
import { getOpenTasks, getActiveSession } from '../utils/supabase'
import { VibeEventType } from '../../types/vibe'

const SUBCOMMAND_MAP: Record<string, { type: VibeEventType; prefix: string; emoji: string; label: string }> = {
  start: { type: 'SESSION_START', prefix: '[VIBE:START]', emoji: '🚀', label: '세션 시작' },
  log: { type: 'LOG', prefix: '[VIBE:LOG]', emoji: '📝', label: '로그' },
  milestone: { type: 'MILESTONE', prefix: '[VIBE:MILESTONE]', emoji: '🏆', label: '마일스톤' },
  task: { type: 'TASK_ADD', prefix: '[VIBE:TASK_ADD]', emoji: '📋', label: '태스크 추가' },
  done: { type: 'TASK_DONE', prefix: '[VIBE:TASK_DONE]', emoji: '✅', label: '태스크 완료' },
  end: { type: 'SESSION_END', prefix: '[VIBE:END]', emoji: '🏁', label: '세션 종료' },
}

// Channel-Team mapping cache
let channelTeamMap: Record<string, string> = {}

export async function loadChannelTeamMap(): Promise<void> {
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

/** Autocomplete handler for done/end */
export async function handleDaoboardAutocomplete(interaction: AutocompleteInteraction) {
  const subcommand = interaction.options.getSubcommand()
  const focused = interaction.options.getFocused()
  const team = getTeamFromChannel(interaction.channelId)

  try {
    if (subcommand === 'done') {
      const openTasks = await getOpenTasks(team)
      const filtered = openTasks
        .filter((t) => t.toLowerCase().includes(focused.toLowerCase()))
        .slice(0, 25)

      await interaction.respond(
        filtered.map((t) => ({ name: t, value: t }))
      )
    } else if (subcommand === 'end') {
      const activeSession = await getActiveSession(team)
      if (activeSession) {
        await interaction.respond([
          { name: `현재 세션: ${activeSession}`, value: activeSession },
        ])
      } else {
        await interaction.respond([
          { name: '활성 세션 없음', value: '__no_session__' },
        ])
      }
    }
  } catch (error) {
    console.error('Autocomplete 오류:', error)
    await interaction.respond([])
  }
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

  // done: Supabase에서 미완료 태스크 검증
  if (subcommand === 'done') {
    if (!content) {
      const openTasks = await getOpenTasks(team)
      if (openTasks.length > 0) {
        const taskList = openTasks.map((t, i) => `${i + 1}. \`${t}\``).join('\n')
        await interaction.reply({
          content: `📋 **현재 미완료 태스크:**\n${taskList}\n\n완료할 태스크를 선택해주세요:\n\`/daoboard done [태스크명]\``,
          flags: 64,
        })
      } else {
        await interaction.reply({ content: '📋 미완료 태스크가 없습니다.', flags: 64 })
      }
      return
    }

    const openTasks = await getOpenTasks(team)

    if (openTasks.length === 0) {
      await interaction.reply({
        content: '❌ 현재 미완료 태스크가 없습니다. 먼저 `/daoboard task`로 태스크를 추가해주세요.',
        flags: 64,
      })
      return
    }

    if (!openTasks.includes(content)) {
      const similar = openTasks.filter(
        (t) => t.toLowerCase().includes(content.toLowerCase()) || content.toLowerCase().includes(t.toLowerCase())
      )
      const taskList = openTasks.map((t) => `  • \`${t}\``).join('\n')
      const suggestion = similar.length > 0
        ? `\n\n💡 혹시 이 태스크인가요?\n${similar.map((t) => `  → **${t}**`).join('\n')}`
        : ''

      await interaction.reply({
        content: `⚠️ **"${content}"** 와 일치하는 미완료 태스크가 없습니다.\n\n📋 현재 미완료 태스크:\n${taskList}${suggestion}`,
        flags: 64,
      })
      return
    }
  }

  // end: Supabase에서 활성 세션 검증
  if (subcommand === 'end') {
    const activeSession = await getActiveSession(team)

    if (!activeSession) {
      await interaction.reply({
        content: '❌ 현재 활성 세션이 없습니다. 먼저 `/daoboard start`로 세션을 시작해주세요.',
        flags: 64,
      })
      return
    }

    // __no_session__ 은 autocomplete에서 "활성 세션 없음" 선택 시
    if (content === '__no_session__') {
      await interaction.reply({
        content: '❌ 현재 활성 세션이 없습니다.',
        flags: 64,
      })
      return
    }
  } else if (subcommand !== 'end' && !content) {
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
