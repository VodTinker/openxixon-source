import { z } from 'zod'
import { lemonSqueezyWebhookHandler } from '../../../server/handlers/webhooks/lemonsqueezy'
import { withApi } from '../../../server/withApi'

export const POST = withApi({
  querySchema: z.object({}),
  handler: async (_caller, _q, extras) => {
    return lemonSqueezyWebhookHandler({ event: extras?.webhookEvent })
  },
  webhook: { provider: 'lemonsqueezy' },
})
