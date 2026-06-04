import { z } from 'zod'

export const inversionesQuerySchema = z.object({
  estado: z.string().min(1).max(64).optional(),
  entidad: z.string().min(1).max(128).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
})

export type InversionesQuery = z.infer<typeof inversionesQuerySchema>
