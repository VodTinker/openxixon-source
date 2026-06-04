import { z } from 'zod'
import { stripeWebhookHandler } from '../../../server/handlers/webhooks/stripe'
import { withApi } from '../../../server/withApi'

export const POST = withApi({
  querySchema: z.object({}),
  handler: async (_caller, _q, extras) => {
    return stripeWebhookHandler({ rawBody: extras?.rawBody ?? '', event: extras?.webhookEvent })
  },
  webhook: { provider: 'stripe' },
})
