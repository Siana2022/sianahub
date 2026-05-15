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
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{grupo}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map(({ definition: def, current, prev, daily }) => {
          const d = delta(current, prev)
          const positive = d !== null && (def.invertir_colores ? d < 0 : d >= 0)
          const negative = d !== null && (def.invertir_colores ? d >= 0 : d < 0)
          const color = def.invertir_colores ? '#ef4444' : '#8b5cf6'

          return (
            <div key={def.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-1.5">{def.nombre_visible}</p>
                  <p className="text-2xl font-semibold text-white leading-none">
                    {formatMetricValue(current, def.unidad)}
                  </p>
                </div>
                {d !== null && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap mt-0.5 ${
                      positive
                        ? 'bg-green-500/15 text-green-400'
                        : negative
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {d >= 0 ? '+' : ''}{d.toFixed(1)}%
                  </span>
                )}
              </div>

              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${def.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke={color}
                      strokeWidth={1.5}
                      fill={`url(#grad-${def.id})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {def.tipo === 'formula' && def.formula && (
                <p className="text-[10px] text-gray-600 leading-tight truncate" title={formulaToString(def.formula)}>
                  f: {formulaToString(def.formula)}
                </p>
              )}
              {def.tipo === 'event_count' && def.event_name && (
                <p className="text-[10px] text-gray-600 leading-tight truncate">
                  GA4: {def.event_name}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
