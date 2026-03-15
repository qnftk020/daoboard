import { VibeEvent, VIBE_PREFIXES } from '@/types/vibe'

export function parseVibeMessage(
  raw: string,
  messageId: string,
  timestamp: string,
  author?: string
): VibeEvent | null {
  const trimmed = raw.trim()

  for (const [prefix, type] of Object.entries(VIBE_PREFIXES)) {
    if (trimmed.startsWith(prefix)) {
      const content = trimmed.slice(prefix.length).trim()
      return {
        id: messageId,
        type,
        content,
        timestamp,
        author,
      }
    }
  }

  return null
}
