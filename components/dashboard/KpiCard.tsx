interface Props {
  label: string
  value: string | number
  prev?: string | number
  delta?: number
  invertColors?: boolean
  highlight?: boolean
  accent?: boolean
}

function deltaPct(current: number, prev: number) {
  if (!prev) return 0
  return ((current - prev) / Math.abs(prev)) * 100
}

export default function KpiCard({ label, value, prev, delta, invertColors = false, highlight = false, accent = false }: Props) {
  const pct = delta !== undefined
    ? delta
    : (prev !== undefined ? deltaPct(Number(value), Number(prev)) : undefined)

  const isPositive = pct !== undefined && pct > 0
  const isNegative = pct !== undefined && pct < 0

  // invertColors: CPL, CPC, bounce — down is good
  const good = invertColors ? isNegative : isPositive
  const bad  = invertColors ? isPositive : isNegative

  const deltaClass = good
    ? 'bg-[#edfaf2] text-[#1a7a4a]'
    : bad
    ? 'bg-[#fff0f2] text-[#F7415C]'
    : 'bg-[#fef8ed] text-[#d4820a]'

  return (
    <div className={`p-5 ${highlight ? 'bg-[#000000]' : 'bg-white'}`}>
      <p className={`font-mono text-[11px] tracking-[1px] uppercase font-bold mb-2 ${highlight ? 'text-white/60' : 'text-[#000000]'}`}>
        {label}
      </p>
      <p className={`font-display text-[32px] font-black leading-none ${
        accent ? 'text-[#F7415C]' : highlight ? 'text-white' : 'text-[#000000]'
      }`}>
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
      </p>
      {pct !== undefined && (
        <span className={`inline-flex items-center gap-1 mt-2 font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${deltaClass}`}>
          {isPositive ? '▲' : isNegative ? '▼' : '—'}
          {Math.abs(pct).toFixed(1)}%
        </span>
      )}
    </div>
  )
}
