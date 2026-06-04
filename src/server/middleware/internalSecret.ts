export interface InternalSecretOk { ok: true }
export interface InternalSecretErr { ok: false; response: Response }

export function checkInternalSecret(request: Request, secret: string): InternalSecretOk | InternalSecretErr {
  if (!secret) {
    return { ok: false, response: unauthorized() }
  }
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== secret) {
    return { ok: false, response: unauthorized() }
  }
  return { ok: true }
}

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
