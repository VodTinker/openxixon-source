import { createClient } from '@supabase/supabase-js'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

const url = import.meta.env.SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL
const anon = import.meta.env.SUPABASE_ANON_KEY ?? import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const service = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

export const db = createClient(url, service ?? anon)

export function createSupabaseClient(cookies: AstroCookies, request?: Request) {
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        const header = request?.headers.get('Cookie') ?? ''
        // Filtrar cookies sin valor para cumplir la interfaz GetAllCookies
        return parseCookieHeader(header).filter(
          (c): c is { name: string; value: string } => c.value !== undefined,
        )
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try { cookies.set(name, value, options) } catch {}
        })
      },
    },
  })
}

export async function getSession(cookies: AstroCookies, request?: Request) {
  const supabase = createSupabaseClient(cookies, request)
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}
