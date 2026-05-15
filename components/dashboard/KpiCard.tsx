import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  prev?: string | number
  delta?: number
  prefix?: string
  suffix?: string
  invertColors?: boolean
}

function deltaPct(current: number, prev: number) {
  if (!prev) return 0
  return ((current - prev) / Math.abs(prev)) * 100
}

export default function KpiCard({ label, value, prev, delta, prefix = '', suffix = '', invertColors = false }: Props) {
  const pct = delta !== undefined
    ? delta
    : (prev !== undefined ? deltaPct(Number(value), Number(prev)) : undefined)

  const isPositive = pct !== undefined && pct > 0
  const isNegative = pct !== undefined && pct < 0
  const isNeutral = pct === undefined || pct === 0

  // invertColors: para métricas donde bajar es bueno (CPL, CPC, bounce rate)
  const colorPositive = invertColors ? 'text-red-400' : 'text-green-400'
  const colorNegative = invertColors ? 'text-green-400' : 'text-red-400'

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">
        {prefix}{typeof value === 'number' ? value.toLocaleString('es-ES') : value}{suffix}
      </p>
      {pct !== undefined && !isNeutral && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs ${isPositive ? colorPositive : colorNegative}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isPositive ? '+' : ''}{pct.toFixed(1)}% vs mes anterior</span>
        </div>
      )}
      {isNeutral && pct === 0 && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
          <Minus className="w-3 h-3" />
          <span>Sin cambios</span>
        </div>
      )}
    </div>
  )
}
