import { ChatInputCommandInteraction, TextChannel } from 'discord.js'
import { sendWebhook } from '../utils/webhook'
import { VibeEventType } from '../../types/vibe'

const COMMAND_MAP: Record<string, { type: VibeEventType; prefix: string; emoji: string }> = {
  start: { type: 'SESSION_START', prefix: '[VIBE:START]', emoji: '🚀' },
  log: { type: 'LOG', prefix: '[VIBE:LOG]', emoji: '📝' },
  milestone: { type: 'MILESTONE', prefix: '[VIBE:MILESTONE]', emoji: '🏆' },
  task_add: { type: 'TASK_ADD', prefix: '[VIBE:TASK_ADD]', emoji: '📋' },
  task_done: { type: 'TASK_DONE', prefix: '[VIBE:TASK_DONE]', emoji: '✅' },
  end: { type: 'SESSION_END', prefix: '[VIBE:END]', emoji: '🏁' },
}

// In-memory task tracker (채널 메시지에서 복원도 가능)
const activeTasks = new Map<string, Set<string>>() // team|'global' -> Set<taskName>

function getTaskKey(team?: string | null): string {
  return team || 'global'
}

export async function handleVibeCommand(interaction: ChatInputCommandInteraction) {
  const command = interaction.options.getString('command', true)
  const content = interaction.options.getString('content', true)
  const team = interaction.options.getString('team')

  const config = COMMAND_MAP[command]
  if (!config) {
    await interaction.reply({ content: '❌ 알 수 없는 명령어입니다.', flags: 64 })
    return
  }

  const taskKey = getTaskKey(team)

  // task_add: 태스크 등록
  if (command === 'task_add') {
    if (!activeTasks.has(taskKey)) activeTasks.set(taskKey, new Set())
    activeTasks.get(taskKey)!.add(content)
  }

  // task_done: 매칭 검증
  if (command === 'task_done') {
    const tasks = activeTasks.get(taskKey)
    if (tasks && tasks.size > 0 && !tasks.has(content)) {
      // 유사한 태스크 찾기
      const similar = [...tasks].filter(
        (t) => t.includes(content) || content.includes(t)
      )
      const taskList = [...tasks].map((t) => `\`${t}\``).join(', ')
      const suggestion = similar.length > 0
        ? `\n💡 혹시 이 태스크를 찾으시나요? ${similar.map((t) => `**${t}**`).join(', ')}`
        : ''

      await interaction.reply({
        content: `⚠️ **"${content}"** 태스크를 찾을 수 없습니다.\n📋 현재 등록된 태스크: ${taskList}${suggestion}`,
        flags: 64, // ephemeral (본인만 보임)
      })
      return
    }
    // 매칭 성공 → 태스크 목록에서 제거
    if (tasks) tasks.delete(content)
  }

  // 세션 시작 시 태스크 초기화
  if (command === 'start') {
    activeTasks.set(taskKey, new Set())
  }

  const vibeLogChannelId = process.env.DISCORD_CHANNEL_ID
  const teamTag = team ? `[TEAM:${team}] ` : ''
  const formattedMessage = `${config.prefix} ${teamTag}${content}`

  // Post structured message to #vibe-log channel
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

  // Send to Vercel webhook for real-time Pusher update
  const channelName = interaction.channel && 'name' in interaction.channel ? interaction.channel.name : undefined
  const event = {
    id: interaction.id,
    type: config.type,
    content,
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

  // Reply to user in Discord
  const teamLabel = team ? ` [${team}팀]` : ''
  await interaction.reply({
    content: `${config.emoji}${teamLabel} **${config.prefix}** ${content}`,
  })
}
