'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import KpiCard from '@/components/dashboard/KpiCard'
import LineChart from '@/components/charts/LineChart'

type Funnel = { page_views: number; view_content: number; add_to_cart: number; initiate_checkout: number; purchases: number; revenue: number; steps: Record<string, number> }
type Summary = {
  spend: number; spend_prev: number
  impressions: number; clicks: number; reach: number
  conversions: number; cpl: number; cpl_prev: number
  ctr: number; cpc: number; cpp: number
  roas: number; revenue: number; revenue_prev: number; purchases: number
  funnel: Funnel
}
type Campaign = {
  id: string; nombre: string; estado: string; objetivo: string
  spend: number; impressions: number; clicks: number
  conversions: number; ctr: number; cpc: number; cpl: number
  purchases: number; revenue: number; roas: number
}
type DailyRow = { fecha: string; spend: number; impressions: number; clicks: number; conversions: number; purchases: number; revenue: number }
type TipoProyecto = 'leads' | 'ecommerce'

function FunnelStep({ label, value, prev }: { label: string; value: number; prev?: number }) {
  const pct = prev && prev > 0 ? ((value / prev) * 100).toFixed(1) : null
  return (
    <div className="flex-1 bg-white border border-[#e8e8e8] p-4 text-center">
      <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-1">{label}</p>
      <p className="font-display text-xl font-bold">{value.toLocaleString()}</p>
      {pct && <p className="font-mono text-[9px] text-[#1a7a4a] mt-0.5">{pct}% conversión</p>}
    </div>
  )
}

