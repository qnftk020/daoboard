import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { verifySignedToken } = await import('../../login/route')
  const token = req.cookies.get('admin-token')?.value
  if (!token || !verifySignedToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { guildId, channelId, guildName, channelName } = await req.json()

  if (!guildId || !channelId) {
    return NextResponse.json({ error: '서버와 채널을 선택해주세요.' }, { status: 400 })
  }

  const botToken = process.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'DISCORD_BOT_TOKEN이 설정되지 않았습니다.' }, { status: 500 })
  }

  // Discord API로 채널 접근 가능한지 확인
  try {
    const channelRes = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    })
    if (!channelRes.ok) {
      return NextResponse.json({ error: '봇이 해당 채널에 접근할 수 없습니다.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Discord API 연결 실패' }, { status: 500 })
  }

  // 환경변수 업데이트는 Vercel CLI로 처리해야 하므로,
  // 선택된 값을 반환하여 클라이언트에서 확인할 수 있도록 함
  // 실제 환경변수 업데이트는 /api/admin/discord/save-env에서 처리

  // 런타임에 환경변수를 업데이트 (현재 프로세스에만 적용)
  process.env.DISCORD_GUILD_ID = guildId
  process.env.DISCORD_CHANNEL_ID = channelId

  return NextResponse.json({
    ok: true,
    message: `${guildName} 서버의 #${channelName} 채널이 연결되었습니다.`,
    guildId,
    channelId,
    note: '영구 적용을 위해 Vercel 환경변수 업데이트가 필요합니다.',
  })
}
