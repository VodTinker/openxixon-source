/**
 * data/inversiones.ts
 * --------------------
 * Acceso a datos de inversiones públicas municipales con filtros opcionales.
 */

import { db } from '../supabase'
import type { Plan } from '../tier'

export interface InversionesFilters {
  estado?: string | null
  entidad?: string | null
  /** Máximo 1000; por defecto 200 */
  limit?: number
}

export function getInversionesData(_plan: Plan, filters: InversionesFilters = {}) {
  // Las inversiones municipales son datos irregulares (no hay adjudicaciones diarias),
  // así que no aplicamos ventana histórica por plan — devolvemos los más recientes.
  const limit = Math.max(1, Math.min(filters.limit ?? 200, 1000))

  let query = db
    .from('inversiones')
    .select('*')
    .not('fecha_adjudicacion', 'is', null)

  if (filters.estado) query = query.eq('estado_actual', filters.estado)
  if (filters.entidad) query = query.eq('entidad', filters.entidad)

  return query
    .order('fecha_adjudicacion', { ascending: false, nullsFirst: false })
    .limit(limit)
}
