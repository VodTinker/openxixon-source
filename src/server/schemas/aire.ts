import { z } from 'zod'

export const aireQuerySchema = z.object({})

export type AireQuery = z.infer<typeof aireQuerySchema>
