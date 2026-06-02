export type Point = { x: number; y: number; v: number }

export type SparkData = {
  line: string
  area: string
  last: number | null
  delta: number | null
  min: number
  max: number
  points: Point[]
}

export const SPARK_W = 200
export const SPARK_H = 56

export function buildSpark(values: unknown[]): SparkData {
  const nums = values
    .map(v => (v == null ? null : Number(v)))
    .filter((v): v is number => v !== null && !Number.isNaN(v))
  if (nums.length === 0) {
    return { line: '', area: '', last: null, delta: null, min: 0, max: 0, points: [] }
  }
  const ordered = [...nums].reverse()
  const max = Math.max(...ordered)
  const min = Math.min(...ordered)
  const range = max - min || 1
  const step = ordered.length > 1 ? SPARK_W / (ordered.length - 1) : SPARK_W
  const PAD_Y = 6
  const usableH = SPARK_H - PAD_Y * 2
  const points: Point[] = ordered.map((v, i) => ({
    x: i * step,
    y: SPARK_H - PAD_Y - ((v - min) / range) * usableH,
    v,
  }))
  const line = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `0,${SPARK_H} ${line} ${SPARK_W},${SPARK_H}`
  const last = ordered[ordered.length - 1]
  const prev = ordered.length >= 2 ? ordered[ordered.length - 2] : last
  return { line, area, last, delta: last - prev, min, max, points }
}
