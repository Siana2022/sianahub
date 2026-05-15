import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

const clienteTabs = [
  { href: '', label: 'Resumen' },
  { href: '/leads', label: 'Leads' },
  { href: '/procedencia', label: 'Procedencia' },
  { href: '/trafico', label: 'Tráfico' },
  { href: '/organico', label: 'Orgánico' },
  { href: '/meta', label: 'Meta Ads' },
  { href: '/google-ads', label: 'Google Ads' },
  { href: '/gtm', label: 'GTM' },
  { href: '/metricas-custom', label: 'Métricas custom' },
  { href: '/ia', label: 'IA' },
]

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="text-white text-sm font-mono">{value}</p>
    </div>
  )
}

export default async function ClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>
}) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single()

  if (error || !cliente) notFound()

  const estadoColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    churned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title={cliente.nombre} />

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {clienteTabs.map((tab) => {
            const href = `/clientes/${clienteId}${tab.href}`
            const isActive = tab.href === ''
            return (
              <Link
                key={tab.href}
                href={href}
                className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-white text-lg font-semibold">{cliente.nombre}</h2>
              <Badge className={`text-xs border ${estadoColors[cliente.estado as keyof typeof estadoColors]}`}>
                {cliente.estado === 'active' ? 'Activo' : cliente.estado === 'paused' ? 'Pausado' : 'Churn'}
              </Badge>
            </div>
            {cliente.dominio && (
              <a
                href={`https://${cliente.dominio}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm hover:underline"
              >
                {cliente.dominio}
              </a>
            )}
          </div>
          <Link href={`/clientes/${clienteId}/editar`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'border-gray-700 text-gray-300 hover:text-white')}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </Link>
        </div>

        {/* IDs de plataformas */}
        <div className="grid grid-cols-2 gap-6">
          {/* Google */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
            <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">Google</h3>
            <Field label="GA4 Property ID" value={cliente.ga4_property_id} />
            <Field label="GA4 Account ID" value={cliente.ga4_account_id} />
            <Field label="Google Ads Customer ID" value={cliente.gads_customer_id} />
            <Field label="GSC Site URL" value={cliente.gsc_site_url} />
            <Field label="GTM Container ID" value={cliente.gtm_container_id} />
            <Field label="GTM Account ID" value={cliente.gtm_account_id} />
          </div>

          {/* Meta */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
            <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">Meta</h3>
            <Field label="Ad Account ID" value={cliente.meta_ad_account_id} />
            <Field label="Pixel ID" value={cliente.meta_pixel_id} />
          </div>

          {/* sGTM */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
            <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">sGTM / GCP</h3>
            <Field label="sGTM URL" value={cliente.sgtm_url} />
            <Field label="Service Name" value={cliente.sgtm_service_name} />
            <Field label="GCP Project ID" value={cliente.gcp_project_id} />
          </div>

          {/* Config */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
            <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">Configuración</h3>
            <Field label="Slack Channel" value={cliente.slack_channel_id} />
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Google Ads vía MCC</p>
              <p className={`text-sm font-medium ${cliente.gads_via_mcc ? 'text-green-400' : 'text-yellow-400'}`}>
                {cliente.gads_via_mcc ? 'Sí' : 'No — token propio'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Alertas activas</p>
              <p className={`text-sm font-medium ${cliente.alertas_activas ? 'text-green-400' : 'text-gray-500'}`}>
                {cliente.alertas_activas ? 'Sí' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {cliente.notas && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium mb-2">Notas</h3>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{cliente.notas}</p>
          </div>
        )}
      </div>
    </div>
  )
}
