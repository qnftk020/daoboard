import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchChannelHistory } from '@/lib/discord-api'
import { VibeEvent } from '@/types/vibe'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Try Supabase first
  const { data, error } = await supabase
    .from('vibe_events')
    .select('*')
    .order('timestamp', { ascending: true })
    .limit(1000)

  if (!error && data && data.length > 0) {
    const events: VibeEvent[] = data.map((row) => ({
      id: row.id,
      type: row.type,
      content: row.content,
      timestamp: row.timestamp,
      author: row.author || undefined,
      team: row.team || undefined,
    }))
    return NextResponse.json(events)
  }

  // Fallback to Discord API if Supabase is empty or errors
  console.log('Supabase fallback: using Discord API', error?.message)
  const events = await fetchChannelHistory(500)
  return NextResponse.json(events)
}
