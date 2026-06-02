/**
 * data/multas.ts
 * --------------
 * Acceso a datos de multas de tráfico con filtros opcionales.
 * Nota: los datos de multas no tienen fecha continua (son agregados mensuales),
 * por lo que no se aplica la ventana histórica del plan.
 */

import { db } from '../supabase'
import type { Plan } from '../tier'

export interface MultasFilters {
  anio?: string | null
  calificacion?: string | null
  /** Máximo 1000; por defecto 500 */
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMultasData(_plan: Plan, filters: MultasFilters = {}) {
  const limit = Math.max(1, Math.min(filters.limit ?? 500, 1000))

  let query = db
    .from('multas_trafico')
    .select('*')
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .limit(limit)

  if (filters.anio) {
    const anio = parseInt(filters.anio)
    if (!Number.isNaN(anio)) query = query.eq('anio', anio)
  }
  if (filters.calificacion) query = query.eq('calificacion', filters.calificacion)

  return query
}
