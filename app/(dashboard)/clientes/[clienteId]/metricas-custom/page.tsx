import Link from 'next/link'
import { Settings } from 'lucide-react'
import { mockResolvedMetrics, type ResolvedMetric } from '@/lib/mock/custom'
import MetricGroupSection from '@/components/custom/MetricGroupSection'

export default function MetricasCustomPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const resolved = mockResolvedMetrics()

  const groups: Record<string, ResolvedMetric[]> = {}
  for (const m of resolved) {
    const g = m.definition.grupo
    if (!groups[g]) groups[g] = []
    groups[g].push(m)
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Métricas y fórmulas personalizadas para este cliente</p>
        <Link
          href="metricas-custom/configurar"
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md transition-colors"
        >
          <Settings size={13} />
          Configurar métricas
        </Link>
      </div>

      {Object.entries(groups).map(([grupo, metrics]) => (
        <MetricGroupSection
          key={grupo}
          grupo={grupo}
          metrics={metrics}
        />
      ))}
    </div>
  )
}
