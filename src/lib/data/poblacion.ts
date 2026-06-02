/**
 * data/poblacion.ts
 * -----------------
 * Acceso a datos de población (por año o por barrio).
 * La tabla almacena los datos en una columna jsonb `datos` — aquí los aplanamos
 * antes de devolverlos para que la API exponga objetos planos.
 */

import { db } from '../supabase'
import { getDateFilter } from '../tier'
import type { Plan } from '../tier'

/**
 * @param barrios - Si true consulta `poblacion_barrios`; si false consulta `poblacion`
 */
export async function getPoblacionData(plan: Plan, barrios = false) {
  const dateFilter = getDateFilter(plan)
  const { data, error } = await db
    .from(barrios ? 'poblacion_barrios' : 'poblacion')
    .select('datos, fecha')
    .gte('fecha', dateFilter)
    .order('fecha', { ascending: false })
    .limit(200)

  if (error) return { data: null, error }

  // Aplana el campo jsonb `datos` para que el consumidor reciba objetos directos
  const flat = (data ?? []).map((row: any) => ({
    ...(typeof row.datos === 'object' && row.datos !== null ? row.datos : {}),
    fecha: row.fecha,
  }))

  return { data: flat, error: null }
}
