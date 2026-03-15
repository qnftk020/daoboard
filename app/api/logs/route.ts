import { NextResponse } from 'next/server'
import { fetchChannelHistory } from '@/lib/discord-api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await fetchChannelHistory(100)
  return NextResponse.json(events)
}
