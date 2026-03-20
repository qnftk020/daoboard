import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { VibeEvent } from '@/types/vibe'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('vibe_events')
    .select('*')
    .order('timestamp', { ascending: true })
    .limit(1000)

  if (error) {
    console.error('Supabase query error:', error.message)
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }

  const events: VibeEvent[] = (data || []).map((row) => ({
    id: row.id,
    type: row.type,
    content: row.content,
    timestamp: row.timestamp,
    author: row.author || undefined,
    team: row.team || undefined,
  }))

  return NextResponse.json(events, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
