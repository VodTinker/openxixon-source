import { getPolicy } from '../cache/policy'

const NO_CACHE_PATHS = ['/api/webhooks/', '/api/internal/']

export function applyCacheHeaders(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers)

  if (NO_CACHE_PATHS.some((p) => pathname.startsWith(p))) {
    if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store')
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }

  const policy = getPolicy(pathname)
  if (policy && policy.lruTtlMs !== undefined) {
    if (!headers.has('Cache-Control')) {
      const cc = `public, s-maxage=${policy.sMaxAge}, stale-while-revalidate=${policy.swr}`
      headers.set('Cache-Control', cc)
    }
  }

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
