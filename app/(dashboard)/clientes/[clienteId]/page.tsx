import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KpiCard from '@/components/dashboard/KpiCard'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'
import { mockResumen } from '@/lib/mock/metricas'
import type { Cliente } from '@/types/cliente'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="text-white text-sm font-mono">{value}</p>
    </div>
  )
}

export default async function ClienteResumenPage({
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

  const resumen = mockResumen()

  const deltaLeads = ((resumen.total_leads - resumen.total_leads_prev) / Math.abs(resumen.total_leads_prev)) * 100
  const deltaSessions = ((resumen.sessions - resumen.sessions_prev) / Math.abs(resumen.sessions_prev)) * 100

  const c = cliente as Cliente

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-white text-lg font-semibold">{c.nombre}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              c.estado === 'active'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : c.estado === 'paused'
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
            }`}>
              {c.estado === 'active' ? 'Activo' : c.estado === 'paused' ? 'Pausado' : 'Churn'}
            </span>
          </div>
          {c.dominio && (
            <a href={`https://${c.dominio}`} target="_blank" rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline">
              {c.dominio}
            </a>
          )}
        </div>
        <Link href={`/clientes/${clienteId}/editar`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'border-gray-700 text-gray-300 hover:text-white')}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Editar
        </Link>
      </div>

      {/* KPIs últimos 30 días */}
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Últimos 30 días</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Leads totales" value={resumen.total_leads} delta={deltaLeads} />
          <KpiCard label="Sesiones" value={resumen.sessions} delta={deltaSessions} />
          <KpiCard label="Inversión Ads" value={`€${(resumen.total_spend).toFixed(0)}`}
            prev={`€${resumen.gads_spend + resumen.meta_spend}`} />
          <KpiCard label="Pos. media GSC" value={resumen.gsc_position.toFixed(1)}
            invertColors suffix="" />
        </div>
      </div>

      {/* Desglose por canal */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-2">
          <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">Google Ads</h3>
          <p className="text-white text-xl font-bold">{resumen.gads_leads} leads</p>
          <p className="text-gray-400 text-sm">€{resumen.gads_spend.toFixed(0)} invertidos</p>
          <p className="text-gray-400 text-sm">CPL: €{resumen.gads_cpl.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-2">
          <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">Meta Ads</h3>
          <p className="text-white text-xl font-bold">{resumen.meta_leads} leads</p>
          <p className="text-gray-400 text-sm">€{resumen.meta_spend.toFixed(0)} invertidos</p>
          <p className="text-gray-400 text-sm">CPL: €{resumen.meta_cpl.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-2">
          <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">Orgánico</h3>
          <p className="text-white text-xl font-bold">{resumen.organic_leads} leads</p>
          <p className="text-gray-400 text-sm">{resumen.gsc_clicks.toLocaleString()} clicks GSC</p>
          <p className="text-gray-400 text-sm">Conv: {resumen.conversion_rate.toFixed(1)}%</p>
        </div>
      </div>

      {/* IDs de plataformas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
          <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">Google</h3>
          <Field label="GA4 Property ID" value={c.ga4_property_id} />
          <Field label="Google Ads Customer ID" value={c.gads_customer_id} />
          <Field label="GSC Site URL" value={c.gsc_site_url} />
          <Field label="GTM Container ID" value={c.gtm_container_id} />
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
          <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium">Meta / sGTM</h3>
          <Field label="Ad Account ID" value={c.meta_ad_account_id} />
          <Field label="Pixel ID" value={c.meta_pixel_id} />
          <Field label="sGTM URL" value={c.sgtm_url} />
          <Field label="GCP Project ID" value={c.gcp_project_id} />
        </div>
      </div>

      {c.notas && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <h3 className="text-gray-300 text-xs uppercase tracking-wide font-medium mb-2">Notas</h3>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{c.notas}</p>
        </div>
      )}
    </div>
  )
}
