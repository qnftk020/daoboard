import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchChannelHistory } from '@/lib/discord-api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Check admin cookie
  const adminCookie = req.cookies.get('admin_token')
  if (!adminCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all events from Discord
  const events = await fetchChannelHistory(500)

  if (events.length === 0) {
    return NextResponse.json({ message: 'No events to migrate', count: 0 })
  }

  // Upsert into Supabase (ignore duplicates)
  let inserted = 0
  let skipped = 0

  for (const event of events) {
    const { error } = await supabase.from('vibe_events').upsert(
      {
        id: event.id,
        type: event.type,
        content: event.content,
        timestamp: event.timestamp,
        author: event.author || null,
        team: event.team || null,
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('Migration error for event:', event.id, error)
      skipped++
    } else {
      inserted++
    }
  }

  return NextResponse.json({
    message: `Migration complete`,
    total: events.length,
    inserted,
    skipped,
  })
}
