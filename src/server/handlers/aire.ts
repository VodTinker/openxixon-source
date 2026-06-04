/**
 * handlers/aire.ts
 * ----------------
 * Lógica de negocio: consulta de calidad del aire.
 * Auth, rate limit y validación los aplica withApi (Phase 3) o resolveApiCaller (Phase 1).
 */

import { db } from '../supabase'
import { getDateFilter } from '../../lib/tier'
import type { Plan } from '../../lib/types'

export interface AireRow {
  fecha: string
  estacion: string
  no2: number | null
  o3: number | null
  pm10: number | null
  pm25: number | null
  co: number | null
  latitud: number | null
  longitud: number | null
}

export async function aireHandler(plan: Plan): Promise<AireRow[]> {
  const dateFilter = getDateFilter(plan)
  const { data, error } = await db
    .from('calidad_aire')
    .select('fecha, estacion, no2, o3, pm10, pm25, co, latitud, longitud')
    .gte('fecha', dateFilter)
    .or('no2.not.is.null,o3.not.is.null,pm10.not.is.null,pm25.not.is.null')
    .order('fecha', { ascending: false })
    .limit(500)

  if (error) throw error
  return (data ?? []) as AireRow[]
}
