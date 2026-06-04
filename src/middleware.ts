import { defineMiddleware } from 'astro:middleware'
import { applySecurityHeaders } from './server/middleware/securityHeaders'
import { applyCacheHeaders } from './server/middleware/cacheHeaders'
import { requireAppSession } from './server/middleware/auth'

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, request } = context
  const { pathname } = url

  if (pathname.startsWith('/app')) {
    const redirect = await requireAppSession(cookies, request)
    if (redirect) return redirect
  }

  const response = await next()

  const secured = applySecurityHeaders(response)
  return applyCacheHeaders(secured, pathname)
})
