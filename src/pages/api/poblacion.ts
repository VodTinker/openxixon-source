import { poblacionHandler } from '../../server/handlers/poblacion'
import { poblacionQuerySchema, type PoblacionQuery } from '../../server/schemas/poblacion'
import { withApi } from '../../server/withApi'

export const GET = withApi({
  querySchema: poblacionQuerySchema,
  handler: async (caller, q: PoblacionQuery) => poblacionHandler(caller.plan, q.barrios === '1'),
  cacheable: true,
})
