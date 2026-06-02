export const TIER_LIMITS = {
  free: { days: 30, reqPerDay: 100 },
  pro:  { days: 365, reqPerDay: 10_000 },
} as const

export type Plan = keyof typeof TIER_LIMITS

export function getDateFilter(plan: Plan) {
  const days = TIER_LIMITS[plan].days
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export function isWithinLimit(requestsToday: number, plan: Plan) {
  return requestsToday < TIER_LIMITS[plan].reqPerDay
}
