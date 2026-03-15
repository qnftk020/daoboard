import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function checkDiscordBot(): Promise<{
  connected: boolean
  botName?: string
  guildName?: string
  channelName?: string
  error?: string
}> {
  const botToken = process.env.DISCORD_BOT_TOKEN
  const guildId = process.env.DISCORD_GUILD_ID
  const channelId = process.env.DISCORD_CHANNEL_ID

  if (!botToken) return { connected: false, error: 'DISCORD_BOT_TOKEN 미설정' }
  if (!guildId) return { connected: false, error: 'DISCORD_GUILD_ID 미설정' }
  if (!channelId) return { connected: false, error: 'DISCORD_CHANNEL_ID 미설정' }

  try {
    // Check bot user
    const botRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${botToken}` },
    })
    if (!botRes.ok) return { connected: false, error: `봇 토큰 인증 실패 (${botRes.status})` }
    const botData = await botRes.json()

    // Check guild access
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    })
    if (!guildRes.ok) return { connected: false, error: `서버 접근 실패 (${guildRes.status})`, botName: botData.username }
    const guildData = await guildRes.json()

    // Check channel access
    const channelRes = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    })
    if (!channelRes.ok) return { connected: false, error: `채널 접근 실패 (${channelRes.status})`, botName: botData.username, guildName: guildData.name }
    const channelData = await channelRes.json()

    return {
      connected: true,
      botName: botData.username,
      guildName: guildData.name,
      channelName: channelData.name,
    }
  } catch (error) {
    return { connected: false, error: `연결 오류: ${error instanceof Error ? error.message : String(error)}` }
  }
}

async function checkPusher(): Promise<{ connected: boolean; error?: string }> {
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER

  if (!appId || !key || !secret || !cluster) {
    return { connected: false, error: 'Pusher 환경변수 미설정' }
  }

  return { connected: true }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [discord, pusher] = await Promise.all([checkDiscordBot(), checkPusher()])

  return NextResponse.json({
    discord,
    pusher,
    env: {
      discordBotToken: !!process.env.DISCORD_BOT_TOKEN,
      discordGuildId: !!process.env.DISCORD_GUILD_ID,
      discordChannelId: !!process.env.DISCORD_CHANNEL_ID,
      pusherAppId: !!process.env.PUSHER_APP_ID,
      pusherKey: !!process.env.PUSHER_KEY,
      pusherSecret: !!process.env.PUSHER_SECRET,
      webhookSecret: !!process.env.WEBHOOK_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  })
}
