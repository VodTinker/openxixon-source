import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const COOLDOWN_MINUTES = Number(Deno.env.get('ALERTAS_COOLDOWN_MINUTES') || '120')

const PARAM_LABELS: Record<string, string> = {
  no2: 'NO₂',
  o3: 'O₃',
  pm10: 'PM10',
  pm25: 'PM2.5',
  co: 'CO',
}

const PARAM_UNITS: Record<string, string> = {
  no2: 'µg/m³',
  o3: 'µg/m³',
  pm10: 'µg/m³',
  pm25: 'µg/m³',
  co: 'mg/m³',
}

function buildEmailHtml(param: string, operator: string, umbral: number, valor: number) {
  const label = PARAM_LABELS[param] || param.toUpperCase()
  const unit = PARAM_UNITS[param] || ''
  const opText = operator === 'gt' ? 'superado' : 'caído por debajo de'
  const opSymbol = operator === 'gt' ? '>' : '<'

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px; }
  .wrap { max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .header { background: #0b0c0f; padding: 24px; }
  .header h2 { color: #6ee7b7; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
  .header p { color: #94a3b8; margin: 6px 0 0; font-size: 13px; }
  .body { padding: 24px; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
  .badge.alert { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .metric { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
  .metric-value { font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
  .metric-unit { font-size: 14px; color: #64748b; }
  .rule { font-size: 13px; color: #64748b; margin-bottom: 20px; }
  .rule strong { color: #334155; }
  .cta { display: inline-block; padding: 10px 20px; background: #0b0c0f; color: #fff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; }
  .footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h2>OpenXixón</h2>
    <p>Alerta de calidad del aire · Gijón</p>
  </div>
  <div class="body">
    <span class="badge alert">Umbra ${opText}</span>
    <div class="metric">
      <span class="metric-value">${valor}</span>
      <span class="metric-unit">${unit}</span>
    </div>
    <div class="rule">
      <strong>${label}</strong> ha ${opText} tu umbral de <strong>${umbral} ${unit}</strong>.<br>
      Operador configurado: <strong>${opSymbol}</strong>
    </div>
    <a href="https://openxixon.vodtinker.dev/app/alertas" class="cta">Gestionar alertas</a>
  </div>
  <div class="footer">
    Recibes este email porque configuraste una alerta en OpenXixón. No respondas a este mensaje.
  </div>
</div>
</body>
</html>
  `.trim()
}

Deno.serve(async () => {
  const now = new Date()
  const cooldownIso = new Date(now.getTime() - COOLDOWN_MINUTES * 60 * 1000).toISOString()

  console.log(`[alertas] Evaluando alertas... cooldown > ${cooldownIso}`)

  // 1. Leer alertas activas sin envío reciente
  const { data: alertas, error: errAlertas } = await supabase
    .from('alertas')
    .select('*')
    .eq('activa', true)
    .or(`ultimo_envio.is.null,ultimo_envio.lt.${cooldownIso}`)

  if (errAlertas) {
    console.error('[alertas] Error leyendo alertas:', errAlertas)
    return new Response(JSON.stringify({ ok: false, error: errAlertas.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!alertas || alertas.length === 0) {
    console.log('[alertas] Sin alertas pendientes')
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no_pending_alerts' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[alertas] ${alertas.length} alerta(s) pendiente(s)`)

  const sent: Array<{ id: string; param: string; valor: number }> = []
  const skipped: Array<{ id: string; reason: string }> = []

  for (const alerta of alertas) {
    // 2. Última lectura del parámetro (cualquier estación, más reciente)
    const { data: lecturas, error: errLectura } = await supabase
      .from('calidad_aire')
      .select(alerta.parametro)
      .not(alerta.parametro, 'is', null)
      .order('fecha', { ascending: false })
      .limit(1)

    if (errLectura) {
      console.error(`[alertas] Error leyendo calidad_aire para ${alerta.id}:`, errLectura)
      skipped.push({ id: alerta.id, reason: 'db_error_reading' })
      continue
    }

    if (!lecturas || lecturas.length === 0) {
      skipped.push({ id: alerta.id, reason: 'no_recent_reading' })
      continue
    }

    const valor = lecturas[0][alerta.parametro]
    if (valor == null) {
      skipped.push({ id: alerta.id, reason: 'null_value' })
      continue
    }

    // 3. Evaluar condición
    const cumple = alerta.operador === 'gt' ? valor > alerta.umbral : valor < alerta.umbral
    if (!cumple) {
      skipped.push({ id: alerta.id, reason: 'threshold_not_met' })
      continue
    }

    console.log(`[alertas] Alerta ${alerta.id}: ${alerta.parametro} = ${valor} ${alerta.operador} ${alerta.umbral} → CUMPLE`)

    // 4. Obtener email del usuario vía Auth Admin API
    const userRes = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users/${alerta.user_id}`,
      {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        },
      }
    )
    const userData = await userRes.json().catch(() => null)
    const email = userData?.email
    if (!email) {
      console.error(`[alertas] No se pudo obtener email para usuario ${alerta.user_id}`)
      skipped.push({ id: alerta.id, reason: 'no_email' })
      continue
    }

    // 5. Enviar email vía endpoint interno (SMTP local en el VPS)
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://openxixon.vodtinker.dev'
    const internalSecret = Deno.env.get('INTERNAL_API_SECRET')

    if (!internalSecret) {
      console.warn(`[alertas] INTERNAL_API_SECRET no configurado. Simulando envío a ${email}`)
      await supabase.from('alertas').update({ ultimo_envio: now.toISOString() }).eq('id', alerta.id)
      sent.push({ id: alerta.id, param: alerta.parametro, valor })
      continue
    }

    const label = PARAM_LABELS[alerta.parametro] || alerta.parametro.toUpperCase()
    const opSymbol = alerta.operador === 'gt' ? '>' : '<'

    const res = await fetch(`${siteUrl}/api/internal/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${internalSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: `Alerta OpenXixón · ${label} ${opSymbol} ${alerta.umbral}`,
        html: buildEmailHtml(alerta.parametro, alerta.operador, alerta.umbral, valor),
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[alertas] Error enviando email para ${alerta.id}: ${res.status} ${body}`)
      skipped.push({ id: alerta.id, reason: `smtp_${res.status}` })
      continue
    }

    const sendData = await res.json().catch(() => ({}))
    console.log(`[alertas] Email enviado a ${email} · ${sendData.messageId || 'ok'}`)

    // 6. Actualizar ultimo_envio
    await supabase.from('alertas').update({ ultimo_envio: now.toISOString() }).eq('id', alerta.id)
    sent.push({ id: alerta.id, param: alerta.parametro, valor })
  }

  return new Response(JSON.stringify({ ok: true, sent: sent.length, skipped: skipped.length, details: sent, skipped }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
