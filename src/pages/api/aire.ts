import type { APIRoute } from 'astro'
import { resolveApiCaller, apiResponse } from '../../lib/api-auth'
import { getAireData } from '../../lib/data/aire'

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const caller = await resolveApiCaller(request, cookies)
    if (!caller.ok) return caller.response

    const { data, error } = await getAireData(caller.plan)
    if (error) {
      console.error('[API /aire]', error)
      return new Response(JSON.stringify({ error: 'Error al consultar los datos de calidad del aire.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    return apiResponse(data, caller)
  } catch (err) {
    console.error('[API /aire] unexpected', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
