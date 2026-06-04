import type { CachePolicy } from '../../lib/types'

export const CACHE_POLICY: CachePolicy = {
  '/api/aire':        { sMaxAge: 3600, swr: 7200, lruTtlMs: 3_600_000 },
  '/api/incidencias': { sMaxAge: 1800, swr: 3600, lruTtlMs: 1_800_000, vary: ['tipo', 'estado'] },
  '/api/poblacion':   { sMaxAge: 3600, swr: 7200, lruTtlMs: 3_600_000, vary: ['barrios'] },
  '/api/multas':      { sMaxAge: 3600, swr: 7200, lruTtlMs: 3_600_000, vary: ['anio', 'calificacion'] },
  '/api/inversiones': { sMaxAge: 3600, swr: 7200, lruTtlMs: 3_600_000, vary: ['estado', 'entidad'] },
  '/api/status':      { sMaxAge: 30,   swr: 60,   lruTtlMs: 0 },
}

export function getPolicy(pathname: string) {
  return CACHE_POLICY[pathname]
}