export default function MetaAdsPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [summary,      setSummary]      = useState<Summary | null>(null)
  const [campaigns,    setCampaigns]    = useState<Campaign[]>([])
  const [daily,        setDaily]        = useState<DailyRow[]>([])
  const [tipoProyecto, setTipoProyecto] = useState<TipoProyecto>('leads')
  const [funnelSteps,  setFunnelSteps]  = useState<string[]>([])
  const [error,        setError]        = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clientes/${clienteId}/meta`)
        if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
        const data = await res.json()
        setSummary(data.summary)
        setCampaigns(data.campaigns)
        setDaily(data.daily)
        setTipoProyecto(data.tipo_proyecto ?? 'leads')
        setFunnelSteps(data.funnel_steps ?? [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clienteId])

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  // Use declared project type (set in client configuration)
  const isEcommerce = tipoProyecto === 'ecommerce'
  const f = summary!.funnel

  // Friendly labels for known event names
  const STEP_LABELS: Record<string, string> = {
    page_view:            'Page Views',
    view_content:         'View Content',
    add_to_cart:          'Add to Cart',
    initiate_checkout:    'Checkout',
    purchase:             'Compras',
    lead:                 'Leads',
    complete_registration:'Registros',
    contact:              'Contactos',
    schedule:             'Citas',
    submit_application:   'Solicitudes',
    subscribe:            'Suscripciones',
  }

  // Build funnel from configured steps using the dynamic steps map
  const activeFunnelSteps = funnelSteps.length > 0
    ? funnelSteps.map(key => ({
        key,
        label: STEP_LABELS[key] ?? key,
        val:   f.steps?.[key] ?? 0,
      }))
    : []

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-baseline gap-4 pb-4 border-b-2 border-[#000000]">
        <h2 className="font-display text-2xl font-bold">Meta Ads</h2>
        <span className="font-mono text-[10px] tracking-[2px] uppercase font-bold text-[#000000]">últimos 30 días</span>
        <span className="font-mono text-[9px] px-2 py-0.5 bg-[#F7415C] text-white uppercase tracking-wide font-bold">
          {isEcommerce ? 'ecommerce' : 'leads'}
        </span>
      </div>

      {/* KPIs principales */}
      {isEcommerce ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
            <KpiCard label="Inversión"  value={`€${summary!.spend.toFixed(0)}`}    prev={summary!.spend_prev} />
            <KpiCard label="Revenue"    value={`€${summary!.revenue.toFixed(0)}`}  prev={summary!.revenue_prev} />
            <KpiCard label="ROAS"       value={summary!.roas > 0 ? `${summary!.roas.toFixed(2)}x` : '—'} />
            <KpiCard label="Compras"    value={summary!.purchases} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
            <KpiCard label="Clicks"     value={summary!.clicks.toLocaleString()} />
            <KpiCard label="Impresiones" value={`${(summary!.impressions / 1000).toFixed(1)}k`} />
            <KpiCard label="CTR"        value={`${summary!.ctr.toFixed(2)}%`} />
            <KpiCard label="CPC"        value={`€${summary!.cpc.toFixed(2)}`} invertColors />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
            <KpiCard label="Inversión"    value={`€${summary!.spend.toFixed(0)}`}       prev={summary!.spend_prev} />
            <KpiCard label="Leads"        value={summary!.conversions}                   />
            <KpiCard label="CPL"          value={`€${summary!.cpl.toFixed(2)}`}         prev={summary!.cpl_prev} invertColors />
            <KpiCard label="ROAS"         value={summary!.roas > 0 ? `${summary!.roas.toFixed(2)}x` : '—'} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
            <KpiCard label="Clicks"      value={summary!.clicks.toLocaleString()} />
            <KpiCard label="Impresiones" value={`${(summary!.impressions / 1000).toFixed(1)}k`} />
            <KpiCard label="CTR"         value={`${summary!.ctr.toFixed(2)}%`} />
            <KpiCard label="CPM"         value={`€${summary!.cpp.toFixed(2)}`} invertColors />
          </div>
        </>
      )}

      {/* Funnel ecommerce — only show configured steps that have data */}
      {activeFunnelSteps.length >= 2 && (
        <div className="bg-white border border-[#e8e8e8] p-6">
          <h3 className="font-display text-base font-bold mb-1">{isEcommerce ? 'Funnel de compra' : 'Funnel de conversión'}</h3>
          <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-4">tasas de conversión entre pasos</p>
          <div className="flex gap-px">
            {activeFunnelSteps.map((step, i) => (
              <FunnelStep
                key={step.key}
                label={step.label}
                value={step.val}
                prev={i > 0 ? (activeFunnelSteps[i - 1].val || undefined) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-white border border-[#e8e8e8] p-6">
        <h3 className="font-display text-base font-bold mb-1">
          {isEcommerce ? 'Inversión y revenue' : 'Inversión y leads'}
        </h3>
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-5">evolución diaria — 30 días</p>
        <LineChart
          data={daily}
          series={isEcommerce ? [
            { key: 'spend',    label: 'Inversión (€)', color: '#1877f2' },
            { key: 'revenue',  label: 'Revenue (€)',   color: '#1a7a4a' },
          ] : [
            { key: 'spend',       label: 'Inversión (€)', color: '#1877f2' },
            { key: 'conversions', label: 'Leads',         color: '#1a7a4a' },
          ]}
          height={240}
          formatY={v => `€${v.toFixed(0)}`}
        />
      </div>

      {/* Tabla campañas */}
      <div className="bg-white border border-[#e8e8e8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e8e8e8]">
          <h3 className="font-display text-base font-bold">Campañas</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#ffffff]">
              <th className="text-left  px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Campaña</th>
              <th className="text-left  px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Estado</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Inversión</th>
              <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Clicks</th>
              {isEcommerce ? (
                <>
                  <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Compras</th>
                  <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Revenue</th>
                  <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">ROAS</th>
                </>
              ) : (
                <>
                  <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Leads</th>
                  <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">CPL</th>
                  <th className="text-right px-6 py-2.5 font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">ROAS</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e8e8]">
            {campaigns.map(c => (
              <tr key={c.id} className="hover:bg-[#f9f9f9] transition-colors">
                <td className="px-6 py-2.5 text-[#000000] font-medium max-w-xs truncate">{c.nombre}</td>
                <td className="px-6 py-2.5">
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 tracking-wide uppercase ${
                    c.estado === 'ACTIVE' ? 'bg-[#edfaf2] text-[#1a7a4a]' : 'bg-[#f5f5f5] text-[#888888]'
                  }`}>
                    {c.estado === 'ACTIVE' ? 'Activa' : 'Pausada'}
                  </span>
                </td>
                <td className="px-6 py-2.5 font-mono text-xs text-right font-medium">€{c.spend.toFixed(0)}</td>
                <td className="px-6 py-2.5 font-mono text-xs text-right text-[#555555]">{c.clicks.toLocaleString()}</td>
                {isEcommerce ? (
                  <>
                    <td className="px-6 py-2.5 font-mono text-xs text-right">{c.purchases}</td>
                    <td className="px-6 py-2.5 font-mono text-xs text-right font-medium">
                      {c.revenue > 0 ? `€${c.revenue.toFixed(0)}` : '—'}
                    </td>
                    <td className="px-6 py-2.5 font-mono text-xs text-right">
                      <span className={c.roas >= 3 ? 'text-[#1a7a4a]' : c.roas >= 1 ? 'text-[#d4820a]' : 'text-[#F7415C]'}>
                        {c.roas > 0 ? `${c.roas.toFixed(2)}x` : '—'}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-2.5 font-mono text-xs text-right">{c.conversions}</td>
                    <td className="px-6 py-2.5 text-right">
                      <span className={`font-mono text-xs ${c.cpl < 20 ? 'text-[#1a7a4a]' : c.cpl < 50 ? 'text-[#d4820a]' : 'text-[#F7415C]'}`}>
                        {c.cpl > 0 ? `€${c.cpl.toFixed(2)}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-2.5 font-mono text-xs text-right text-[#555555]">
                      {c.roas > 0 ? `${c.roas.toFixed(2)}x` : '—'}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="p-8 space-y-8">
      <div className="h-8 w-48 bg-[#e8e8e8] animate-pulse" />
      <div className="grid grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white h-24 animate-pulse" />)}
      </div>
      <div className="bg-white border border-[#e8e8e8] h-64 animate-pulse" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-8">
      <div className="bg-[#fff0f2] border border-[#F7415C] border-l-4 border-l-[#F7415C] px-5 py-4">
        <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#F7415C] mb-1">Error cargando datos</p>
        <p className="text-sm text-[#555555]">{message}</p>
      </div>
    </div>
  )
}
