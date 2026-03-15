'use client'

import PusherClient from 'pusher-js'

let pusherClient: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) {
      throw new Error('Pusher environment variables are not set')
    }
    pusherClient = new PusherClient(key, { cluster })
  }
  return pusherClient
}
