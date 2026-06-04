import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
  },
})

export interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export async function sendEmailHandler(input: SendEmailInput) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'alertas@openxixon.vodtinker.dev',
    to: input.to,
    subject: input.subject,
    html: input.html,
  })
  console.log(`[send-email] Sent to ${input.to} · ${info.messageId}`)
  return { messageId: info.messageId }
}
