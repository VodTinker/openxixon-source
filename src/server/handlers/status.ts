import { db } from '../supabase'

const GATUS_BASE = 'http://localhost:8182'

const ENDPOINT_LABELS: Record<string, string> = {
  'api-aire':        '/api/aire',
  'api-incidencias': '/api/incidencias',
  'api-poblacion':   '/api/poblacion',
  'api-inversiones': '/api/inversiones',
  'api-multas':      '/api/multas',
}

const DATASET_LABELS: Record<string, string> = {
  'api-aire':        'Calidad del Aire',
  'api-incidencias': 'Incidencias Urbanas',
  'api-poblacion':   'Población',
  'api-inversiones': 'Inversiones',
  'api-multas':      'Multas de Tráfico',
}

const SUPABASE_TABLES = [
  { key: 'api-aire',        table: 'calidad_aire',        dateCol: 'fecha'      as string | null },
  { key: 'api-incidencias', table: 'incidencias_urbanas', dateCol: 'fecha'      as string | null },
  { key: 'api-poblacion',   table: 'poblacion',           dateCol: 'fecha'      as string | null },
  { key: 'api-inversiones', table: 'inversiones',         dateCol: 'ingesta_at' as string | null },
  { key: 'api-multas',      table: 'multas_trafico',      dateCol: null         as string | null },
]

interface GatusResult {
  success: boolean
  duration: number
  timestamp: string
}

interface GatusEndpoint {
  name: string
  key: string
  results: GatusResult[]
  uptime: { '7d'?: number; '1h'?: number; '24h'?: number }
}

function gatusStatus(ep: GatusEndpoint): 'ok' | 'error' {
  const last = ep.results[ep.results.length - 1]
  return last?.success ? 'ok' : 'error'
}

