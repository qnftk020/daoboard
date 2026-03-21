import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: DB 통계 조회 + 날짜별 이벤트 수
export async function GET(req: NextRequest) {
  const { verifySignedToken } = await import('../login/route')
  const token = req.cookies.get('admin-token')?.value
  if (!token || !verifySignedToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 전체 이벤트 수
  const { count: totalEvents } = await supabase
    .from('vibe_events')
    .select('*', { count: 'exact', head: true })

  // 타입별 카운트
  const { data: allEvents } = await supabase
    .from('vibe_events')
    .select('type, team, timestamp, channel_name')
    .order('timestamp', { ascending: true })

  const typeCounts: Record<string, number> = {}
  const teamCounts: Record<string, number> = {}
  const channelCounts: Record<string, number> = {}
  const dateCounts: Record<string, number> = {}
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
      if (event.channel_name) {
        channelCounts[event.channel_name] = (channelCounts[event.channel_name] || 0) + 1
      }
      // 날짜별 카운트
      const dateKey = event.timestamp.slice(0, 10) // YYYY-MM-DD
      dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1
    }
  }

  return NextResponse.json({
    totalEvents: totalEvents || 0,
    typeCounts,
    teamCounts,
    channelCounts,
    dateCounts,
    oldestEvent,
    newestEvent,
  })
}

// DELETE: 데이터 삭제 (전체/팀별/날짜 기준)
export async function DELETE(req: NextRequest) {
  const { verifySignedToken } = await import('../login/route')
  const token = req.cookies.get('admin-token')?.value
  if (!token || !verifySignedToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { scope, team, beforeDate, afterDate } = body
  // scope: 'all' | 'team' | 'date'

  if (scope === 'date') {
    // 날짜 기준 삭제
    let query = supabase.from('vibe_events').delete({ count: 'exact' })

    if (beforeDate) {
      query = query.lt('timestamp', `${beforeDate}T00:00:00.000Z`)
    }
    if (afterDate) {
      query = query.gte('timestamp', `${afterDate}T00:00:00.000Z`)
    }
    if (!beforeDate && !afterDate) {
      return NextResponse.json({ error: 'beforeDate 또는 afterDate가 필요합니다.' }, { status: 400 })
    }

    const { error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rangeText = beforeDate && afterDate
      ? `${afterDate} ~ ${beforeDate} 이전`
      : beforeDate
        ? `${beforeDate} 이전`
        : `${afterDate} 이후`

    return NextResponse.json({ message: `${rangeText} 이벤트 ${count}개 삭제 완료`, deleted: count })
  }

  if (scope === 'team' && team) {
    if (team === 'none') {
      const { error, count } = await supabase
        .from('vibe_events')
        .delete({ count: 'exact' })
        .is('team', null)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ message: `조 미지정 이벤트 ${count}개 삭제 완료`, deleted: count })
    } else {
      const { error, count } = await supabase
        .from('vibe_events')
        .delete({ count: 'exact' })
        .eq('team', team)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ message: `${team}조 이벤트 ${count}개 삭제 완료`, deleted: count })
    }
  } else if (scope === 'all') {
    const { error, count } = await supabase
      .from('vibe_events')
      .delete({ count: 'exact' })
      .gte('id', '')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: `전체 이벤트 ${count}개 삭제 완료`, deleted: count })
  }

  return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
}
