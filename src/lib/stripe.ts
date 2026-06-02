import Stripe from 'stripe'

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
})

export const PLANS = {
  pro: {
    name: 'Pro',
    price: 7.99,
    priceId: import.meta.env.STRIPE_PRO_PRICE_ID ?? '',
    meteredPriceId: import.meta.env.STRIPE_METERED_PRICE_ID ?? '',
  },
} as const
