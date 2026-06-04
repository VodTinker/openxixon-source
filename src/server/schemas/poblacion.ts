import { z } from 'zod'

export const poblacionQuerySchema = z.object({
  barrios: z.literal('1').optional(),
})

export type PoblacionQuery = z.infer<typeof poblacionQuerySchema>
