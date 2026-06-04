import { db } from '../../supabase'

export interface StripeWebhookInput {
  rawBody: string
  event: any
}

export async function stripeWebhookHandler(input: StripeWebhookInput) {
  const { event } = input

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

  return { ok: true }
}
