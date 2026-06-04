export interface LRUOptions {
  maxBytes: number
}

export interface LRU<V> {
  get(key: string): V | null
  set(key: string, value: V, ttlMs: number): void
  size: number
}

interface Entry<V> {
  value: V
  size: number
  expiresAt: number
}

export function createLRU<V>(options: LRUOptions): LRU<V> {
  const map = new Map<string, Entry<V>>()
  let totalSize = 0

  function byteSize(value: V): number {
    if (typeof value === 'string') return value.length
    if (value instanceof Uint8Array) return value.byteLength
    try {
      return JSON.stringify(value).length
    } catch {
      return 0
    }
  }

  function evictUntilFits(needed: number) {
    while (totalSize + needed > options.maxBytes && map.size > 0) {
      const oldestKey = map.keys().next().value as string | undefined
      if (oldestKey === undefined) break
      const entry = map.get(oldestKey)!
      totalSize -= entry.size
      map.delete(oldestKey)
    }
  }

  return {
    get size() {
      return totalSize
    },
    get(key: string) {
      const entry = map.get(key)
      if (!entry) return null
      if (Date.now() > entry.expiresAt) {
        totalSize -= entry.size
        map.delete(key)
        return null
      }
      // refresh LRU order
      map.delete(key)
      map.set(key, entry)
      return entry.value
    },
    set(key: string, value: V, ttlMs: number) {
      const size = byteSize(value)
      const existing = map.get(key)
      if (existing) totalSize -= existing.size
      evictUntilFits(size)
      map.set(key, { value, size, expiresAt: Date.now() + ttlMs })
      totalSize += size
    },
  }
}
