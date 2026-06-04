import { z } from 'zod'

export const incidenciasQuerySchema = z.object({
  tipo: z.string().min(1).max(64).optional(),
  estado: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
})

export type IncidenciasQuery = z.infer<typeof incidenciasQuerySchema>
