import type { APIRoute } from 'astro'
import { createHmac } from 'crypto'
import { db } from '../../../lib/supabase'

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text()
  const sig = request.headers.get('x-signature') ?? ''
  const secret = import.meta.env.LEMONSQUEEZY_WEBHOOK_SECRET

  const hash = createHmac('sha256', secret).update(body).digest('hex')
  if (hash !== sig) return new Response('Invalid signature', { status: 401 })

  const event = JSON.parse(body)
  const eventName = event.meta?.event_name
  const userId = event.meta?.custom_data?.user_id
  const subscriptionId = event.data?.id
  const customerId = event.data?.attributes?.customer_id?.toString()

  if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
    const status = event.data?.attributes?.status
    const plan = status === 'active' ? 'pro' : 'free'

    if (userId) {
      await db.from('profiles').update({
        plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }).eq('user_id', userId)
    }
  }

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    if (subscriptionId) {
      await db.from('profiles').update({ plan: 'free' }).eq('stripe_subscription_id', subscriptionId)
    }
  }

  return new Response('ok')
}
