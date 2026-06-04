import { inversionesHandler } from '../../server/handlers/inversiones'
import { inversionesQuerySchema, type InversionesQuery } from '../../server/schemas/inversiones'
import { withApi } from '../../server/withApi'

export const GET = withApi({
  querySchema: inversionesQuerySchema,
  handler: async (caller, q: InversionesQuery) => {
    const { limit, ...filters } = q
    return inversionesHandler(caller.plan, { ...filters, limit })
  },
  cacheable: true,
})
