'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#F7415C', '#1a4fa0', '#1a7a4a', '#d4820a', '#888888', '#555555']

interface DataItem { name: string; value: number }

interface Props {
  data: DataItem[]
  height?: number
  formatValue?: (v: number) => string
}

export default function DonutChart({ data, height = 220, formatValue }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 0, fontSize: 12 }}
          itemStyle={{ fontSize: 12 }}
          formatter={(v: number) => [formatValue ? formatValue(v) : v]}
        />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#888888', fontFamily: 'monospace' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
