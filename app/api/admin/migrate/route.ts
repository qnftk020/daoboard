import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchChannelHistory } from '@/lib/discord-api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { verifySignedToken } = await import('../login/route')
  const token = req.cookies.get('admin-token')?.value
  if (!token || !verifySignedToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { afterDate } = body // YYYY-MM-DD 형식

  // Fetch all events from Discord
  const allEvents = await fetchChannelHistory(500)

  // 날짜 필터 적용
  const events = afterDate
    ? allEvents.filter((e) => e.timestamp >= `${afterDate}T00:00:00.000Z`)
    : allEvents

  if (events.length === 0) {
    return NextResponse.json({
      message: afterDate ? `${afterDate} 이후 이벤트가 없습니다` : 'No events to migrate',
      count: 0,
      total: 0,
      filtered: allEvents.length - events.length,
    })
  }

  // Batch upsert into Supabase
  const rows = events.map((event) => ({
    id: event.id,
    type: event.type,
    content: event.content,
    timestamp: event.timestamp,
    author: event.author || null,
    team: event.team || null,
  }))

  const BATCH_SIZE = 100
  let inserted = 0
  let skipped = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error, count } = await supabase
      .from('vibe_events')
      .upsert(batch, { onConflict: 'id', count: 'exact' })

    if (error) {
      console.error('Migration batch error:', error)
      skipped += batch.length
    } else {
      inserted += count ?? batch.length
    }
  }

  return NextResponse.json({
    message: `Migration complete`,
    total: events.length,
    inserted,
    skipped,
    filtered: allEvents.length - events.length,
    afterDate: afterDate || null,
  })
}
