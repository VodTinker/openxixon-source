import { responseCache } from './instance'
import { buildCacheKey } from './keys'
import { getPolicy } from './policy'
import type { Plan } from '../../lib/types'

export async function withCache<T>(
  endpoint: string,
  plan: Plan,
  params: URLSearchParams,
  compute: () => Promise<{ data: T; status?: number }>,
): Promise<{ data: T; status: number; hit: boolean }> {
  const policy = getPolicy(endpoint)
  if (!policy || policy.lruTtlMs === 0) {
    const { data, status = 200 } = await compute()
    return { data, status, hit: false }
  }

  const key = buildCacheKey(endpoint, plan, params)
  const cached = responseCache.get(key)
  if (cached) {
    return { data: JSON.parse(cached.body) as T, status: cached.status, hit: true }
  }

  const { data, status = 200 } = await compute()
  responseCache.set(key, { body: JSON.stringify(data), status, headers: {} }, policy.lruTtlMs)
  return { data, status, hit: false }
}
