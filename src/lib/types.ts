import type { Plan as TierPlan } from './tier'

export type Plan = TierPlan

export interface CachePolicyEntry {
  sMaxAge: number
  swr: number
  lruTtlMs: number
  vary?: readonly string[]
}

export type CachePolicy = Record<string, CachePolicyEntry>
