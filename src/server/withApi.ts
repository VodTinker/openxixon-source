import type { APIRoute } from 'astro'
import type { ZodSchema } from 'zod'
import { resolveApiCaller, apiResponse, type ApiCallerOk } from './middleware/resolveApiCaller'
import { withCache } from './cache/withCache'
import { verifyStripe, verifyLemonSqueezy } from './middleware/webhookSignature'
import { checkInternalSecret } from './middleware/internalSecret'

export interface WithApiConfig<QS, RES> {
  querySchema: ZodSchema<QS>
  handler: (caller: ApiCallerOk, query: QS, extras?: { rawBody?: string; webhookEvent?: unknown }) => Promise<RES>
  cacheable?: boolean
  internal?: boolean
  webhook?: { provider: 'stripe' | 'lemonsqueezy' }
}

export function withApi<QS, RES>(config: WithApiConfig<QS, RES>): APIRoute {
  return async (context) => {
    const { request, cookies, url } = context
    const params = url.searchParams

    // 1. Webhook signature check (skips validation, auth, rate limit)
    let rawBody: string | undefined
    let webhookEvent: unknown
    if (config.webhook) {
      rawBody = await request.text()
      try {
        if (config.webhook.provider === 'stripe') {
          webhookEvent = verifyStripe(rawBody, request.headers.get('stripe-signature') ?? '', import.meta.env.STRIPE_WEBHOOK_SECRET)
        } else {
          webhookEvent = verifyLemonSqueezy(rawBody, request.headers.get('x-signature') ?? '', import.meta.env.LEMONSQUEEZY_WEBHOOK_SECRET)
        }
      } catch {
        return new Response('Webhook signature invalid', { status: 401 })
      }
    }

    // 2. Internal secret check
    if (config.internal) {
      const r = checkInternalSecret(request, process.env.INTERNAL_API_SECRET ?? '')
      if (!r.ok) return r.response
    }

    // 3. Zod validation (skip for webhooks)
    if (!config.webhook) {
      const rawQuery = Object.fromEntries(params.entries())
      const parsed = config.querySchema.safeParse(rawQuery)
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: 'Parámetros inválidos', issues: parsed.error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
      // 4. Auth + rate limit
      const caller = await resolveApiCaller(request, cookies)
      if (!caller.ok) return caller.response

      // 5. Cache + handler
      try {
        let data: RES
        let hit = false
        if (config.cacheable) {
          const result = await withCache(url.pathname, caller.plan, params, async () => {
            const d = await config.handler(caller, parsed.data)
            return { data: d }
          })
          data = result.data
          hit = result.hit
        } else {
          data = await config.handler(caller, parsed.data)
        }

        const res = apiResponse(data, caller)
        if (config.cacheable) res.headers.set('X-Cache', hit ? 'HIT' : 'MISS')
        return res
      } catch (err) {
        console.error(`[API ${url.pathname}] handler error:`, err)
        return new Response(
          JSON.stringify({ error: 'Error interno del servidor.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    // 6. Webhook handler (no validation, no auth)
    try {
      const data = await (config.handler as any)(null, {} as QS, { rawBody, webhookEvent })
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      console.error(`[API ${url.pathname}] webhook handler error:`, err)
      return new Response('Internal error', { status: 500 })
    }
  }
}
