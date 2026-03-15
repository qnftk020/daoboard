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

export async function handleVibeCommand(interaction: ChatInputCommandInteraction) {
  const command = interaction.options.getString('command', true)
  const content = interaction.options.getString('content', true)

  const config = COMMAND_MAP[command]
  if (!config) {
    await interaction.reply({ content: '❌ 알 수 없는 명령어입니다.', flags: 64 })
    return
  }

  const vibeLogChannelId = process.env.DISCORD_CHANNEL_ID
  const formattedMessage = `${config.prefix} ${content}`

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
  const event = {
    id: interaction.id,
    type: config.type,
    content,
    timestamp: new Date().toISOString(),
    author: interaction.user.username,
  }

  try {
    await sendWebhook(event)
  } catch (error) {
    console.error('Webhook 전송 실패:', error)
  }

  // Reply to user in Discord
  await interaction.reply({
    content: `${config.emoji} **${config.prefix}** ${content}`,
  })
}
