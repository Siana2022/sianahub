'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import KpiCard from '@/components/dashboard/KpiCard'
import { Pencil, Settings, X, Check } from 'lucide-react'
import type { TipoProyecto } from '@/types/cliente'

// ── Widget catalogue ───────────────────────────────────────────────────────────

type WidgetId =
  | 'ga4_sessions' | 'ga4_users' | 'ga4_conversions' | 'ga4_bounce' | 'ga4_duration'
  | 'gsc_clicks' | 'gsc_impressions' | 'gsc_ctr' | 'gsc_position'
  | 'meta_spend' | 'meta_conversions' | 'meta_cpl' | 'meta_roas'
  | 'meta_clicks' | 'meta_ctr' | 'meta_revenue' | 'meta_purchases'

interface WidgetDef {
  id:            WidgetId
  labelLeads:    string
  labelEcommerce: string
  group:         'GA4' | 'GSC' | 'Meta Ads'
  onlyLeads?:    boolean   // hide in ecommerce config panel
  onlyEcommerce?: boolean  // hide in leads config panel
  invertColors?: boolean
  getValue: (data: ResumenData) => string | number | null
  getPrev:  (data: ResumenData) => number | undefined
}

const WIDGETS: WidgetDef[] = [
  // GA4
  { id: 'ga4_sessions',    labelLeads: 'Sesiones',      labelEcommerce: 'Sesiones',      group: 'GA4', getValue: d => d.ga4?.sessions    ?? null, getPrev: d => d.ga4?.sessions_prev },
  { id: 'ga4_users',       labelLeads: 'Usuarios',       labelEcommerce: 'Usuarios',       group: 'GA4', getValue: d => d.ga4?.users       ?? null, getPrev: d => d.ga4?.users_prev },
  { id: 'ga4_conversions', labelLeads: 'Conversiones',   labelEcommerce: 'Conversiones',   group: 'GA4', getValue: d => d.ga4?.conversions  ?? null, getPrev: d => d.ga4?.conversions_prev },
  { id: 'ga4_bounce',      labelLeads: 'Tasa rebote',    labelEcommerce: 'Tasa rebote',    group: 'GA4', invertColors: true, getValue: d => d.ga4 ? `${d.ga4.bounce_rate.toFixed(1)}%` : null, getPrev: d => undefined },
  { id: 'ga4_duration',    labelLeads: 'Duración media', labelEcommerce: 'Duración media', group: 'GA4', getValue: d => d.ga4 ? `${Math.round(d.ga4.avg_session_duration)}s` : null, getPrev: d => undefined },
  // GSC
  { id: 'gsc_clicks',      labelLeads: 'Clicks GSC',      labelEcommerce: 'Clicks GSC',      group: 'GSC', getValue: d => d.gsc?.clicks      ?? null, getPrev: d => d.gsc?.clicks_prev },
  { id: 'gsc_impressions', labelLeads: 'Impresiones GSC', labelEcommerce: 'Impresiones GSC', group: 'GSC', getValue: d => d.gsc?.impressions  ?? null, getPrev: d => d.gsc?.impressions_prev },
  { id: 'gsc_ctr',         labelLeads: 'CTR medio',       labelEcommerce: 'CTR medio',       group: 'GSC', getValue: d => d.gsc ? `${d.gsc.ctr.toFixed(2)}%` : null, getPrev: d => undefined },
  { id: 'gsc_position',    labelLeads: 'Posición media',  labelEcommerce: 'Posición media',  group: 'GSC', invertColors: true, getValue: d => d.gsc ? d.gsc.position.toFixed(1) : null, getPrev: d => undefined },
  // Meta Ads — common
  { id: 'meta_spend',       labelLeads: 'Inversión Meta', labelEcommerce: 'Inversión Meta', group: 'Meta Ads', getValue: d => d.meta ? `€${d.meta.spend.toFixed(0)}` : null, getPrev: d => d.meta?.spend_prev },
  { id: 'meta_roas',        labelLeads: 'ROAS',           labelEcommerce: 'ROAS',           group: 'Meta Ads', getValue: d => d.meta && d.meta.roas > 0 ? `${d.meta.roas.toFixed(2)}x` : null, getPrev: d => undefined },
  { id: 'meta_clicks',      labelLeads: 'Clicks Meta',    labelEcommerce: 'Clicks Meta',    group: 'Meta Ads', getValue: d => d.meta?.clicks ?? null, getPrev: d => undefined },
  { id: 'meta_ctr',         labelLeads: 'CTR Meta',       labelEcommerce: 'CTR Meta',       group: 'Meta Ads', getValue: d => d.meta ? `${d.meta.ctr.toFixed(2)}%` : null, getPrev: d => undefined },
  // Meta Ads — leads only
  { id: 'meta_conversions', labelLeads: 'Leads',          labelEcommerce: 'Leads',    group: 'Meta Ads', onlyLeads: true,    getValue: d => d.meta?.conversions ?? null, getPrev: d => undefined },
  { id: 'meta_cpl',         labelLeads: 'CPL',            labelEcommerce: 'CPL',      group: 'Meta Ads', onlyLeads: true,    invertColors: true, getValue: d => d.meta ? `€${d.meta.cpl.toFixed(2)}` : null, getPrev: d => d.meta?.cpl_prev },
  // Meta Ads — ecommerce only
  { id: 'meta_revenue',     labelLeads: 'Revenue',        labelEcommerce: 'Revenue',  group: 'Meta Ads', onlyEcommerce: true, getValue: d => d.meta?.revenue != null ? `€${d.meta.revenue.toFixed(0)}` : null, getPrev: d => d.meta?.revenue_prev },
  { id: 'meta_purchases',   labelLeads: 'Compras',        labelEcommerce: 'Compras',  group: 'Meta Ads', onlyEcommerce: true, getValue: d => d.meta?.purchases ?? null, getPrev: d => undefined },
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface ResumenData {
  widgets:       string[]
  tipo_proyecto: TipoProyecto
  ga4:       { sessions: number; sessions_prev: number; users: number; users_prev: number; conversions: number; conversions_prev: number; bounce_rate: number; avg_session_duration: number } | null
  gsc:       { clicks: number; clicks_prev: number; impressions: number; impressions_prev: number; ctr: number; position: number } | null
  meta:      { spend: number; spend_prev: number; conversions: number; cpl: number; cpl_prev: number; roas: number; revenue: number; revenue_prev: number; purchases: number; clicks: number; ctr: number } | null
  ga4Error:  string | null
  gscError:  string | null
  metaError: string | null
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResumenPage() {
  const { clienteId } = useParams<{ clienteId: string }>()
  const [data,        setData]        = useState<ResumenData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [configOpen,  setConfigOpen]  = useState(false)
  const [selected,    setSelected]    = useState<WidgetId[]>([])
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    fetch(`/api/clientes/${clienteId}/resumen`)
      .then(r => r.json())
      .then((d: ResumenData) => {
        setData(d)
        setSelected((d.widgets ?? []) as WidgetId[])
      })
      .finally(() => setLoading(false))
  }, [clienteId])

  async function saveConfig() {
    setSaving(true)
    await fetch(`/api/clientes/${clienteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumen_widgets: selected }),
    })
    setData(d => d ? { ...d, widgets: selected } : d)
    setSaving(false)
    setConfigOpen(false)
  }

  function toggle(id: WidgetId) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const tipo          = data?.tipo_proyecto ?? 'leads'
  const isEcommerce   = tipo === 'ecommerce'
  const activeWidgets = WIDGETS.filter(w => (data?.widgets ?? []).includes(w.id))

  // Widgets visible in the config panel — filter by project type
  function isVisible(w: WidgetDef) {
    if (w.onlyLeads     && isEcommerce)  return false
    if (w.onlyEcommerce && !isEcommerce) return false
    return true
  }

  // Get contextual label
  function label(w: WidgetDef) {
    return isEcommerce ? w.labelEcommerce : w.labelLeads
  }

  if (loading) return <LoadingState />

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between pb-4 border-b-2 border-[#000000]">
        <div>
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-1">Últimos 30 días</p>
          <h2 className="font-display text-2xl font-bold">Resumen</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#000000] border border-[#e8e8e8] hover:border-[#000000] px-3 py-2 transition-colors"
          >
            <Settings className="w-3 h-3" />
            Configurar
          </button>
          <Link href={`/clientes/${clienteId}/editar`}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#000000] border border-[#e8e8e8] hover:border-[#000000] px-3 py-2 transition-colors">
            <Pencil className="w-3 h-3" />
            Editar cliente
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      {activeWidgets.length === 0 ? (
        <div className="border border-dashed border-[#e8e8e8] p-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wide text-[#888888] mb-3">Sin métricas seleccionadas</p>
          <button onClick={() => setConfigOpen(true)} className="font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-4 py-2 hover:bg-[#F7415C] transition-colors">
            Configurar resumen
          </button>
        </div>
      ) : (
        <div className={`grid gap-px bg-[#e8e8e8] border border-[#e8e8e8] ${
          activeWidgets.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
          activeWidgets.length <= 6 ? 'grid-cols-2 sm:grid-cols-3' :
          'grid-cols-2 sm:grid-cols-4'
        }`}>
          {activeWidgets.map(w => {
            const value = data ? w.getValue(data) : null
            const prev  = data ? w.getPrev(data)  : undefined
            if (value === null) {
              return (
                <div key={w.id} className="bg-white p-5">
                  <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-2">{label(w)}</p>
                  <p className="font-mono text-xs text-[#888888]">Sin datos</p>
                </div>
              )
            }
            return (
              <KpiCard key={w.id} label={label(w)} value={value} prev={prev} invertColors={w.invertColors} />
            )
          })}
        </div>
      )}

      {/* Source errors */}
      {(data?.ga4Error || data?.gscError || data?.metaError) && (
        <div className="space-y-1">
          {data?.ga4Error  && <p className="font-mono text-[9px] text-[#888888]">⚠ GA4: {data.ga4Error}</p>}
          {data?.gscError  && <p className="font-mono text-[9px] text-[#888888]">⚠ GSC: {data.gscError}</p>}
          {data?.metaError && <p className="font-mono text-[9px] text-[#888888]">⚠ Meta: {data.metaError}</p>}
        </div>
      )}

      {/* Config panel */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setConfigOpen(false)} />
          <div className="w-80 bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
              <div>
                <h3 className="font-display text-base font-bold">Configurar resumen</h3>
                <p className="font-mono text-[9px] text-[#888888] mt-0.5 uppercase tracking-wide">
                  {isEcommerce ? 'Ecommerce' : 'Captación de leads'}
                </p>
              </div>
              <button onClick={() => setConfigOpen(false)} className="text-[#888888] hover:text-[#000000] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(['GA4', 'GSC', 'Meta Ads'] as const).map(group => {
                const groupWidgets = WIDGETS.filter(w => w.group === group && isVisible(w))
                if (groupWidgets.length === 0) return null
                return (
                  <div key={group}>
                    <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-3">{group}</p>
                    <div className="space-y-1.5">
                      {groupWidgets.map(w => {
                        const on = selected.includes(w.id)
                        return (
                          <button
                            key={w.id}
                            onClick={() => toggle(w.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 border text-sm transition-colors ${
                              on
                                ? 'border-[#000000] bg-[#000000] text-white'
                                : 'border-[#e8e8e8] text-[#555555] hover:border-[#000000] hover:text-[#000000]'
                            }`}
                          >
                            <span className="font-mono text-[10px] tracking-wide uppercase">{label(w)}</span>
                            {on && <Check className="w-3.5 h-3.5" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-6 py-4 border-t border-[#e8e8e8]">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="w-full font-mono text-[10px] uppercase tracking-wide bg-[#F7415C] text-white py-2.5 hover:bg-[#000000] disabled:opacity-40 transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar selección'}
              </button>
            </div>
          </div>
        </div>
      )}
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
    </div>
  )
}
