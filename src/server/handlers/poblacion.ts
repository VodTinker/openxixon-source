import { db } from '../supabase'
import { getDateFilter } from '../../lib/tier'
import type { Plan } from '../../lib/types'

export async function poblacionHandler(plan: Plan, barrios = false): Promise<any[]> {
  const dateFilter = getDateFilter(plan)
  const { data, error } = await db
    .from(barrios ? 'poblacion_barrios' : 'poblacion')
    .select('datos, fecha')
    .gte('fecha', dateFilter)
    .order('fecha', { ascending: false })
    .limit(200)

  if (error) throw error

  const flat = (data ?? []).map((row: any) => ({
    ...(typeof row.datos === 'object' && row.datos !== null ? row.datos : {}),
    fecha: row.fecha,
  }))

  return flat
}
