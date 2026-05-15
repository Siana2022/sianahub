import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KpiCard from '@/components/dashboard/KpiCard'
import { Pencil } from 'lucide-react'
import { mockResumen } from '@/lib/mock/metricas'
import type { Cliente } from '@/types/cliente'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-0.5">{label}</p>
      <p className="font-mono text-xs text-[#000000]">{value}</p>
    </div>
  )
}

const ESTADO_LABEL: Record<string, string> = { active: 'Activo', paused: 'Pausado', churn: 'Churn' }
const ESTADO_CLASS: Record<string, string> = {
  active: 'bg-[#edfaf2] text-[#1a7a4a]',
  paused: 'bg-[#fef8ed] text-[#d4820a]',
  churn:  'bg-[#fff0f2] text-[#F7415C]',
}

export default async function ClienteResumenPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single()

  if (error || !cliente) notFound()

  const resumen = mockResumen()
  const c = cliente as Cliente

  const deltaLeads    = ((resumen.total_leads - resumen.total_leads_prev) / Math.abs(resumen.total_leads_prev)) * 100
  const deltaSessions = ((resumen.sessions    - resumen.sessions_prev)    / Math.abs(resumen.sessions_prev)) * 100

  return (
    <div className="p-8 space-y-8">
      {/* Section header */}
      <div className="flex items-end justify-between pb-4 border-b-2 border-[#000000]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display text-2xl font-bold">{c.nombre}</h2>
            <span className={`font-mono text-[9px] px-1.5 py-0.5 uppercase tracking-wide ${ESTADO_CLASS[c.estado] ?? 'bg-[#ffffff] text-[#888888]'}`}>
              {ESTADO_LABEL[c.estado] ?? c.estado}
            </span>
          </div>
          {c.dominio && (
            <a href={`https://${c.dominio}`} target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs text-[#1a4fa0] hover:underline">
              {c.dominio}
            </a>
          )}
        </div>
        <Link href={`/clientes/${clienteId}/editar`}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#000000] border border-[#e8e8e8] hover:border-[#000000] px-3 py-2 transition-colors">
          <Pencil className="w-3 h-3" />
          Editar
        </Link>
      </div>

      {/* KPIs */}
      <div>
        <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-3">Últimos 30 días</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
          <KpiCard label="Leads totales"  value={resumen.total_leads}                         delta={deltaLeads} />
          <KpiCard label="Sesiones"       value={resumen.sessions}                             delta={deltaSessions} />
          <KpiCard label="Inversión Ads"  value={`€${resumen.total_spend.toFixed(0)}`}         prev={`€${(resumen.gads_spend + resumen.meta_spend).toFixed(0)}`} />
          <KpiCard label="Pos. media GSC" value={resumen.gsc_position.toFixed(1)}              invertColors />
        </div>
      </div>

      {/* Canal breakdown */}
      <div className="grid grid-cols-3 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        <div className="bg-white p-5 space-y-2">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">Google Ads</p>
          <p className="font-display text-2xl font-black text-[#000000]">{resumen.gads_leads} <span className="text-base font-normal text-[#888888]">leads</span></p>
          <p className="font-mono text-xs text-[#555555]">€{resumen.gads_spend.toFixed(0)} invertidos</p>
          <p className="font-mono text-xs text-[#555555]">CPL: €{resumen.gads_cpl.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 space-y-2">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">Meta Ads</p>
          <p className="font-display text-2xl font-black text-[#000000]">{resumen.meta_leads} <span className="text-base font-normal text-[#888888]">leads</span></p>
          <p className="font-mono text-xs text-[#555555]">€{resumen.meta_spend.toFixed(0)} invertidos</p>
          <p className="font-mono text-xs text-[#555555]">CPL: €{resumen.meta_cpl.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 space-y-2">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">Orgánico</p>
          <p className="font-display text-2xl font-black text-[#000000]">{resumen.organic_leads} <span className="text-base font-normal text-[#888888]">leads</span></p>
          <p className="font-mono text-xs text-[#555555]">{resumen.gsc_clicks.toLocaleString()} clicks GSC</p>
          <p className="font-mono text-xs text-[#555555]">Conv: {resumen.conversion_rate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Platform IDs */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#e8e8e8] p-5 space-y-3">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] pb-2 border-b border-[#e8e8e8]">Google</p>
          <Field label="GA4 Property ID"         value={c.ga4_property_id} />
          <Field label="Google Ads Customer ID"   value={c.gads_customer_id} />
          <Field label="GSC Site URL"             value={c.gsc_site_url} />
          <Field label="GTM Container ID"         value={c.gtm_container_id} />
        </div>
        <div className="bg-white border border-[#e8e8e8] p-5 space-y-3">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] pb-2 border-b border-[#e8e8e8]">Meta / sGTM</p>
          <Field label="Ad Account ID"  value={c.meta_ad_account_id} />
          <Field label="Pixel ID"       value={c.meta_pixel_id} />
          <Field label="sGTM URL"       value={c.sgtm_url} />
          <Field label="GCP Project ID" value={c.gcp_project_id} />
        </div>
      </div>

      {c.notas && (
        <div className="bg-white border border-[#e8e8e8] border-l-4 border-l-[#F7415C] p-5">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-2">Notas internas</p>
          <p className="text-sm text-[#555555] whitespace-pre-wrap">{c.notas}</p>
        </div>
      )}
    </div>
  )
}
