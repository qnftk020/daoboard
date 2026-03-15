import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: DB 통계 조회
export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get('admin_token')
  if (!adminCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 전체 이벤트 수
  const { count: totalEvents } = await supabase
    .from('vibe_events')
    .select('*', { count: 'exact', head: true })

  // 타입별 카운트
  const { data: allEvents } = await supabase
    .from('vibe_events')
    .select('type, team, timestamp')
    .order('timestamp', { ascending: true })

  const typeCounts: Record<string, number> = {}
  const teamCounts: Record<string, number> = {}
  let oldestEvent: string | null = null
  let newestEvent: string | null = null

  if (allEvents && allEvents.length > 0) {
    oldestEvent = allEvents[0].timestamp
    newestEvent = allEvents[allEvents.length - 1].timestamp

    for (const event of allEvents) {
      typeCounts[event.type] = (typeCounts[event.type] || 0) + 1
      if (event.team) {
        teamCounts[event.team] = (teamCounts[event.team] || 0) + 1
      } else {
        teamCounts['없음'] = (teamCounts['없음'] || 0) + 1
      }
    }
  }

  return NextResponse.json({
    totalEvents: totalEvents || 0,
    typeCounts,
    teamCounts,
    oldestEvent,
    newestEvent,
  })
}

// DELETE: 데이터 초기화
export async function DELETE(req: NextRequest) {
  const adminCookie = req.cookies.get('admin_token')
  if (!adminCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { scope, team } = body // scope: 'all' | 'team', team: string

  if (scope === 'team' && team) {
    // 특정 팀 데이터만 삭제
    if (team === 'none') {
      // 팀 미지정 이벤트 삭제
      const { error, count } = await supabase
        .from('vibe_events')
        .delete({ count: 'exact' })
        .is('team', null)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ message: `팀 미지정 이벤트 ${count}개 삭제 완료`, deleted: count })
    } else {
      const { error, count } = await supabase
        .from('vibe_events')
        .delete({ count: 'exact' })
        .eq('team', team)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ message: `${team}팀 이벤트 ${count}개 삭제 완료`, deleted: count })
    }
  } else if (scope === 'all') {
    // 전체 삭제
    const { error, count } = await supabase
      .from('vibe_events')
      .delete({ count: 'exact' })
      .gte('id', '') // delete all rows

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: `전체 이벤트 ${count}개 삭제 완료`, deleted: count })
  }

  return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
}
