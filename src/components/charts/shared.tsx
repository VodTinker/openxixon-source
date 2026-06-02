import { useState, useEffect } from 'react'

export const FONT = "'IBM Plex Mono', monospace"

export const SERIES_CONFIG = [
  { key: 'no2',  label: 'NO₂',   color: '#E2A66E' },
  { key: 'o3',   label: 'O₃',    color: '#8AD6FF' },
  { key: 'pm10', label: 'PM10',  color: '#D1B8FF' },
  { key: 'pm25', label: 'PM2.5', color: '#00DB7C' },
]

// Rotating palette for bar charts with many categories (barrios)
export const BARRIO_COLORS = ['#8B5CF6', '#00DB7C', '#8AD6FF', '#D1B8FF', '#E2A66E']

export type TimeRange = '24h' | '7d' | '30d' | 'all'

export interface ChartTheme {
  border: string
  textMuted: string
  surface: string
  accent: string
  sky: string
  lavender: string
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>({
    border: '#2a2a2a', textMuted: '#666', surface: '#141414',
    accent: '#8B5CF6', sky: '#7DD3FC', lavender: '#C4B5FD',
  })
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement)
    const g = (v: string) => cs.getPropertyValue(v).trim()
    setTheme({
      border:    g('--border')     || '#2a2a2a',
      textMuted: g('--text-muted') || '#666',
      surface:   g('--surface')    || '#141414',
      accent:    g('--accent')     || '#8B5CF6',
      sky:       g('--sky')        || '#7DD3FC',
      lavender:  g('--lavender')   || '#C4B5FD',
    })
  }, [])
  return theme
}

export function usePrefersReducedMotion(): boolean {
  const [reduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )
  return reduced
}

// ── PixelBar ──────────────────────────────────────────────────────────────────
// Custom Recharts bar shape: column of 4px blocks with 1px gaps (RPG health bar)

interface PixelBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  stroke?: string
  [key: string]: unknown
}

export function PixelBar({ x = 0, y = 0, width = 0, height = 0, fill = 'transparent', stroke = 'transparent' }: PixelBarProps) {
  const absW = Math.abs(width)
  const absH = Math.abs(height)
  if (absW < 1 || absH < 1) return null

  const blockSize = 4
  const gap = 1
  const unit = blockSize + gap

  // Horizontal bar (pyramid chart): blocks go left or right
  if (absW > absH) {
    const count = Math.max(1, Math.floor(absW / unit))
    const blocks: React.ReactElement[] = []
    const startX = width < 0 ? x + width : x
    for (let i = 0; i < count; i++) {
      const bx = width < 0
        ? startX + absW - (i + 1) * unit
        : startX + i * unit
      blocks.push(
        <rect key={i} x={bx} y={y + 1} width={blockSize} height={Math.max(0, absH - 2)}
          fill={fill} stroke={stroke} strokeWidth={0.5} />
      )
    }
    return <g>{blocks}</g>
  }

  // Vertical bar (standard bar chart): blocks stack bottom to top
  const count = Math.max(1, Math.floor(absH / unit))
  const blocks: React.ReactElement[] = []
  for (let i = 0; i < count; i++) {
    const by = y + absH - (i + 1) * unit
    blocks.push(
      <rect key={i} x={x + 1} y={by} width={Math.max(0, absW - 2)} height={blockSize}
        fill={fill} stroke={stroke} strokeWidth={0.5} />
    )
  }
  return <g>{blocks}</g>
}

// ── PixelDot ──────────────────────────────────────────────────────────────────
// 4×4px square dot for active points on line charts

interface PixelDotProps {
  cx?: number
  cy?: number
  fill?: string
  [key: string]: unknown
}

export function PixelDot({ cx = 0, cy = 0, fill = 'white' }: PixelDotProps) {
  return <rect x={cx - 2} y={cy - 2} width={4} height={4} fill={fill} />
}

// ── PixelTooltip ──────────────────────────────────────────────────────────────
// NES dialog box: double border + accent corner squares

interface TooltipEntry {
  dataKey?: string | number
  name?: string
  value?: number | null
  color?: string
}

interface PixelTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  unit?: string
}

export function PixelTooltip({ active, payload, label, unit }: PixelTooltipProps) {
  if (!active || !payload?.length) return null
  const visible = payload.filter(e => e.value !== null && e.value !== undefined)
  if (!visible.length) return null

  return (
    <div style={{
      position: 'relative',
      border: '2px solid var(--accent)',
      background: '#0a0a0a',
      padding: '10px 14px 10px 14px',
      fontFamily: FONT,
      fontSize: '11px',
      lineHeight: 2,
      pointerEvents: 'none',
      minWidth: '11rem',
      boxShadow: '0 0 0 1px #000, 4px 4px 0 rgba(139,92,246,0.35)',
    }}>
      {/* NES corner markers */}
      {(['top:0,left:0','top:0,right:0','bottom:0,left:0','bottom:0,right:0'] as const).map((pos, i) => {
        const [v, h] = pos.split(',')
        const [vk, vv] = v.split(':')
        const [hk, hv] = h.split(':')
        return <span key={i} style={{ position: 'absolute', width: 5, height: 5, background: 'var(--accent)', [vk]: vv, [hk]: hv }} />
      })}

      {label && (
        <div style={{
          color: '#fff',
          fontSize: '10px',
          marginBottom: '6px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(139,92,246,0.3)',
          paddingBottom: '4px',
        }}>
          {label}
        </div>
      )}
      {visible.map((e, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {e.color && <span style={{ display: 'inline-block', width: 6, height: 6, background: e.color, flexShrink: 0 }} />}
            <span style={{ color: '#ccc' }}>{e.name}</span>
          </span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '12px' }}>
            {typeof e.value === 'number' ? Math.abs(e.value).toLocaleString('es-ES') : e.value}
            {unit ? <span style={{ color: '#888', fontWeight: 400, fontSize: '10px' }}> {unit}</span> : null}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── FilterBar ─────────────────────────────────────────────────────────────────

export interface FilterOption { key: string; label: string; color?: string }

interface FilterBarProps {
  options: FilterOption[]
  active: string[]
  onChange: (keys: string[]) => void
  single?: boolean
}

export function FilterBar({ options, active, onChange, single }: FilterBarProps) {
  const toggle = (key: string) => {
    if (single) { onChange([key]); return }
    if (active.includes(key)) {
      if (active.length > 1) onChange(active.filter(k => k !== key))
    } else {
      onChange([...active, key])
    }
  }
  return (
    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const isActive = active.includes(opt.key)
        const c = opt.color
        return (
          <button
            key={opt.key}
            className={`filter-btn${isActive ? ' active' : ''}`}
            style={isActive && c ? { background: c, borderColor: c, color: '#fff' }
              : !isActive && c ? { borderColor: c + '66', color: c } : undefined}
            onClick={() => toggle(opt.key)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
