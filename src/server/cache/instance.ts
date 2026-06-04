import { createLRU } from './lru'

export interface CachedResponse {
  body: string
  status: number
  headers: Record<string, string>
}

export const responseCache = createLRU<CachedResponse>({ maxBytes: 20 * 1024 * 1024 })
