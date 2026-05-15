'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import KpiCard from '@/components/dashboard/KpiCard'
import { Pencil, Settings, X, Check } from 'lucide-react'

// ── Widget catalogue ───────────────────────────────────────────────────────────

type WidgetId =
  | 'ga4_sessions' | 'ga4_users' | 'ga4_conversions' | 'ga4_bounce' | 'ga4_duration'
  | 'gsc_clicks' | 'gsc_impressions' | 'gsc_ctr' | 'gsc_position'

interface WidgetDef {
  id: WidgetId
  label: string
  group: 'GA4' | 'GSC'
  invertColors?: boolean
  getValue: (data: ResumenData) => string | number | null
  getPrev:  (data: ResumenData) => number | undefined
}

const WIDGETS: WidgetDef[] = [
  { id: 'ga4_sessions',    label: 'Sesiones',       group: 'GA4', getValue: d => d.ga4?.sessions    ?? null, getPrev: d => d.ga4?.sessions_prev },
  { id: 'ga4_users',       label: 'Usuarios',        group: 'GA4', getValue: d => d.ga4?.users       ?? null, getPrev: d => d.ga4?.users_prev },
  { id: 'ga4_conversions', label: 'Conversiones',    group: 'GA4', getValue: d => d.ga4?.conversions  ?? null, getPrev: d => d.ga4?.conversions_prev },
  { id: 'ga4_bounce',      label: 'Tasa rebote',     group: 'GA4', invertColors: true, getValue: d => d.ga4 ? `${d.ga4.bounce_rate.toFixed(1)}%` : null, getPrev: d => undefined },
  { id: 'ga4_duration',    label: 'Duración media',  group: 'GA4', getValue: d => d.ga4 ? `${Math.round(d.ga4.avg_session_duration)}s` : null, getPrev: d => undefined },
  { id: 'gsc_clicks',      label: 'Clicks GSC',      group: 'GSC', getValue: d => d.gsc?.clicks      ?? null, getPrev: d => d.gsc?.clicks_prev },
  { id: 'gsc_impressions', label: 'Impresiones GSC', group: 'GSC', getValue: d => d.gsc?.impressions  ?? null, getPrev: d => d.gsc?.impressions_prev },
  { id: 'gsc_ctr',         label: 'CTR medio',       group: 'GSC', getValue: d => d.gsc ? `${d.gsc.ctr.toFixed(2)}%` : null, getPrev: d => undefined },
  { id: 'gsc_position',    label: 'Posición media',  group: 'GSC', invertColors: true, getValue: d => d.gsc ? d.gsc.position.toFixed(1) : null, getPrev: d => undefined },
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface ResumenData {
  widgets:  string[]
  ga4:      { sessions: number; sessions_prev: number; users: number; users_prev: number; conversions: number; conversions_prev: number; bounce_rate: number; avg_session_duration: number } | null
  gsc:      { clicks: number; clicks_prev: number; impressions: number; impressions_prev: number; ctr: number; position: number } | null
  ga4Error: string | null
  gscError: string | null
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

  const activeWidgets = WIDGETS.filter(w => (data?.widgets ?? []).includes(w.id))

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

      {/* KPI grid — only selected widgets */}
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
                  <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-2">{w.label}</p>
                  <p className="font-mono text-xs text-[#888888]">Sin datos</p>
                </div>
              )
            }
            return (
              <KpiCard
                key={w.id}
                label={w.label}
                value={value}
                prev={prev}
                invertColors={w.invertColors}
              />
            )
          })}
        </div>
      )}

      {/* Source errors */}
      {(data?.ga4Error || data?.gscError) && (
        <div className="space-y-2">
          {data.ga4Error && <p className="font-mono text-[9px] text-[#F7415C]">⚠ GA4: {data.ga4Error}</p>}
          {data.gscError && <p className="font-mono text-[9px] text-[#F7415C]">⚠ GSC: {data.gscError}</p>}
        </div>
      )}

      {/* ── Config panel ──────────────────────────────────────────────── */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setConfigOpen(false)} />
          <div className="w-80 bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
              <h3 className="font-display text-base font-bold">Configurar resumen</h3>
              <button onClick={() => setConfigOpen(false)} className="text-[#888888] hover:text-[#000000] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(['GA4', 'GSC'] as const).map(group => (
                <div key={group}>
                  <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-3">{group}</p>
                  <div className="space-y-1.5">
                    {WIDGETS.filter(w => w.group === group).map(w => {
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
                          <span className="font-mono text-[10px] tracking-wide uppercase">{w.label}</span>
                          {on && <Check className="w-3.5 h-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
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
