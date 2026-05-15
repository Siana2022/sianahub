'use client'

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface Props {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  color?: string
  height?: number
  formatY?: (v: number) => string
  formatTooltip?: (v: number) => string
  horizontal?: boolean
}

export default function BarChart({
  data,
  xKey,
  yKey,
  color = '#3b82f6',
  height = 260,
  formatY,
  formatTooltip,
  horizontal = false,
}: Props) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatY}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 6 }}
            labelStyle={{ color: '#9ca3af', fontSize: 12 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(v: number) => [formatTooltip ? formatTooltip(v) : v, yKey]}
          />
          <Bar dataKey={yKey} radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} opacity={1 - i * 0.07} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1f2937' }}
          tickLine={false}
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
          formatter={(v: number) => [formatTooltip ? formatTooltip(v) : v]}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  )
}
