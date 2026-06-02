import { defineMiddleware } from 'astro:middleware'
import { getSession } from './lib/supabase'

export const onRequest = defineMiddleware(async ({ request, cookies, redirect, url }, next) => {
  if (url.pathname.startsWith('/app')) {
    const { user } = await getSession(cookies, request)
    if (!user) return redirect('/login')
  }
  return next()
})
