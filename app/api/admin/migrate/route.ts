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

  // Fetch all events from Discord
  const events = await fetchChannelHistory(500)

  if (events.length === 0) {
    return NextResponse.json({ message: 'No events to migrate', count: 0 })
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
  })
}