async function fetchIncidents(key: string, label: string) {
  try {
    const res = await fetch(`${GATUS_BASE}/api/v1/endpoints/${key}/results?page=1&pageSize=500`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const results: GatusResult[] = (data.results ?? [])
      .slice()
      .sort((a: GatusResult, b: GatusResult) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )

    const WINDOW = Date.now() - 30 * 24 * 3600 * 1000
    const out: Array<{ label: string; start: string; end: string | null }> = []
    let incStart: string | null = null

    for (const r of results) {
      if (new Date(r.timestamp).getTime() < WINDOW) continue
      if (!r.success && incStart === null) {
        incStart = r.timestamp
      } else if (r.success && incStart !== null) {
        out.push({ label, start: incStart, end: r.timestamp })
        incStart = null
      }
    }
    if (incStart !== null) out.push({ label, start: incStart, end: null })
    return out
  } catch {
    return []
  }
}

function mergeIncidents(raw: Array<{ label: string; start: string; end: string | null }>) {
  if (raw.length === 0) return []
  const sorted = raw.slice().sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const merged: any[] = []
  for (const item of sorted) {
    const startMs = new Date(item.start).getTime()
    const endMs = item.end ? new Date(item.end).getTime() : null
    const overlap = merged.find((m) => {
      const mEnd = m.end ? new Date(m.end).getTime() : Date.now()
      return startMs <= mEnd + 10 * 60_000 && (endMs === null || endMs >= new Date(m.start).getTime() - 10 * 60_000)
    })
    if (overlap) {
      if (!overlap.services.includes(item.label)) overlap.services.push(item.label)
      if (endMs === null) { overlap.end = null; overlap.resolved = false }
      else if (overlap.end && endMs > new Date(overlap.end).getTime()) overlap.end = item.end
    } else {
      merged.push({
        services: [item.label],
        start: item.start,
        end: item.end,
        durationMin: endMs ? Math.round((endMs - startMs) / 60_000) : null,
        resolved: item.end !== null,
      })
    }
  }
  return merged.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
}

function hoursAgo(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000
}

function supabaseStatus(lastUpdate: string | null, count: number): 'ok' | 'stale' | 'error' {
  if (!lastUpdate || count === 0) return 'error'
  const h = hoursAgo(lastUpdate)
  if (h > 50) return 'error'
  if (h > 26) return 'stale'
  return 'ok'
}

async function querySupabase(table: string, dateCol: string | null) {
  const t0 = Date.now()
  try {
    if (!dateCol) {
      const { count, data, error } = await db
        .from(table).select('anio, mes', { count: 'exact' })
        .order('anio', { ascending: false }).limit(1)
      if (error) throw error
      const last = (data as Array<{ anio: number; mes: string }> | null)?.[0]
      return { lastUpdate: last ? `${last.anio}-${last.mes}` : null, rows: count ?? 0, latency: Date.now() - t0, status: (count && count > 0 ? 'ok' : 'error') as 'ok' | 'error' }
    }
    const { count, data, error } = await db
      .from(table).select(dateCol, { count: 'exact' })
      .order(dateCol, { ascending: false }).limit(1)
    if (error) throw error
    const lastUpdate = ((data as unknown as Array<Record<string, unknown>> | null)?.[0]?.[dateCol] ?? null) as string | null
    return { lastUpdate, rows: count ?? 0, latency: Date.now() - t0, status: supabaseStatus(lastUpdate, count ?? 0) }
  } catch {
    return { lastUpdate: null, rows: 0, latency: Date.now() - t0, status: 'error' as const }
  }
}

export async function statusHandler() {
  try {
    const res = await fetch(`${GATUS_BASE}/api/v1/endpoints/statuses`, {
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) throw new Error(`Gatus ${res.status}`)

    const endpoints: GatusEndpoint[] = await res.json()
    const rawIncidents = await Promise.all(
      endpoints.map((ep) => fetchIncidents(ep.key, DATASET_LABELS[ep.name] ?? ENDPOINT_LABELS[ep.name] ?? ep.name)),
    )
    const incidents = mergeIncidents(rawIncidents.flat())

    const datasetResults = endpoints.map((ep) => {
      const last = ep.results[ep.results.length - 1]
      const uptime7d = ep.uptime?.['7d'] != null ? Math.round(ep.uptime['7d'] * 1000) / 10 : null
      return {
        name: DATASET_LABELS[ep.name] ?? ep.name,
        lastUpdate: last?.timestamp ?? null,
        status: gatusStatus(ep),
        latency: last ? Math.round(last.duration / 1_000_000) : 0,
        uptime7d,
      }
    })
    const endpointResults = endpoints.map((ep) => {
      const last = ep.results[ep.results.length - 1]
      const status = gatusStatus(ep)
      const uptime7d = ep.uptime?.['7d'] != null ? Math.round(ep.uptime['7d'] * 1000) / 10 : null
      return {
        name: ENDPOINT_LABELS[ep.name] ?? ep.name,
        status,
        code: status === 'ok' ? 200 : 500,
        latency: last ? Math.round(last.duration / 1_000_000) : 0,
        uptime7d,
      }
    })

    const all = [...datasetResults, ...endpointResults]
    const overall = all.every((r) => r.status === 'ok') ? 'operational' : 'degraded'
    return { ts: new Date().toISOString(), overall, datasets: datasetResults, endpoints: endpointResults, incidents }
  } catch {
    // Gatus unavailable; fall through to Supabase
  }

  const results = await Promise.all(
    SUPABASE_TABLES.map(({ key, table, dateCol }) =>
      querySupabase(table, dateCol).then((r) => ({ key, ...r })),
    ),
  )
  const datasetResults = results.map((r) => ({
    name: DATASET_LABELS[r.key],
    lastUpdate: r.lastUpdate,
    status: r.status as 'ok' | 'stale' | 'error',
    latency: r.latency,
    uptime7d: null,
  }))
  const endpointResults = results.map((r) => ({
    name: ENDPOINT_LABELS[r.key],
    status: r.status as 'ok' | 'stale' | 'error',
    code: r.status !== 'error' ? 200 : 500,
    latency: r.latency,
    uptime7d: null,
  }))
  const all = [...datasetResults, ...endpointResults]
  const overall = all.every((r) => r.status === 'ok') ? 'operational' : 'degraded'
  return { ts: new Date().toISOString(), overall, datasets: datasetResults, endpoints: endpointResults, incidents: [] }
}
