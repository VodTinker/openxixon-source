/**
 * data/incidencias.ts
 * -------------------
 * Acceso a datos de incidencias urbanas con filtros opcionales.
 */

import { db } from '../supabase'
import { getDateFilter } from '../tier'
import type { Plan } from '../tier'

export interface IncidenciasFilters {
  tipo?: string | null
  estado?: string | null
  /** Máximo 1000; por defecto 500 */
  limit?: number
}

export function getIncidenciasData(plan: Plan, filters: IncidenciasFilters = {}) {
  const dateFilter = getDateFilter(plan).split('T')[0]
  const limit = Math.max(1, Math.min(filters.limit ?? 500, 1000))

  let query = db
    .from('incidencias_urbanas')
    .select('*')
    .gte('fecha', dateFilter)
    .order('fecha', { ascending: false })
    .limit(limit)

  if (filters.tipo) query = query.eq('tipo', filters.tipo)
  if (filters.estado) query = query.eq('estado', filters.estado)

  return query
}
