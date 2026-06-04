import { z } from 'zod'

export const multasQuerySchema = z.object({
  anio: z.string().regex(/^\d{4}$/).optional(),
  calificacion: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
})

export type MultasQuery = z.infer<typeof multasQuerySchema>
