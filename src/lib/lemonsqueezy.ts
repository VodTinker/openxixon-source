import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js'

lemonSqueezySetup({ apiKey: import.meta.env.LEMONSQUEEZY_API_KEY })

export { createCheckout }

export const PLANS = {
  pro: {
    name: 'Pro',
    price: 7.99,
    variantId: import.meta.env.LEMONSQUEEZY_VARIANT_ID ?? '',
    storeId: import.meta.env.LEMONSQUEEZY_STORE_ID ?? '',
  },
} as const

export async function createProCheckout(email: string, userId: string, redirectUrl: string) {
  const { data, error } = await createCheckout(PLANS.pro.storeId, PLANS.pro.variantId, {
    checkoutOptions: { embed: false },
    checkoutData: {
      email,
      custom: { user_id: userId },
    },
    productOptions: {
      redirectUrl,
      receiptThankYouNote: '¡Gracias por suscribirte a OpenXixón Pro!',
    },
  })

  if (error) throw new Error(error.message)
  return data!.data.attributes.url
}
