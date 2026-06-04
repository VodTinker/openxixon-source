import { multasHandler } from '../../server/handlers/multas'
import { multasQuerySchema, type MultasQuery } from '../../server/schemas/multas'
import { withApi } from '../../server/withApi'

export const GET = withApi({
  querySchema: multasQuerySchema,
  handler: async (caller, q: MultasQuery) => {
    const { limit, ...filters } = q
    return multasHandler(caller.plan, { ...filters, limit })
  },
  cacheable: true,
})
