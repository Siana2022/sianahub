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
    ? 'bg-[#edf7f2] text-[#1a7a4a]'
    : bad
    ? 'bg-[#fef0ed] text-[#e8321a]'
    : 'bg-[#fef8ed] text-[#d4820a]'

  return (
    <div className={`p-5 ${highlight ? 'bg-[#1a1a18]' : 'bg-white'}`}>
      <p className={`font-mono text-[9px] tracking-[2px] uppercase mb-2 ${highlight ? 'text-white/40' : 'text-[#9a9a8e]'}`}>
        {label}
      </p>
      <p className={`font-display text-[32px] font-black leading-none ${
        accent ? 'text-[#e8321a]' : highlight ? 'text-white' : 'text-[#1a1a18]'
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
