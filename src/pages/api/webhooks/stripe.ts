import type { APIRoute } from 'astro'
import { stripe } from '../../../lib/stripe'
import { db } from '../../../lib/supabase'

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, import.meta.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new Response('Webhook signature invalid', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const userId = session.metadata?.user_id
    if (userId) {
      await db.from('profiles').update({
        plan: 'pro',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      }).eq('user_id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as any
    await db.from('profiles').update({ plan: 'free' }).eq('stripe_subscription_id', sub.id)
  }

  return new Response('ok')
}
