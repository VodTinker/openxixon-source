import type { APIRoute } from 'astro'
import nodemailer from 'nodemailer'

const SECRET = process.env.INTERNAL_API_SECRET

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
  },
})

export const POST: APIRoute = async ({ request }) => {
  const auth = request.headers.get('authorization') || ''
  if (!SECRET || !auth.startsWith('Bearer ') || auth.slice(7) !== SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: { to?: string; subject?: string; html?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!body.to || !body.subject || !body.html) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'alertas@openxixon.vodtinker.dev',
      to: body.to,
      subject: body.subject,
      html: body.html,
    })
    console.log(`[send-email] Sent to ${body.to} · ${info.messageId}`)
    return new Response(JSON.stringify({ ok: true, messageId: info.messageId }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[send-email] SMTP error:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
