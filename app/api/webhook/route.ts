import { NextRequest, NextResponse } from 'next/server'
import { getPusherServer } from '@/lib/pusher'
import { VibeEvent } from '@/types/vibe'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')

  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: VibeEvent = await req.json()

  const pusher = getPusherServer()
  await pusher.trigger('daoboard', 'vibe-update', body)

  return NextResponse.json({ ok: true })
}
