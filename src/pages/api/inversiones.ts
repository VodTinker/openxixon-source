import type { APIRoute } from 'astro'
import { resolveApiCaller, apiResponse } from '../../lib/api-auth'
import { getInversionesData } from '../../lib/data/inversiones'

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const caller = await resolveApiCaller(request, cookies)
    if (!caller.ok) return caller.response

    const url = new URL(request.url)
    const rawLimit = parseInt(url.searchParams.get('limit') ?? '')
    const { data, error } = await getInversionesData(caller.plan, {
      estado: url.searchParams.get('estado'),
      entidad: url.searchParams.get('entidad'),
      limit: Number.isNaN(rawLimit) ? 200 : rawLimit,
    })

    if (error) {
      console.error('[API /inversiones]', error)
      return new Response(JSON.stringify({ error: 'Error al consultar las inversiones.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    return apiResponse(data, caller)
  } catch (err) {
    console.error('[API /inversiones] unexpected', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
