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
      let content = trimmed.slice(prefix.length).trim()
      let team: string | undefined

      // [TEAM:N] 패턴 추출
      const teamMatch = content.match(/^\[TEAM:(\d)\]\s*/)
      if (teamMatch) {
        team = teamMatch[1]
        content = content.slice(teamMatch[0].length)
      }

      return {
        id: messageId,
        type,
        content,
        timestamp,
        author,
        team,
      }
    }
  }

  return null
}
