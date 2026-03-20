import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: 채널-팀 매핑 조회 (봇에서도 호출, 인증 불필요)
export async function GET() {
  const { data, error } = await supabase
    .from('channel_team_map')
    .select('*')

  if (error) {
    // 테이블이 없을 수도 있음 — 빈 맵 반환
    return NextResponse.json({ map: {} })
  }

  const map: Record<string, string> = {}
  for (const row of data || []) {
    map[row.channel_id] = row.team_id
  }

  return NextResponse.json({ map, entries: data })
}

// PUT: 채널-팀 매핑 저장 (Admin 전용)
export async function PUT(req: NextRequest) {
  const { verifySignedToken } = await import('../login/route')
  const token = req.cookies.get('admin-token')?.value
  if (!token || !verifySignedToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { channelId, channelName, teamId } = await req.json()

  if (!channelId || !teamId) {
    return NextResponse.json({ error: '채널과 팀을 선택해주세요.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('channel_team_map')
    .upsert(
      { channel_id: channelId, channel_name: channelName || null, team_id: teamId },
      { onConflict: 'channel_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: `#${channelName || channelId} → ${teamId}팀 연결 완료` })
}

// DELETE: 매핑 삭제
export async function DELETE(req: NextRequest) {
  const { verifySignedToken } = await import('../login/route')
  const token = req.cookies.get('admin-token')?.value
  if (!token || !verifySignedToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { channelId } = await req.json()

  if (!channelId) {
    return NextResponse.json({ error: '채널 ID가 필요합니다.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('channel_team_map')
    .delete()
    .eq('channel_id', channelId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: '매핑 삭제 완료' })
}
