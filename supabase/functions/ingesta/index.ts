import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const BASE = 'https://opendata.gijon.es/descargar.php?tipo=JSON&id='

const DATASETS: Array<{
  id: number
  tabla: string
  transform: (raw: any[]) => any[]
  conflictColumns?: string
  truncate?: boolean
  appendOnly?: boolean
}> = [
  { id: 1,   tabla: 'calidad_aire', transform: transformAire, conflictColumns: 'estacion,fecha' },
  { id: 4,   tabla: 'estaciones_aire', transform: transformEstaciones, conflictColumns: 'id' },
  { id: 160, tabla: 'poblacion', transform: transformGenerico, truncate: true },
  { id: 157, tabla: 'poblacion_barrios', transform: transformGenerico, truncate: true },
  { id: 550, tabla: 'inversiones', transform: transformInversiones, conflictColumns: 'codigo' },
  { id: 658, tabla: 'multas_trafico', transform: transformMultas, truncate: true },
  { id: 659, tabla: 'multas_trafico', transform: transformMultas, appendOnly: true },
  { id: 660, tabla: 'multas_trafico', transform: transformMultas, appendOnly: true },
  { id: 661, tabla: 'multas_trafico', transform: transformMultas, appendOnly: true },
  { id: 448, tabla: 'incidencias_urbanas', transform: transformIncidencias, conflictColumns: 'codigo' },
]

function extractRows(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const values = Object.values(payload as Record<string, unknown>)
    for (const value of values) {
      if (Array.isArray(value)) return value
    }
    for (const value of values) {
      const nestedRows = extractRows(value)
      if (nestedRows.length > 0) return nestedRows
    }
  }
  if (payload == null) return []
  return [payload]
}

function toNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '' || trimmed.toUpperCase() === 'N/A') return null
    const parsed = Number(trimmed.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  return null
}

function toInt(value: unknown): number | null {
  const num = toNumber(value)
  return num === null ? null : Math.trunc(num)
}

