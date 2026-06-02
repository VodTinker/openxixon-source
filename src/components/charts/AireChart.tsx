import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { FONT, SERIES_CONFIG, useChartTheme, usePrefersReducedMotion, PixelTooltip, PixelDot, FilterBar } from './shared'
import type { TimeRange } from './shared'

interface StationData {
  labels: string[]
  timestamps: string[]
  no2: (number | null)[]
  o3: (number | null)[]
  pm10: (number | null)[]
  pm25: (number | null)[]
}

interface AireChartProps {
  byStation: Record<string, StationData>
  stationIds: string[]
  stationNames: Record<string, string>
}

const RANGE_OPTIONS = [
  { key: '24h', label: '24h' },
  { key: '7d',  label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'all', label: 'todo' },
]

const RANGE_MS: Record<string, number> = {
  '24h': 24 * 3_600_000,
  '7d':  7  * 86_400_000,
  '30d': 30 * 86_400_000,
}

function sliceByRange(d: StationData, range: TimeRange): StationData {
  if (range === 'all' || !d.timestamps.length) return d
  const cutoff = Date.now() - RANGE_MS[range]
  const start = d.timestamps.findIndex(t => new Date(t).getTime() >= cutoff)
  if (start === -1) return { ...d, labels: [], timestamps: [], no2: [], o3: [], pm10: [], pm25: [] }
  return {
    labels:     d.labels.slice(start),
    timestamps: d.timestamps.slice(start),
    no2:        d.no2.slice(start),
    o3:         d.o3.slice(start),
    pm10:       d.pm10.slice(start),
    pm25:       d.pm25.slice(start),
  }
}

export default function AireChart({ byStation, stationIds, stationNames }: AireChartProps) {
  const [activeStation, setActiveStation] = useState(stationIds[0] ?? '')
  const [activeRange, setActiveRange] = useState<TimeRange>('all')
  const [activeSeries, setActiveSeries] = useState<string[]>(SERIES_CONFIG.map(s => s.key))
  const theme = useChartTheme()
  const reducedMotion = usePrefersReducedMotion()

  const filtered = useMemo(() => {
    const d = byStation[activeStation]
    return d ? sliceByRange(d, activeRange) : null
  }, [byStation, activeStation, activeRange])

  const chartData = useMemo(() => {
    if (!filtered) return []
    return filtered.labels.map((label, i) => ({
      label,
      no2:  filtered.no2[i]  ?? null,
      o3:   filtered.o3[i]   ?? null,
      pm10: filtered.pm10[i] ?? null,
      pm25: filtered.pm25[i] ?? null,
    }))
  }, [filtered])

  if (!stationIds.length) return null

  const xInterval = chartData.length > 8 ? Math.floor(chartData.length / 8) - 1 : 0
  const stationName = stationNames[activeStation] ?? activeStation

  return (
    <div>
      {/* Controls */}
      <div style={{ marginBottom: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {stationIds.length > 1 && (
          <FilterBar
            options={stationIds.map(id => ({ key: id, label: stationNames[id] ?? id }))}
            active={[activeStation]}
            onChange={([k]) => setActiveStation(k)}
            single
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <FilterBar
            options={RANGE_OPTIONS}
            active={[activeRange]}
            onChange={([k]) => setActiveRange(k as TimeRange)}
            single
          />
          <FilterBar
            options={SERIES_CONFIG.map(s => ({ key: s.key, label: s.label, color: s.color }))}
            active={activeSeries}
            onChange={setActiveSeries}
          />
        </div>
      </div>

      {/* Chart */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem' }}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="1 3" stroke={theme.border + '66'} />
            <XAxis
              dataKey="label"
              tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
              tickLine={false}
              axisLine={{ stroke: theme.border }}
              interval={xInterval}
            />
            <YAxis
              tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
              tickLine={false}
              axisLine={{ stroke: theme.border }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--accent)', strokeDasharray: '1 3', strokeWidth: 1 }}
              content={(props: any) => <PixelTooltip {...props} unit="µg/m³" />}
            />
            {SERIES_CONFIG.map(s => (
              <Line
                key={s.key}
                type="stepAfter"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={(props: any) => <PixelDot cx={props.cx} cy={props.cy} fill={s.color} />}
                hide={!activeSeries.includes(s.key)}
                connectNulls
                isAnimationActive={!reducedMotion}
                animationDuration={600}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Caption */}
      <div style={{
        padding: '0.5rem 0.75rem', fontSize: '0.625rem', color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)', background: 'var(--surface)',
        fontFamily: FONT, letterSpacing: '0.05em',
      }}>
        µg/m³ · {stationName} · {chartData.length} lecturas
      </div>
    </div>
  )
}
