/**
 * api-auth.ts
 * -----------
 * Resuelve quién llama a la API y con qué plan, e impone rate limiting.
 *
 * Flujo de autenticación (en orden de prioridad):
 *   1. API key — cabecera `Authorization: Bearer <key>`
 *   2. Sesión cookie — gestionada por Supabase SSR (uso desde el dashboard, sin límite)
 *   3. Anónimo — plan free con rate limit por IP
 *
 * Rate limits:
 *   Anónimo:       30 req/min por IP  (sin API key)
 *   API key free:  100 req/día (DB) + 60 req/min burst (memoria)
 *   API key pro:   10k req/día (DB) + 300 req/min burst (memoria)
 *   Sesión cookie: sin límite (uso interno del dashboard)
 */

import type { AstroCookies } from 'astro'
import { db, getSession } from './supabase'
import { isWithinLimit, TIER_LIMITS } from './tier'
import { checkRateLimit, getClientIp } from './rate-limit'
import type { Plan } from './tier'

const ANON_LIMIT_PER_MIN = 3
const BURST_LIMITS: Record<Plan, number> = {
  free: 60,
  pro:  300,
}

export interface ApiCallerOk {
  ok: true
  plan: Plan
  userId?: string
  rateLimit: { limit: number; remaining: number; resetAt: number }
}

export interface ApiCallerErr {
  ok: false
  response: Response
}

export type ApiCallerResult = ApiCallerOk | ApiCallerErr

function rateLimitResponse(resetAt: number, limit: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return new Response(
    JSON.stringify({ error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        'Retry-After': String(retryAfter),
      },
    },
  )
}

export async function resolveApiCaller(
  request: Request,
  cookies: AstroCookies,
): Promise<ApiCallerResult> {
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '').trim()

  // ── 1. API key ──────────────────────────────────────────────────────────────
  if (apiKey) {
    const { data: profile } = await db
      .from('profiles')
      .select('plan, requests_today, user_id')
      .eq('api_key', apiKey)
      .single()

    if (!profile) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: 'API key inválida' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      }
    }

    const plan = profile.plan as Plan

    // Límite diario (persiste en DB)
    if (!isWithinLimit(profile.requests_today, plan)) {
      const resetAt = Date.now() + 60_000 // indicativo; el reset real es a las 00:00 UTC
      return { ok: false, response: new Response(
        JSON.stringify({ error: 'Límite diario alcanzado', limit: TIER_LIMITS[plan].reqPerDay }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(TIER_LIMITS[plan].reqPerDay),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '86400',
          },
        },
      )}
    }

    // Burst limit por minuto (en memoria)
    const burst = checkRateLimit(`key:${apiKey}`, BURST_LIMITS[plan])
    if (!burst.ok) {
      return { ok: false, response: rateLimitResponse(burst.resetAt, burst.limit) }
    }

    // Incrementar contador diario
    db.from('profiles')
      .update({ requests_today: profile.requests_today + 1 })
      .eq('user_id', profile.user_id)
      .then()

    return { ok: true, plan, userId: profile.user_id, rateLimit: burst }
  }

  // ── 2. Sesión cookie (dashboard) — sin rate limit ───────────────────────────
  const { user } = await getSession(cookies, request)
  if (user) {
    const { data: profile } = await db
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    const plan = (profile?.plan as Plan) ?? 'free'
    // Ventana ficticia: sin límite real para el dashboard
    return {
      ok: true,
      plan,
      userId: user.id,
      rateLimit: { limit: TIER_LIMITS[plan].reqPerDay, remaining: TIER_LIMITS[plan].reqPerDay, resetAt: Date.now() + 86_400_000 },
    }
  }

  // ── 3. Anónimo — rate limit por IP ──────────────────────────────────────────
  const ip = getClientIp(request)
  const anon = checkRateLimit(`anon:${ip}`, ANON_LIMIT_PER_MIN)
  if (!anon.ok) {
    return { ok: false, response: rateLimitResponse(anon.resetAt, anon.limit) }
  }

  return { ok: true, plan: 'free', rateLimit: anon }
}

/** Construye la respuesta JSON con los headers de rate limit incluidos. */
export function apiResponse(data: unknown, caller: ApiCallerOk, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': String(caller.rateLimit.limit),
      'X-RateLimit-Remaining': String(caller.rateLimit.remaining),
      'X-RateLimit-Reset': String(Math.ceil(caller.rateLimit.resetAt / 1000)),
    },
  })
}
