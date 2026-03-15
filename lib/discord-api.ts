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

export async function fetchChannelHistory(limit = 500): Promise<VibeEvent[]> {
  const channelId = process.env.DISCORD_CHANNEL_ID
  const botToken = process.env.DISCORD_BOT_TOKEN

  if (!channelId || !botToken) {
    return []
  }

  const allMessages: DiscordMessage[] = []
  let before: string | undefined
  const perPage = 100 // Discord API max per request
  const maxPages = Math.ceil(limit / perPage)

  // Paginate through Discord messages
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ limit: String(perPage) })
    if (before) params.set('before', before)

    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?${params}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        next: { revalidate: 0 },
      }
    )

    if (!res.ok) {
      console.error('Discord API error:', res.status)
      break
    }

    const messages: DiscordMessage[] = await res.json()
    if (messages.length === 0) break

    allMessages.push(...messages)
    before = messages[messages.length - 1].id

    if (messages.length < perPage) break // No more messages
  }

  // Parse and return in chronological order (oldest first)
  const events: VibeEvent[] = []
  for (const msg of allMessages.reverse()) {
    const event = parseVibeMessage(msg.content, msg.id, msg.timestamp, msg.author.username)
    if (event) events.push(event)
  }

  return events
}
