'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import KpiCard from '@/components/dashboard/KpiCard'
import { Settings, X, Check, RefreshCw } from 'lucide-react'
import type { TipoProyecto } from '@/types/cliente'
import type { MetaCampaign } from '@/lib/meta/ads'

// ── Types ──────────────────────────────────────────────────────────────────────

type BlockId = 'resumen' | 'meta' | 'gads' | 'organico'

interface InformeData {
  blocks:        BlockId[]
  tipo_proyecto: TipoProyecto
  desde:         string
  hasta:         string
  ga4:  {
    sessions: number; sessions_prev: number
    users: number; users_prev: number
    conversions: number; conversions_prev: number
    bounce_rate: number; avg_session_duration: number
  } | null
  gsc: {
    clicks: number; clicks_prev: number
    impressions: number; impressions_prev: number
    ctr: number; ctr_prev: number
    position: number; position_prev: number
  } | null
  meta: {
    spend: number; spend_prev: number
    impressions: number; clicks: number; ctr: number; cpc: number; cpp: number; reach: number
    conversions: number; cpl: number; cpl_prev: number
    roas: number; revenue: number; revenue_prev: number; purchases: number
  } | null
  campaigns: MetaCampaign[] | null
  ga4Error:  string | null
  gscError:  string | null
  metaError: string | null
}

// ── Block definitions ──────────────────────────────────────────────────────────

