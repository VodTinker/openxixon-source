import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { FONT, useChartTheme, usePrefersReducedMotion, PixelTooltip, PixelBar } from './shared'

interface IncidenciasChartProps {
  data: { label: string; value: number }[]
}

export default function IncidenciasChart({ data }: IncidenciasChartProps) {
  const theme = useChartTheme()
  const reducedMotion = usePrefersReducedMotion()

  if (!data.length) return null

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem 1.25rem 0.5rem' }}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 60, left: -8 }}>
          <CartesianGrid strokeDasharray="1 3" stroke={theme.border + '66'} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
          />
          <Tooltip
            cursor={{ fill: '#D1B8FF12' }}
            content={(props: any) => <PixelTooltip {...props} />}
          />
          <Bar
            dataKey="value"
            name="Incidencias"
            fill="#D1B8FF33"
            stroke="#D1B8FF"
            strokeWidth={1}
            shape={(props: any) => <PixelBar {...props} fill="#D1B8FF33" stroke="#D1B8FF" />}
            activeBar={(props: any) => <PixelBar {...props} fill="#D1B8FF66" stroke="#D1B8FF" />}
            isAnimationActive={!reducedMotion}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
