import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { mockCustomDefinitions } from '@/lib/mock/custom'
import MetricasConfiguradorClient from '@/components/custom/MetricasConfiguradorClient'

export default async function ConfigurarMetricasPage({
  params,
}: {
  params: Promise<{ clienteId: string }>
}) {
  const { clienteId } = await params
  const definitions = mockCustomDefinitions()

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/clientes/${clienteId}/metricas-custom`}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-white font-semibold">Configurar métricas custom</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Define eventos GA4 y fórmulas combinando múltiples fuentes
          </p>
        </div>
      </div>

      <MetricasConfiguradorClient clienteId={clienteId} initialDefinitions={definitions} />
    </div>
  )
}
