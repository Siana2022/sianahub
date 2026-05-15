'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface DataItem {
  name: string
  value: number
}

interface Props {
  data: DataItem[]
  height?: number
  formatValue?: (v: number) => string
}

export default function DonutChart({ data, height = 220, formatValue }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 6 }}
          itemStyle={{ fontSize: 12 }}
          formatter={(v: number) => [formatValue ? formatValue(v) : v]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
