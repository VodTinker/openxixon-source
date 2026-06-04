import type { Plan } from '../../lib/types'

export function buildCacheKey(endpoint: string, plan: Plan, params: URLSearchParams): string {
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  return `${endpoint}::${plan}::${JSON.stringify(sorted)}`
}
