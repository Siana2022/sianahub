'use client'

import {
  LineChart as ReLineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Series { key: string; label: string; color: string }

interface Props {
  data: Record<string, unknown>[]
  series: Series[]
  xKey?: string
  height?: number
  formatY?: (v: number) => string
  formatTooltip?: (v: number, key: string) => string
}

function formatDate(d: string) {
  try { return format(parseISO(d), 'd MMM', { locale: es }) } catch { return d }
}

export default function LineChart({ data, series, xKey = 'fecha', height = 260, formatY, formatTooltip }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis
          dataKey={xKey}
          tickFormatter={formatDate}
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'var(--font-mono, monospace)' }}
          axisLine={{ stroke: '#e8e8e8' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#888888', fontSize: 10, fontFamily: 'var(--font-mono, monospace)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatY}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 0, fontSize: 12 }}
          labelStyle={{ color: '#888888', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.05em' }}
          itemStyle={{ fontSize: 12 }}
          labelFormatter={formatDate}
          formatter={(value: number, name: string) =>
            formatTooltip ? [formatTooltip(value, name), name] : [value, name]
          }
        />
        {series.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 11, color: '#888888', fontFamily: 'monospace' }} iconType="circle" iconSize={7} />
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
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  )
}