function toText(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function toReadingTimestamp(fechaValue: unknown, periodoValue: unknown): string {
  const fallback = new Date().toISOString()
  const fecha = toText(fechaValue)
  if (!fecha) return fallback

  const date = new Date(`${fecha}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return fallback

  const periodo = toInt(periodoValue)
  if (periodo !== null) {
    const hour = Math.min(23, Math.max(0, periodo - 1))
    date.setUTCHours(hour, 0, 0, 0)
  }

  return date.toISOString()
}

function transformAire(raw: any[]) {
  return raw.map(r => ({
    estacion: toInt(r.ESTACION ?? r.estacion),
    fecha: toReadingTimestamp(r.FECHA ?? r.fecha, r.PERIODO ?? r.periodo),
    no2: toInt(r.NO2 ?? r.no2),
    o3: toInt(r.O3 ?? r.o3),
    co: toNumber(r.CO ?? r.co),
    pm10: toNumber(r.PM10 ?? r.pm10),
    pm25: toNumber(r['PM2.5'] ?? r.pm25),
    latitud: toNumber(r.LATITUD ?? r.latitud),
    longitud: toNumber(r.LONGITUD ?? r.longitud),
  }))
}

function transformEstaciones(raw: any[]) {
  return raw.map(r => ({
    id: toInt(r.ID ?? r.id),
    titulo: toText(r.TITULO ?? r.titulo ?? r['título']),
    direccion: toText(r.DIRECCION ?? r.direccion),
    latitud: toNumber(r.LATITUD ?? r.latitud),
    longitud: toNumber(r.LONGITUD ?? r.longitud),
  }))
}

function transformGenerico(raw: any[]) {
  return raw.map(r => ({ datos: r, fecha: new Date().toISOString() }))
}

// UTM ETRS89 zona 30N → WGS84 (válido para Asturias)
function utmToWgs84(eStr: unknown, nStr: unknown): { lat: number | null; lon: number | null } {
  if (!eStr || !nStr) return { lat: null, lon: null }
  const e = parseFloat(String(eStr).replace(',', '.'))
  const n = parseFloat(String(nStr).replace(',', '.'))
  if (!isFinite(e) || !isFinite(n)) return { lat: null, lon: null }

  const a = 6378137.0
  const f = 1 / 298.257223563
  const b = a * (1 - f)
  const e2 = (a * a - b * b) / (a * a)
  const e1sq = (a * a - b * b) / (b * b)
  const k0 = 0.9996
  const E0 = 500000.0
  const lon0 = -3.0 * Math.PI / 180

  const x = e - E0
  const y = n
  const M = y / k0
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256))
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))
  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu)
    + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu)
    + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu)

  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1))
  const T1 = Math.tan(phi1) * Math.tan(phi1)
  const C1 = e1sq * Math.cos(phi1) * Math.cos(phi1)
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5)
  const D = x / (N1 * k0)

  const lat = phi1
    - (N1 * Math.tan(phi1) / R1) * (D * D / 2
      - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e1sq) * D * D * D * D / 24
      + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e1sq - 3 * C1 * C1) * D * D * D * D * D * D / 720)

  const lon = lon0 + (D
    - (1 + 2 * T1 + C1) * D * D * D / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e1sq + 24 * T1 * T1) * D * D * D * D * D / 120
  ) / Math.cos(phi1)

  return {
    lat: parseFloat((lat * 180 / Math.PI).toFixed(6)),
    lon: parseFloat((lon * 180 / Math.PI).toFixed(6)),
  }
}

function transformMultas(raw: any[]) {
  return raw.map(r => ({
    anio:             toInt(r['aÑo'] ?? r.anio ?? r.año),
    mes:              toText(String(r.mes ?? '')),
    dia:              toText(String(r.dia ?? '')),
    hora:             toText(r.hora),
    tipo:             toText(r.tipo),
    calificacion:     toText(r.calificacion),
    lugar:            toText(r.lugar),
    infraccion:       toText(r.infraccion),
    importe:          toInt(r.importe),
    puntos:           toInt(r.puntos),
    velocidad:        toInt(r.velocidad),
    velocidad_limite: toInt(r.velocidad_limite),
    latitud:          toNumber(String(r.latitud ?? '').replace(',', '.')),
    longitud:         toNumber(String(r.longitud ?? '').replace(',', '.')),
  })).filter(r => r.anio !== null)
}

function transformIncidencias(raw: any[]) {
  return raw.map(r => {
    // En el JSON: campo "longitud" = easting UTM, campo "latitud" = northing UTM
    const { lat, lon } = utmToWgs84(r.longitud, r.latitud)
    const rawFecha = toText(r.fecha) ?? ''
    const parts = rawFecha.split('/')
    const fecha = parts.length === 3
      ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      : null
    return {
      codigo:   toText(r.codigo),
      tipo:     toText(r.tipo),
      estado:   toText(r.estado),
      latitud:  lat,
      longitud: lon,
      fecha,
    }
  }).filter(r => r.codigo !== null)
}

// Convierte "27/12/16" → "2016-12-27". Asume siglo 20XX (yy<70) o 19XX.
function toDate(value: unknown): string | null {
  const s = toText(value)
  if (!s) return null
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const [d, m, yy] = parts
  if (!d || !m || !yy) return null
  const yyNum = parseInt(yy, 10)
  if (!Number.isFinite(yyNum)) return null
  const year = yy.length === 2 ? (yyNum < 70 ? 2000 + yyNum : 1900 + yyNum) : yyNum
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function transformInversiones(raw: any[]) {
  return raw.map(r => ({
    codigo:                    toText(r.codigo),
    entidad:                   toText(r.entidad),
    responsable:               toText(r.responsable),
    objeto:                    toText(r.objeto),
    descripcion:               toText(r.descripcion),
    adjudicatario:             toText(r.adjudicatario)?.replace(/^-+$/, '').trim() || null,
    aplicacion_presupuestaria: toText(r.aplicacion_presupuestaria),
    numero_expediente:         toText(r.numero_expediente),
    ejercicio_presupuestario:  toText(r.ejercicio_presupuestario),
    estado_actual:             toText(r.estado_actual),
    url_portal_contratante:    toText(r.url_portal_contratante),
    importe_presupuestado:     toNumber(r.importe_presupuestado),
    importe_adjudicacion:      toNumber(r.importe_adjudicacion),
    presupuesto_licitacion:    toNumber(r.presupuesto_licitacion),
    importe_modificacion:      toNumber(r.importe_modificacion),
    plazo_ejecucion:           toText(r.plazo_ejecucion ?? r['plazo_ejecuciÓn']),
    fecha_aprobacion:          toDate(r.fecha_aprobacion),
    fecha_redaccion_proyecto:  toDate(r.fecha_redaccion_proyecto),
    fecha_licitacion:          toDate(r.fecha_licitacion),
    fecha_adjudicacion:        toDate(r.fecha_adjudicacion),
    fecha_inicio_ejecucion:    toDate(r.fecha_inicio_ejecucion),
    fecha_finalizacion:        toDate(r.fecha_finalizacion),
    fecha_paralizacion:        toDate(r.fecha_paralizacion),
    latitud:                   toNumber(r.latitud),
    longitud:                  toNumber(r.longitud),
  })).filter(r => r.codigo !== null)
}

const BATCH = 500

async function insertBatch(tabla: string, rows: any[]) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await supabase.from(tabla).insert(chunk)
    if (error) throw error
  }
}

async function upsertBatch(tabla: string, rows: any[], conflictColumns: string) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await supabase.from(tabla).upsert(chunk, {
      onConflict: conflictColumns,
      ignoreDuplicates: false,
    })
    if (error) throw error
  }
}

async function ingestar(dataset: typeof DATASETS[0]) {
  const res = await fetch(`${BASE}${dataset.id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} para id=${dataset.id}`)
  const raw = await res.json()
  const rawRows = extractRows(raw)
  if (rawRows.length === 0) {
    console.log(`- ${dataset.tabla}: 0 filas`)
    return
  }
  const rows = dataset.transform(rawRows)

  if (dataset.truncate) {
    const { error: delError } = await supabase.from(dataset.tabla).delete().gte('id', 1)
    if (delError) throw delError
    await insertBatch(dataset.tabla, rows)
  } else if (dataset.appendOnly) {
    await insertBatch(dataset.tabla, rows)
  } else {
    await upsertBatch(dataset.tabla, rows, dataset.conflictColumns!)
  }

  console.log(`✓ ${dataset.tabla}: ${rows.length} filas`)
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const ids = url.searchParams.get('ids')
  const subset = ids
    ? DATASETS.filter(d => ids.split(',').map(Number).includes(d.id))
    : DATASETS

  const errores: string[] = []
  for (const dataset of subset) {
    try { await ingestar(dataset) }
    catch (e: any) { errores.push(`${dataset.tabla}[${dataset.id}]: ${e.message}`); console.error(e) }
  }
  return new Response(JSON.stringify({ ok: errores.length === 0, errores }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
