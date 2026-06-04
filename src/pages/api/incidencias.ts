import { incidenciasHandler } from '../../server/handlers/incidencias'
import { incidenciasQuerySchema, type IncidenciasQuery } from '../../server/schemas/incidencias'
import { withApi } from '../../server/withApi'

export const GET = withApi({
  querySchema: incidenciasQuerySchema,
  handler: async (caller, q: IncidenciasQuery) => {
    const { limit, ...filters } = q
    return incidenciasHandler(caller.plan, { ...filters, limit })
  },
  cacheable: true,
})
