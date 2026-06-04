import { db } from '../supabase'
import type { Plan } from '../../lib/types'

export interface InversionesFilters {
  estado?: string | null
  entidad?: string | null
  limit?: number
}

export async function inversionesHandler(_plan: Plan, filters: InversionesFilters = {}): Promise<any[]> {
  const limit = Math.max(1, Math.min(filters.limit ?? 200, 1000))

  let query = db
    .from('inversiones')
    .select('*')
    .not('fecha_adjudicacion', 'is', null)

  if (filters.estado) query = query.eq('estado_actual', filters.estado)
  if (filters.entidad) query = query.eq('entidad', filters.entidad)

  query = query
    .order('fecha_adjudicacion', { ascending: false, nullsFirst: false })
    .limit(limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any[]
}
