import type { APIRoute } from 'astro'
import { resolveApiCaller, apiResponse } from '../../lib/api-auth'
import { getIncidenciasData } from '../../lib/data/incidencias'

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const caller = await resolveApiCaller(request, cookies)
    if (!caller.ok) return caller.response

    const url = new URL(request.url)
    const rawLimit = parseInt(url.searchParams.get('limit') ?? '')
    const { data, error } = await getIncidenciasData(caller.plan, {
      tipo: url.searchParams.get('tipo'),
      estado: url.searchParams.get('estado'),
      limit: Number.isNaN(rawLimit) ? 500 : rawLimit,
    })

    if (error) {
      console.error('[API /incidencias]', error)
      return new Response(JSON.stringify({ error: 'Error al consultar las incidencias.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    return apiResponse(data, caller)
  } catch (err) {
    console.error('[API /incidencias] unexpected', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
