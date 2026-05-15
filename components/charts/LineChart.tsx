'use client'

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Series {
  key: string
  label: string
  color: string
}

interface Props {
  data: Record<string, unknown>[]
  series: Series[]
  xKey?: string
  height?: number
  formatY?: (v: number) => string
  formatTooltip?: (v: number, key: string) => string
}

function formatDate(d: string) {
  try {
    return format(parseISO(d), 'd MMM', { locale: es })
  } catch {
    return d
  }
}

export default function LineChart({
  data,
  series,
  xKey = 'fecha',
  height = 260,
  formatY,
  formatTooltip,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey={xKey}
          tickFormatter={formatDate}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1f2937' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatY}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 6 }}
          labelStyle={{ color: '#9ca3af', fontSize: 12 }}
          itemStyle={{ fontSize: 12 }}
          labelFormatter={formatDate}
          formatter={(value: number, name: string) =>
            formatTooltip ? [formatTooltip(value, name), name] : [value, name]
          }
        />
        {series.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
            iconType="circle"
            iconSize={8}
          />
        )}
        {series.map(s => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  )
}
