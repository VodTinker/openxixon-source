import { db } from '../supabase'
import { getDateFilter } from '../../lib/tier'
import type { Plan } from '../../lib/types'

export interface IncidenciasFilters {
  tipo?: string | null
  estado?: string | null
  limit?: number
}

export async function incidenciasHandler(plan: Plan, filters: IncidenciasFilters = {}): Promise<any[]> {
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

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any[]
}