const BLOCK_DEFS: { id: BlockId; label: string }[] = [
  { id: 'resumen',  label: 'Resumen Global' },
  { id: 'meta',     label: 'Meta Ads' },
  { id: 'gads',     label: 'Google Ads' },
  { id: 'organico', label: 'Orgánico (SEO)' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function prevMonth(): { desde: string; hasta: string } {
  const now = new Date()
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfPrevMonth  = new Date(firstOfThisMonth.getTime() - 1)
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { desde: fmt(firstOfPrevMonth), hasta: fmt(lastOfPrevMonth) }
}

function fmtEur(n: number)  { return `€${n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }
function fmtPct(n: number)  { return `${n.toFixed(2)}%` }

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-[#1a1a1a] text-white px-6 py-3 flex items-baseline justify-between">
      <span className="font-display text-base font-bold">{title}</span>
      {subtitle && <span className="font-mono text-[10px] text-white/50 tracking-wide">{subtitle}</span>}
    </div>
  )
}

// ── KPI grid ──────────────────────────────────────────────────────────────────

function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
      {children}
    </div>
  )
}

// ── Resumen Global block ───────────────────────────────────────────────────────

function ResumenBlock({ data }: { data: InformeData }) {
  const isEcommerce = data.tipo_proyecto === 'ecommerce'
  const rangeLabel  = `${data.desde} → ${data.hasta}`
  return (
    <div className="border border-[#e8e8e8]">
      <SectionHeader title="Resumen Global" subtitle={rangeLabel} />
      <div className="bg-white">
        <KpiGrid>
          {data.meta ? (
            <KpiCard label="Inversión Meta" value={fmtEur(data.meta.spend)} prev={data.meta.spend_prev} />
          ) : (
            <EmptyKpi label="Inversión Meta" error={data.metaError} />
          )}
          {data.meta ? (
            isEcommerce ? (
              <KpiCard label="Compras Meta" value={data.meta.purchases} />
            ) : (
              <KpiCard label="Leads Meta" value={data.meta.conversions} />
            )
          ) : (
            <EmptyKpi label={isEcommerce ? 'Compras Meta' : 'Leads Meta'} error={data.metaError} />
          )}
          {data.meta ? (
            isEcommerce ? (
              <KpiCard label="ROAS" value={`${data.meta.roas.toFixed(2)}x`} />
            ) : (
              <KpiCard label="CPL" value={fmtEur(data.meta.cpl)} prev={data.meta.cpl_prev} invertColors />
            )
          ) : (
            <EmptyKpi label={isEcommerce ? 'ROAS' : 'CPL'} error={data.metaError} />
          )}
          {data.ga4 ? (
            <KpiCard label="Sesiones GA4" value={data.ga4.sessions} prev={data.ga4.sessions_prev} />
          ) : (
            <EmptyKpi label="Sesiones GA4" error={data.ga4Error} />
          )}
          {data.ga4 ? (
            <KpiCard label="Conversiones GA4" value={data.ga4.conversions} prev={data.ga4.conversions_prev} />
          ) : (
            <EmptyKpi label="Conversiones GA4" error={data.ga4Error} />
          )}
          {data.gsc ? (
            <KpiCard label="Clicks GSC" value={data.gsc.clicks} prev={data.gsc.clicks_prev} />
          ) : (
            <EmptyKpi label="Clicks GSC" error={data.gscError} />
          )}
        </KpiGrid>
      </div>
    </div>
  )
}

// ── Meta Ads block ────────────────────────────────────────────────────────────

function MetaBlock({ data }: { data: InformeData }) {
  const isEcommerce = data.tipo_proyecto === 'ecommerce'
  const rangeLabel  = `${data.desde} → ${data.hasta}`
  return (
    <div className="border border-[#e8e8e8]">
      <SectionHeader title="Meta Ads" subtitle={rangeLabel} />
      <div className="bg-white">
        {data.metaError && (
          <div className="px-6 py-4">
            <p className="font-mono text-[10px] text-[#F7415C]">Error: {data.metaError}</p>
          </div>
        )}
        {data.meta && (
          <>
            {/* Row 1: main KPIs */}
            <KpiGrid>
              <KpiCard label="Inversión" value={fmtEur(data.meta.spend)} prev={data.meta.spend_prev} />
              {isEcommerce ? (
                <KpiCard label="Compras" value={data.meta.purchases} />
              ) : (
                <KpiCard label="Leads" value={data.meta.conversions} />
              )}
              {isEcommerce ? (
                <KpiCard label="ROAS" value={`${data.meta.roas.toFixed(2)}x`} />
              ) : (
                <KpiCard label="CPL" value={fmtEur(data.meta.cpl)} prev={data.meta.cpl_prev} invertColors />
              )}
              {isEcommerce ? (
                <KpiCard label="Revenue" value={fmtEur(data.meta.revenue)} prev={data.meta.revenue_prev} />
              ) : (
                <KpiCard label="ROAS" value={`${data.meta.roas.toFixed(2)}x`} />
              )}
            </KpiGrid>
            {/* Row 2: engagement */}
            <div className="mt-px">
              <KpiGrid>
                <KpiCard label="Clicks" value={data.meta.clicks} />
                <KpiCard label="Impresiones" value={data.meta.impressions} />
                <KpiCard label="CTR" value={fmtPct(data.meta.ctr)} />
                <KpiCard label="CPM" value={fmtEur(data.meta.cpp)} invertColors />
              </KpiGrid>
            </div>
            {/* Campaign table */}
            {data.campaigns && data.campaigns.length > 0 && (
              <div className="overflow-x-auto mt-px border-t border-[#e8e8e8]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#e8e8e8]">
                      {['Campaña', 'Estado', 'Inversión', 'Clicks', isEcommerce ? 'Compras' : 'Leads', isEcommerce ? 'ROAS' : 'CPL'].map(h => (
                        <th key={h} className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-[1px] text-[#888888]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns!.map(c => (
                      <tr key={c.id} className="border-b border-[#e8e8e8] hover:bg-[#fafafa] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[#000000] max-w-[200px] truncate">{c.nombre}</td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 ${
                            c.estado === 'ACTIVE' ? 'bg-[#edfaf2] text-[#1a7a4a]' : 'bg-[#e8e8e8] text-[#888888]'
                          }`}>
                            {c.estado === 'ACTIVE' ? 'Activa' : c.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{fmtEur(c.spend)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{c.clicks.toLocaleString('es-ES')}</td>
                        <td className="px-4 py-3 font-mono text-xs">{isEcommerce ? c.purchases : c.conversions}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {isEcommerce
                            ? (c.spend > 0 ? `${c.roas.toFixed(2)}x` : '—')
                            : (c.conversions > 0 ? fmtEur(c.cpl) : '—')
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {!data.meta && !data.metaError && (
          <div className="px-6 py-8 text-center">
            <p className="font-mono text-[10px] text-[#888888] uppercase tracking-wide">Sin cuenta Meta Ads configurada</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Google Ads block ──────────────────────────────────────────────────────────

function GadsBlock() {
  return (
    <div className="border border-[#e8e8e8]">
      <SectionHeader title="Google Ads" />
      <div className="bg-white px-6 py-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-[#888888] mb-2">Próximamente</p>
        <p className="font-mono text-xs text-[#bbbbbb]">La integración con Google Ads API está en desarrollo.</p>
      </div>
    </div>
  )
}

// ── Orgánico block ────────────────────────────────────────────────────────────

function OrganicoBlock({ data }: { data: InformeData }) {
  const rangeLabel = `${data.desde} → ${data.hasta}`
  return (
    <div className="border border-[#e8e8e8]">
      <SectionHeader title="Orgánico (SEO)" subtitle={rangeLabel} />
      <div className="bg-white">
        {data.gscError && (
          <div className="px-6 py-4">
            <p className="font-mono text-[10px] text-[#F7415C]">Error: {data.gscError}</p>
          </div>
        )}
        {data.gsc && (
          <KpiGrid>
            <KpiCard label="Clicks GSC" value={data.gsc.clicks} prev={data.gsc.clicks_prev} />
            <KpiCard label="Impresiones" value={data.gsc.impressions} prev={data.gsc.impressions_prev} />
            <KpiCard label="CTR medio" value={fmtPct(data.gsc.ctr)} />
            <KpiCard label="Posición media" value={data.gsc.position.toFixed(1)} invertColors />
          </KpiGrid>
        )}
        {!data.gsc && !data.gscError && (
          <div className="px-6 py-8 text-center">
            <p className="font-mono text-[10px] text-[#888888] uppercase tracking-wide">Sin Search Console configurado</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Empty KPI ─────────────────────────────────────────────────────────────────

function EmptyKpi({ label, error }: { label: string; error?: string | null }) {
  return (
    <div className="bg-white p-5">
      <p className="font-mono text-[11px] tracking-[1px] uppercase font-bold mb-2 text-[#000000]">{label}</p>
      <p className="font-mono text-xs text-[#888888]">{error ? 'Error' : 'Sin datos'}</p>
    </div>
  )
}

// ── Loading state ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="p-8 space-y-8">
      <div className="h-8 w-48 bg-[#e8e8e8] animate-pulse" />
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-[#e8e8e8]">
            <div className="h-10 bg-[#e8e8e8] animate-pulse" />
            <div className="grid grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
              {[...Array(4)].map((_, j) => <div key={j} className="bg-white h-24 animate-pulse" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InformePage() {
  const { clienteId } = useParams<{ clienteId: string }>()

  const [data,       setData]       = useState<InformeData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [configOpen, setConfigOpen] = useState(false)
  const [blocks,     setBlocks]     = useState<BlockId[]>(['resumen', 'meta', 'gads', 'organico'])
  const [saving,     setSaving]     = useState(false)

  // Date range state — default: previous calendar month
  const defaults = prevMonth()
  const [desde, setDesde] = useState(defaults.desde)
  const [hasta,  setHasta]  = useState(defaults.hasta)

  const fetchData = useCallback(async (d: string, h: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${clienteId}/informe?desde=${d}&hasta=${h}`)
      const json: InformeData = await res.json()
      setData(json)
      setBlocks((json.blocks ?? ['resumen', 'meta', 'gads', 'organico']) as BlockId[])
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  // Initial fetch on mount
  useEffect(() => {
    fetchData(desde, hasta)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleActualizar() {
    fetchData(desde, hasta)
  }

  async function saveConfig() {
    setSaving(true)
    await fetch(`/api/clientes/${clienteId}/informe`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ informe_blocks: blocks }),
    })
    if (data) setData({ ...data, blocks })
    setSaving(false)
    setConfigOpen(false)
  }

  function toggleBlock(id: BlockId) {
    setBlocks(b => b.includes(id) ? b.filter(x => x !== id) : [...b, id])
  }

  if (loading) return <LoadingState />

  const activeBlocks = BLOCK_DEFS.filter(b => (data?.blocks ?? blocks).includes(b.id))

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#000000]">
        <div>
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-1">Informe por periodo</p>
          <h2 className="font-display text-2xl font-bold">Informe</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date pickers */}
          <div className="flex items-center gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wide text-[#888888]">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="font-mono text-[10px] border border-[#e8e8e8] px-2 py-1.5 focus:outline-none focus:border-[#000000] transition-colors"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wide text-[#888888]">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="font-mono text-[10px] border border-[#e8e8e8] px-2 py-1.5 focus:outline-none focus:border-[#000000] transition-colors"
            />
          </div>
          <button
            onClick={handleActualizar}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide bg-[#F7415C] text-white px-3 py-2 hover:bg-[#000000] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Actualizar
          </button>
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#000000] border border-[#e8e8e8] hover:border-[#000000] px-3 py-2 transition-colors"
          >
            <Settings className="w-3 h-3" />
            Configurar
          </button>
        </div>
      </div>

      {/* Blocks */}
      {data && (
        <div className="space-y-6">
          {activeBlocks.map(block => {
            switch (block.id) {
              case 'resumen':  return <ResumenBlock  key="resumen"  data={data} />
              case 'meta':     return <MetaBlock     key="meta"     data={data} />
              case 'gads':     return <GadsBlock     key="gads" />
              case 'organico': return <OrganicoBlock key="organico" data={data} />
              default:         return null
            }
          })}
          {activeBlocks.length === 0 && (
            <div className="border border-dashed border-[#e8e8e8] p-10 text-center">
              <p className="font-mono text-[10px] uppercase tracking-wide text-[#888888] mb-3">Sin bloques seleccionados</p>
              <button
                onClick={() => setConfigOpen(true)}
                className="font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-4 py-2 hover:bg-[#F7415C] transition-colors"
              >
                Configurar informe
              </button>
            </div>
          )}
        </div>
      )}

      {/* Config panel */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setConfigOpen(false)} />
          <div className="w-80 bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
              <div>
                <h3 className="font-display text-base font-bold">Configurar informe</h3>
                <p className="font-mono text-[9px] text-[#888888] mt-0.5 uppercase tracking-wide">Selecciona los bloques</p>
              </div>
              <button onClick={() => setConfigOpen(false)} className="text-[#888888] hover:text-[#000000] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {BLOCK_DEFS.map(block => {
                const on = blocks.includes(block.id)
                return (
                  <button
                    key={block.id}
                    onClick={() => toggleBlock(block.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 border text-sm transition-colors ${
                      on
                        ? 'border-[#000000] bg-[#000000] text-white'
                        : 'border-[#e8e8e8] text-[#555555] hover:border-[#000000] hover:text-[#000000]'
                    }`}
                  >
                    <span className="font-mono text-[10px] tracking-wide uppercase">{block.label}</span>
                    {on && <Check className="w-3.5 h-3.5" />}
                  </button>
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
