import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { FONT, useChartTheme, usePrefersReducedMotion, PixelTooltip, PixelBar } from './shared'

interface MultasChartProps {
  data: { label: string; value: number }[]
  color?: string
  unit?: string
}

export default function MultasChart({ data, color = '#E2A66E', unit }: MultasChartProps) {
  const theme = useChartTheme()
  const reducedMotion = usePrefersReducedMotion()

  if (!data.length) return null

  const fill = color + '33'

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem 1.25rem 0.5rem' }}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 30, left: -8 }}>
          <CartesianGrid strokeDasharray="1 3" stroke={theme.border + '66'} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
          />
          <YAxis
            tick={{ fontFamily: FONT, fontSize: 9, fill: theme.textMuted }}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
          />
          <Tooltip
            cursor={{ fill: color + '12' }}
            content={(props: any) => <PixelTooltip {...props} unit={unit} />}
          />
          <Bar
            dataKey="value"
            name="Cantidad"
            fill={fill}
            stroke={color}
            strokeWidth={1}
            shape={(props: any) => <PixelBar {...props} fill={fill} stroke={color} />}
            isAnimationActive={!reducedMotion}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
