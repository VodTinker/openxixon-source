import type { APIRoute } from 'astro'
import { statusHandler } from '../../server/handlers/status'

export const GET: APIRoute = async () => {
  const body = await statusHandler()
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  })
}
