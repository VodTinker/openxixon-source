import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { FONT, BARRIO_COLORS, useChartTheme, usePrefersReducedMotion, PixelTooltip, PixelBar, FilterBar } from './shared'

// ── BarriosChart ──────────────────────────────────────────────────────────────

interface Barrio { nombre: string; total: number }

interface BarriosChartProps {
  barrios: Barrio[]
  total: number
}

export function BarriosChart({ barrios, total }: BarriosChartProps) {
  const theme = useChartTheme()
  const reducedMotion = usePrefersReducedMotion()
  const top20 = useMemo(() => barrios.slice(0, 20), [barrios])

  if (!barrios.length) {
    return (
      <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '2rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontFamily: FONT, fontSize: '0.8125rem', color: 'var(--text-dim)', margin: 0, letterSpacing: '0.04em' }}>Sin datos de barrios disponibles.</p>
      </div>
    )
  }

  const tooltipContent = (props: any) => {
    if (!props.active || !props.payload?.length) return null
    const val: number = props.payload[0]?.value ?? 0
    const pct = total > 0 ? ((val / total) * 100).toFixed(2) : '0'
    return (
      <div style={{
        position: 'relative',
        border: '1px solid var(--border)',
        outline: '2px solid var(--border-mid)',
        outlineOffset: '-3px',
        background: 'var(--bg)',
        padding: '8px 12px',
        fontFamily: FONT,
        fontSize: '10px',
        lineHeight: 1.8,
        pointerEvents: 'none',
      }}>
        <span style={{ position: 'absolute', width: 4, height: 4, background: 'var(--accent)', top: 0, left: 0 }} />
        <span style={{ position: 'absolute', width: 4, height: 4, background: 'var(--accent)', top: 0, right: 0 }} />
        <span style={{ position: 'absolute', width: 4, height: 4, background: 'var(--accent)', bottom: 0, left: 0 }} />
        <span style={{ position: 'absolute', width: 4, height: 4, background: 'var(--accent)', bottom: 0, right: 0 }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '9px', marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {props.label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
          <span style={{ color: theme.accent }}>Habitantes</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{val.toLocaleString('es-ES')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>% total</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{pct}%</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem 1.25rem 1.25rem 0' }}>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          layout="vertical"
          data={top20}
          margin={{ top: 0, right: 16, bottom: 0, left: 12 }}
        >
          <CartesianGrid strokeDasharray="1 3" stroke={theme.border + '66'} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
            tickFormatter={(v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v)}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={125}
            tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={tooltipContent} cursor={{ fill: theme.border + '22' }} />
          <Bar
            dataKey="total"
            name="Habitantes"
            radius={0}
            shape={(props: any) => <PixelBar {...props} />}
            isAnimationActive={!reducedMotion}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {top20.map((_, i) => {
              const color = BARRIO_COLORS[i % BARRIO_COLORS.length]
              return <Cell key={i} fill={color + '55'} stroke={color} strokeWidth={1} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── PiramideChart ─────────────────────────────────────────────────────────────

interface PyramidRow { grupo: string; muj: number; var: number }

interface PiramideChartProps {
  pyramid: PyramidRow[]
}

export function PiramideChart({ pyramid }: PiramideChartProps) {
  const [activeSeries, setActiveSeries] = useState(['var', 'muj'])
  const theme = useChartTheme()
  const reducedMotion = usePrefersReducedMotion()

  const data = useMemo(() =>
    pyramid.map(r => ({ grupo: r.grupo, varones: -r.var, mujeres: r.muj })),
    [pyramid]
  )

  const maxVal = useMemo(() =>
    pyramid.length ? Math.max(...pyramid.map(r => Math.max(r.var, r.muj))) : 1000,
    [pyramid]
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <FilterBar
          options={[
            { key: 'var', label: 'Varones', color: theme.sky },
            { key: 'muj', label: 'Mujeres', color: theme.lavender },
          ]}
          active={activeSeries}
          onChange={setActiveSeries}
        />
      </div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem 1.25rem 1.25rem 0' }}>
        <ResponsiveContainer width="100%" height={480}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 16, bottom: 0, left: 12 }}
          >
            <CartesianGrid strokeDasharray="1 3" stroke={theme.border + '66'} horizontal={false} />
            <XAxis
              type="number"
              domain={[-maxVal * 1.1, maxVal * 1.1]}
              tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
              tickLine={false}
              axisLine={{ stroke: theme.border }}
              tickFormatter={(v: number) => Math.abs(v) >= 1000
                ? (Math.abs(v) / 1000).toFixed(0) + 'k'
                : String(Math.abs(v))}
            />
            <YAxis
              type="category"
              dataKey="grupo"
              width={52}
              tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={(props: any) => <PixelTooltip {...props} />}
              cursor={{ fill: theme.border + '22' }}
            />
            <Bar
              dataKey="varones"
              name="Varones"
              fill={theme.sky + '55'}
              stroke={theme.sky}
              strokeWidth={1}
              radius={0}
              hide={!activeSeries.includes('var')}
              shape={(props: any) => <PixelBar {...props} fill={theme.sky + '55'} stroke={theme.sky} />}
              isAnimationActive={!reducedMotion}
              animationDuration={500}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="mujeres"
              name="Mujeres"
              fill={theme.lavender + '55'}
              stroke={theme.lavender}
              strokeWidth={1}
              radius={0}
              hide={!activeSeries.includes('muj')}
              shape={(props: any) => <PixelBar {...props} fill={theme.lavender + '55'} stroke={theme.lavender} />}
              isAnimationActive={!reducedMotion}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
