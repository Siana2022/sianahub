'use client'

import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import type { ResolvedMetric } from '@/lib/mock/custom'
import { formulaToString, formatMetricValue } from '@/lib/mock/custom'

type Props = {
  grupo: string
  metrics: ResolvedMetric[]
}

function delta(current: number, prev: number) {
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

export default function MetricGroupSection({ grupo, metrics }: Props) {
  return (
    <div>
      {/* Group header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-[9px] tracking-[2px] uppercase text-[#9a9a8e]">{grupo}</span>
        <div className="flex-1 h-px bg-[#e2dfd8]" />
        <span className="bg-[#1a1a18] text-white font-mono text-[8px] px-1.5 py-0.5 tracking-wide uppercase">
          custom
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#e2dfd8] border border-[#e2dfd8]">
        {metrics.map(({ definition: def, current, prev, daily }) => {
          const d = delta(current, prev)
          const good = d !== null && (def.invertir_colores ? d < 0 : d >= 0)
          const bad  = d !== null && (def.invertir_colores ? d >= 0 : d < 0)
          const color = def.invertir_colores ? '#e8321a' : '#e8321a'

          const deltaClass = good
            ? 'bg-[#edf7f2] text-[#1a7a4a]'
            : bad
            ? 'bg-[#fef0ed] text-[#e8321a]'
            : 'bg-[#fef8ed] text-[#d4820a]'

          return (
            <div key={def.id} className="bg-white p-4 space-y-2">
              <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e]">
                {def.nombre_visible}
              </p>
              <div className="flex items-end justify-between gap-2">
                <p className="font-display text-2xl font-black text-[#1a1a18] leading-none">
                  {formatMetricValue(current, def.unidad)}
                </p>
                {d !== null && (
                  <span className={`font-mono text-[9px] font-medium px-1.5 py-0.5 mb-0.5 ${deltaClass}`}>
                    {d >= 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Sparkline */}
              <div className="h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`g-${def.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke={color}
                      strokeWidth={1.5}
                      fill={`url(#g-${def.id})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {def.tipo === 'formula' && def.formula && (
                <p className="font-mono text-[9px] text-[#9a9a8e] truncate" title={formulaToString(def.formula)}>
                  {formulaToString(def.formula)}
                </p>
              )}
              {def.tipo === 'event_count' && def.event_name && (
                <p className="font-mono text-[9px] text-[#9a9a8e] truncate">
                  {def.event_name}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
