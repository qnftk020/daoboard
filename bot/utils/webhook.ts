import { VibeEvent } from '../../types/vibe'

export async function sendWebhook(event: VibeEvent): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
  const webhookSecret = process.env.WEBHOOK_SECRET || ''

  const res = await fetch(`${appUrl}/api/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret,
    },
    body: JSON.stringify(event),
  })

  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status} ${res.statusText}`)
  }
}
