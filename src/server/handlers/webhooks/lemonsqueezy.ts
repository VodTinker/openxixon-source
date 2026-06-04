import { db } from '../../supabase'

export interface LemonSqueezyWebhookInput {
  event: any
}

export async function lemonSqueezyWebhookHandler(input: LemonSqueezyWebhookInput) {
  const { event } = input
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

  return { ok: true }
}
