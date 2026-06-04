import { createHmac, timingSafeEqual } from 'crypto'
import Stripe from 'stripe'

export function verifyStripe(rawBody: string, signatureHeader: string, secret: string): Stripe.Event {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=')
      return [k, v]
    }),
  )
  if (!parts.t || !parts.v1) throw new Error('Invalid Stripe signature header')

  const signedPayload = `${parts.t}.${rawBody}`
  const expected = createHmac('sha256', secret).update(signedPayload).digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  const actualBuf = Buffer.from(parts.v1, 'hex')
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error('Invalid Stripe signature')
  }
  return JSON.parse(rawBody) as Stripe.Event
}

export function verifyLemonSqueezy(rawBody: string, signatureHeader: string, secret: string): any {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  const actualBuf = Buffer.from(signatureHeader, 'hex')
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error('Invalid LemonSqueezy signature')
  }
  return JSON.parse(rawBody)
}
