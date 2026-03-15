import { NextRequest, NextResponse } from 'next/server'
import { getPusherServer } from '@/lib/pusher'
import { supabase } from '@/lib/supabase'
import { VibeEvent } from '@/types/vibe'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')

  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: VibeEvent = await req.json()

  // Save to Supabase
  const { error } = await supabase.from('vibe_events').insert({
    id: body.id,
    type: body.type,
    content: body.content,
    timestamp: body.timestamp,
    author: body.author || null,
    team: body.team || null,
  })

  if (error) {
    console.error('Supabase insert error:', error)
    // Still broadcast even if DB save fails
  }

  // Broadcast via Pusher
  const pusher = getPusherServer()
  await pusher.trigger('daoboard', 'vibe-update', body)

  return NextResponse.json({ ok: true })
}
