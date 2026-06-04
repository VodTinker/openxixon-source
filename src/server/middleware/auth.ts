import type { AstroCookies } from 'astro'
import { getSession } from '../supabase'

export async function requireAppSession(cookies: AstroCookies, request: Request): Promise<Response | null> {
  const { user } = await getSession(cookies, request)
  if (!user) {
    return new Response(null, { status: 302, headers: { Location: '/login' } })
  }
  return null
}
