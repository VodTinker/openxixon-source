import type { APIRoute } from 'astro'
import { resolveApiCaller, apiResponse } from '../../lib/api-auth'
import { getPoblacionData } from '../../lib/data/poblacion'

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const caller = await resolveApiCaller(request, cookies)
    if (!caller.ok) return caller.response

    const barrios = new URL(request.url).searchParams.get('barrios') === '1'
    const { data, error } = await getPoblacionData(caller.plan, barrios)

    if (error) {
      console.error('[API /poblacion]', error)
      return new Response(JSON.stringify({ error: 'Error al consultar los datos de población.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    return apiResponse(data, caller)
  } catch (err) {
    console.error('[API /poblacion] unexpected', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
