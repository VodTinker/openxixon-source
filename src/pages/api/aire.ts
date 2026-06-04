import { aireHandler } from '../../server/handlers/aire'
import { aireQuerySchema } from '../../server/schemas/aire'
import { withApi } from '../../server/withApi'

export const GET = withApi({
  querySchema: aireQuerySchema,
  handler: async (caller) => aireHandler(caller.plan),
  cacheable: true,
})
