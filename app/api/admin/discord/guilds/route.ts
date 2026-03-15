import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
}

interface DiscordChannel {
  id: string
  name: string
  type: number
  position: number
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botToken = process.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'DISCORD_BOT_TOKEN이 설정되지 않았습니다.' }, { status: 500 })
  }

  try {
    // 1. 봇이 참여한 서버 목록 가져오기
    const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${botToken}` },
    })
    if (!guildsRes.ok) {
      return NextResponse.json({ error: `Discord API 오류 (${guildsRes.status})` }, { status: 500 })
    }
    const guilds: DiscordGuild[] = await guildsRes.json()

    // 2. 각 서버의 텍스트 채널 목록 가져오기
    const guildsWithChannels = await Promise.all(
      guilds.map(async (guild) => {
        try {
          const channelsRes = await fetch(
            `https://discord.com/api/v10/guilds/${guild.id}/channels`,
            { headers: { Authorization: `Bot ${botToken}` } }
          )
          if (!channelsRes.ok) return { ...guild, channels: [] }

          const allChannels: DiscordChannel[] = await channelsRes.json()
          // type 0 = 텍스트 채널만 필터
          const textChannels = allChannels
            .filter((ch) => ch.type === 0)
            .sort((a, b) => a.position - b.position)
            .map((ch) => ({ id: ch.id, name: ch.name }))

          return {
            id: guild.id,
            name: guild.name,
            icon: guild.icon
              ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`
              : null,
            channels: textChannels,
          }
        } catch {
          return { ...guild, channels: [] }
        }
      })
    )

    // 현재 설정된 값도 함께 반환
    return NextResponse.json({
      guilds: guildsWithChannels,
      current: {
        guildId: process.env.DISCORD_GUILD_ID || null,
        channelId: process.env.DISCORD_CHANNEL_ID || null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: `연결 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
