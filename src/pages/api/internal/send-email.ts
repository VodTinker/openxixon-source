import { z } from 'zod'
import { sendEmailHandler } from '../../../server/handlers/internal/send-email'
import { withApi } from '../../../server/withApi'

const sendEmailSchema = z.object({
  to: z.email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
})

export const POST = withApi({
  querySchema: sendEmailSchema,
  handler: async (_caller, body) => sendEmailHandler(body),
  internal: true,
})
