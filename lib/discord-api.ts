import { VibeEvent } from '@/types/vibe'
import { parseVibeMessage } from './parse-message'

interface DiscordMessage {
  id: string
  content: string
  timestamp: string
  author: {
    username: string
  }
}

export async function fetchChannelHistory(limit = 100): Promise<VibeEvent[]> {
  const channelId = process.env.DISCORD_CHANNEL_ID
  const botToken = process.env.DISCORD_BOT_TOKEN

  if (!channelId || !botToken) {
    return []
  }

  const res = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) {
    console.error('Discord API error:', res.status)
    return []
  }

  const messages: DiscordMessage[] = await res.json()

  const events: VibeEvent[] = []
  for (const msg of messages.reverse()) {
    const event = parseVibeMessage(msg.content, msg.id, msg.timestamp, msg.author.username)
    if (event) events.push(event)
  }

  return events
}
