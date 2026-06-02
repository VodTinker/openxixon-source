/**
 * rate-limit.ts
 * -------------
 * Ventana deslizante en memoria. Válido para un único proceso Node (VPS single-instance).
 * Cloudflare actúa de primera línea — esto es la segunda.
 */

interface Window {
  count: number
  resetAt: number // ms epoch
}

const store = new Map<string, Window>()

// Limpieza periódica para evitar que el Map crezca sin límite
setInterval(() => {
  const now = Date.now()
  for (const [key, win] of store) {
    if (now > win.resetAt) store.delete(key)
  }
}, 60_000)

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  resetAt: number // ms epoch
}

/**
 * Comprueba y registra una petición contra la ventana de `windowMs`.
 * @param key    Identificador único (ip, api_key hash, etc.)
 * @param limit  Máx. peticiones permitidas en la ventana
 * @param windowMs Tamaño de la ventana en ms (default 60 s)
 */
export function checkRateLimit(key: string, limit: number, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  const win = store.get(key)

  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, limit, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (win.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: win.resetAt }
  }

  win.count++
  return { ok: true, limit, remaining: limit - win.count, resetAt: win.resetAt }
}

/** Extrae la IP real teniendo en cuenta Cloudflare y proxies. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
