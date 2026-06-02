import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { FONT, useChartTheme, usePrefersReducedMotion, PixelTooltip, PixelBar } from './shared'

interface InversionesChartProps {
  data: { anio: string; presupuestado: number; adjudicado: number }[]
}

export default function InversionesChart({ data }: InversionesChartProps) {
  const theme = useChartTheme()
  const reducedMotion = usePrefersReducedMotion()

  if (!data.length) return null

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem' }}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="1 3" stroke={theme.border + '66'} vertical={false} />
          <XAxis
            dataKey="anio"
            tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
          />
          <YAxis
            tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
            tickFormatter={(v: number) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v)}
          />
          <Tooltip
            cursor={{ fill: '#8AD6FF12' }}
            content={(props: any) => <PixelTooltip {...props} unit="€" />}
          />
          <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 9 }} />
          <Bar
            dataKey="presupuestado"
            name="Presupuestado"
            fill="#8AD6FF33"
            stroke="#8AD6FF"
            strokeWidth={1}
            shape={(props: any) => <PixelBar {...props} fill="#8AD6FF33" stroke="#8AD6FF" />}
            isAnimationActive={!reducedMotion}
          />
          <Bar
            dataKey="adjudicado"
            name="Adjudicado"
            fill="#00DB7C33"
            stroke="#00DB7C"
            strokeWidth={1}
            shape={(props: any) => <PixelBar {...props} fill="#00DB7C33" stroke="#00DB7C" />}
            isAnimationActive={!reducedMotion}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
