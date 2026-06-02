/**
 * data/aire.ts
 * ------------
 * Acceso a datos de calidad del aire.
 * La lógica de negocio (autenticación, límites) vive en api-auth.ts y tier.ts.
 */

import { db } from '../supabase'
import { getDateFilter } from '../tier'
import type { Plan } from '../tier'

/** Devuelve lecturas de calidad del aire filtradas por ventana histórica del plan.
 *  Solo incluye filas que tienen al menos un valor de contaminante no nulo. */
export function getAireData(plan: Plan) {
  const dateFilter = getDateFilter(plan)
  return db
    .from('calidad_aire')
    .select('fecha, estacion, no2, o3, pm10, pm25, co, latitud, longitud')
    .gte('fecha', dateFilter)
    .or('no2.not.is.null,o3.not.is.null,pm10.not.is.null,pm25.not.is.null')
    .order('fecha', { ascending: false })
    .limit(500)
}
