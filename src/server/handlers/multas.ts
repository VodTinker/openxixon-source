import { db } from '../supabase'
import type { Plan } from '../../lib/types'

export interface MultasFilters {
  anio?: string | null
  calificacion?: string | null
  limit?: number
}

export async function multasHandler(_plan: Plan, filters: MultasFilters = {}): Promise<any[]> {
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

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any[]
}
