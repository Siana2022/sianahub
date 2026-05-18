'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import KpiCard from '@/components/dashboard/KpiCard'
import { Settings, X, RefreshCw, Check } from 'lucide-react'
import type { TipoProyecto } from '@/types/cliente'
import type { MetaCampaign } from '@/lib/meta/ads'

// ── Types ──────────────────────────────────────────────────────────────────────

interface InformeConfig {
  blocks:            string[]
  resumen_metrics:   string[]
  meta_metrics:      string[]
  meta_show_funnel:  boolean
  meta_funnel_steps: string[]
  organico_metrics:  string[]
}

interface MetaFunnelData {
  page_views: number; view_content: number; add_to_cart: number
  initiate_checkout: number; purchases: number; revenue: number
  steps: Record<string, number>
}

interface InformeData {
  informe_config: Partial<InformeConfig>
  tipo_proyecto:  TipoProyecto
  funnel_steps:   string[]   // available from meta_events_config
  desde:          string
  hasta:          string
  ga4: {
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
    funnel: MetaFunnelData
  } | null
  campaigns: MetaCampaign[] | null
  ga4Error:  string | null
  gscError:  string | null
  metaError: string | null
}

// ── Metric definitions ─────────────────────────────────────────────────────────

interface MetricDef {
  id: string
  label: string
  onlyLeads?: boolean
  onlyEcommerce?: boolean
}

const RESUMEN_METRIC_DEFS: MetricDef[] = [
  { id: 'meta_spend',       label: 'Inversión Meta' },
  { id: 'meta_conversions', label: 'Leads Meta',            onlyLeads: true },
  { id: 'meta_purchases',   label: 'Compras Meta',          onlyEcommerce: true },
  { id: 'meta_cpl',         label: 'CPL Meta',              onlyLeads: true },
  { id: 'meta_roas',        label: 'ROAS Meta' },
  { id: 'meta_revenue',     label: 'Revenue Meta',          onlyEcommerce: true },
  { id: 'meta_clicks',      label: 'Clicks Meta' },
  { id: 'ga4_sessions',     label: 'Sesiones GA4' },
  { id: 'ga4_users',        label: 'Usuarios GA4' },
  { id: 'ga4_conversions',  label: 'Conversiones GA4' },
  { id: 'gsc_clicks',       label: 'Clicks Orgánico' },
  { id: 'gsc_impressions',  label: 'Impresiones Orgánico' },
]

const META_METRIC_DEFS: MetricDef[] = [
  { id: 'spend',       label: 'Inversión' },
  { id: 'conversions', label: 'Leads',        onlyLeads: true },
  { id: 'purchases',   label: 'Compras',      onlyEcommerce: true },
  { id: 'cpl',         label: 'CPL',          onlyLeads: true },
  { id: 'roas',        label: 'ROAS' },
  { id: 'revenue',     label: 'Revenue',      onlyEcommerce: true },
  { id: 'clicks',      label: 'Clicks' },
  { id: 'impressions', label: 'Impresiones' },
  { id: 'ctr',         label: 'CTR' },
  { id: 'cpc',         label: 'CPC' },
  { id: 'cpp',         label: 'CPM' },
  { id: 'reach',       label: 'Alcance' },
]

const ORGANICO_METRIC_DEFS: MetricDef[] = [
  { id: 'gsc_clicks',      label: 'Clicks' },
  { id: 'gsc_impressions', label: 'Impresiones' },
  { id: 'gsc_ctr',         label: 'CTR medio' },
  { id: 'gsc_position',    label: 'Posición media' },
]

const STEP_LABELS: Record<string, string> = {
  page_view:             'Page Views',
  view_content:          'View Content',
  add_to_cart:           'Add to Cart',
  initiate_checkout:     'Checkout',
  purchase:              'Compras',
  lead:                  'Leads',
  complete_registration: 'Registros',
  contact:               'Contactos',
  schedule:              'Citas',
  submit_application:    'Solicitudes',
  subscribe:             'Suscripciones',
}

// ── Config helpers ─────────────────────────────────────────────────────────────

function getDefaultConfig(tipo: TipoProyecto, funnelSteps: string[]): InformeConfig {
  if (tipo === 'ecommerce') {
    return {
      blocks:            ['resumen', 'meta', 'organico'],
      resumen_metrics:   ['meta_spend', 'meta_purchases', 'meta_roas', 'ga4_sessions'],
      meta_metrics:      ['spend', 'purchases', 'roas', 'revenue', 'clicks', 'ctr'],
      meta_show_funnel:  funnelSteps.length > 0,
      meta_funnel_steps: funnelSteps,
      organico_metrics:  ['gsc_clicks', 'gsc_impressions', 'gsc_ctr', 'gsc_position'],
    }
  }
  return {
    blocks:            ['resumen', 'meta', 'organico'],
    resumen_metrics:   ['meta_spend', 'meta_conversions', 'meta_cpl', 'ga4_sessions'],
    meta_metrics:      ['spend', 'conversions', 'cpl', 'clicks', 'ctr'],
    meta_show_funnel:  false,
    meta_funnel_steps: [],
    organico_metrics:  ['gsc_clicks', 'gsc_impressions', 'gsc_ctr', 'gsc_position'],
  }
}

function resolveConfig(raw: Partial<InformeConfig>, tipo: TipoProyecto, funnelSteps: string[]): InformeConfig {
  const defaults = getDefaultConfig(tipo, funnelSteps)
  if (!raw || Object.keys(raw).length === 0) return defaults
  return {
    blocks:            raw.blocks           ?? defaults.blocks,
    resumen_metrics:   raw.resumen_metrics  ?? defaults.resumen_metrics,
    meta_metrics:      raw.meta_metrics     ?? defaults.meta_metrics,
    meta_show_funnel:  raw.meta_show_funnel ?? defaults.meta_show_funnel,
    meta_funnel_steps: (raw.meta_funnel_steps && raw.meta_funnel_steps.length > 0)
      ? raw.meta_funnel_steps
      : (funnelSteps.length > 0 ? funnelSteps : defaults.meta_funnel_steps),
    organico_metrics:  raw.organico_metrics ?? defaults.organico_metrics,
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function prevMonth() {
  const now = new Date()
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfPrevMonth  = new Date(firstOfThisMonth.getTime() - 1)
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { desde: fmt(firstOfPrevMonth), hasta: fmt(lastOfPrevMonth) }
}

function fmtEur(n: number) {
  return `€${n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
function fmtPct(n: number) { return `${n.toFixed(2)}%` }

function filterMetrics(defs: MetricDef[], tipo: TipoProyecto) {
  const isEc = tipo === 'ecommerce'
  return defs.filter(m =>
    (!m.onlyLeads && !m.onlyEcommerce) ||
    (m.onlyLeads     && !isEc) ||
    (m.onlyEcommerce && isEc)
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-[#1a1a1a] text-white px-6 py-3 flex items-baseline justify-between">
      <span className="font-display text-base font-bold">{title}</span>
      {subtitle && <span className="font-mono text-[10px] text-white/50 tracking-wide">{subtitle}</span>}
    </div>
  )
}

function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8] border border-[#e8e8e8]">
      {children}
    </div>
  )
}

function EmptyKpi({ id, label, error }: { id: string; label: string; error?: string | null }) {
  return (
    <div key={id} className="bg-white p-5">
      <p className="font-mono text-[11px] tracking-[1px] uppercase font-bold mb-2 text-[#000000]">{label}</p>
      <p className="font-mono text-xs text-[#888888]">{error ? 'Error' : 'Sin datos'}</p>
    </div>
  )
}

function InformeCheckbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 border transition-colors ${
        checked
          ? 'border-[#000000] bg-[#000000] text-white'
          : 'border-[#e8e8e8] text-[#555555] hover:border-[#000000] hover:text-[#000000]'
      }`}
    >
      {checked && <Check className="w-3 h-3 shrink-0" />}
      <span className="font-mono text-[9px] uppercase tracking-wide whitespace-nowrap">{label}</span>
    </button>
  )
}

function FunnelStepCard({ label, value, prev }: { label: string; value: number; prev?: number }) {
  const pct = prev && prev > 0 ? ((value / prev) * 100).toFixed(1) : null
  return (
    <div className="flex-1 bg-white border border-[#e8e8e8] p-4 text-center min-w-[90px]">
      <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-1">{label}</p>
      <p className="font-display text-xl font-bold">{value.toLocaleString('es-ES')}</p>
      {pct && <p className="font-mono text-[9px] text-[#1a7a4a] mt-0.5">{pct}% conv.</p>}
    </div>
  )
}

// ── Metric renderers ──────────────────────────────────────────────────────────

function renderResumenMetric(id: string, data: InformeData) {
  const m = data.meta
  const g = data.ga4
  const s = data.gsc
  switch (id) {
    case 'meta_spend':
      return m
        ? <KpiCard key={id} label="Inversión Meta"   value={fmtEur(m.spend)}    prev={m.spend_prev} />
        : <EmptyKpi key={id} id={id} label="Inversión Meta" error={data.metaError} />
    case 'meta_conversions':
      return m
        ? <KpiCard key={id} label="Leads Meta"       value={m.conversions} />
        : <EmptyKpi key={id} id={id} label="Leads Meta" error={data.metaError} />
    case 'meta_purchases':
      return m
        ? <KpiCard key={id} label="Compras Meta"     value={m.purchases} />
        : <EmptyKpi key={id} id={id} label="Compras Meta" error={data.metaError} />
    case 'meta_cpl':
      return m
        ? <KpiCard key={id} label="CPL Meta"         value={fmtEur(m.cpl)}      prev={m.cpl_prev} invertColors />
        : <EmptyKpi key={id} id={id} label="CPL Meta" error={data.metaError} />
    case 'meta_roas':
      return m
        ? <KpiCard key={id} label="ROAS Meta"        value={m.roas > 0 ? `${m.roas.toFixed(2)}x` : '—'} />
        : <EmptyKpi key={id} id={id} label="ROAS Meta" error={data.metaError} />
    case 'meta_revenue':
      return m
        ? <KpiCard key={id} label="Revenue Meta"     value={fmtEur(m.revenue)}  prev={m.revenue_prev} />
        : <EmptyKpi key={id} id={id} label="Revenue Meta" error={data.metaError} />
    case 'meta_clicks':
      return m
        ? <KpiCard key={id} label="Clicks Meta"      value={m.clicks.toLocaleString('es-ES')} />
        : <EmptyKpi key={id} id={id} label="Clicks Meta" error={data.metaError} />
    case 'ga4_sessions':
      return g
        ? <KpiCard key={id} label="Sesiones GA4"     value={g.sessions}         prev={g.sessions_prev} />
        : <EmptyKpi key={id} id={id} label="Sesiones GA4" error={data.ga4Error} />
    case 'ga4_users':
      return g
        ? <KpiCard key={id} label="Usuarios GA4"     value={g.users}            prev={g.users_prev} />
        : <EmptyKpi key={id} id={id} label="Usuarios GA4" error={data.ga4Error} />
    case 'ga4_conversions':
      return g
        ? <KpiCard key={id} label="Conversiones GA4" value={g.conversions}      prev={g.conversions_prev} />
        : <EmptyKpi key={id} id={id} label="Conversiones GA4" error={data.ga4Error} />
    case 'gsc_clicks':
      return s
        ? <KpiCard key={id} label="Clicks Orgánico"  value={s.clicks}           prev={s.clicks_prev} />
        : <EmptyKpi key={id} id={id} label="Clicks Orgánico" error={data.gscError} />
    case 'gsc_impressions':
      return s
        ? <KpiCard key={id} label="Impresiones SEO"  value={s.impressions}      prev={s.impressions_prev} />
        : <EmptyKpi key={id} id={id} label="Impresiones SEO" error={data.gscError} />
    default: return null
  }
}

function renderMetaMetric(id: string, m: NonNullable<InformeData['meta']>) {
  switch (id) {
    case 'spend':       return <KpiCard key={id} label="Inversión"   value={fmtEur(m.spend)}                          prev={m.spend_prev} />
    case 'conversions': return <KpiCard key={id} label="Leads"       value={m.conversions} />
    case 'purchases':   return <KpiCard key={id} label="Compras"     value={m.purchases} />
    case 'cpl':         return <KpiCard key={id} label="CPL"         value={fmtEur(m.cpl)}                            prev={m.cpl_prev} invertColors />
    case 'roas':        return <KpiCard key={id} label="ROAS"        value={m.roas > 0 ? `${m.roas.toFixed(2)}x` : '—'} />
    case 'revenue':     return <KpiCard key={id} label="Revenue"     value={fmtEur(m.revenue)}                        prev={m.revenue_prev} />
    case 'clicks':      return <KpiCard key={id} label="Clicks"      value={m.clicks.toLocaleString('es-ES')} />
    case 'impressions': return <KpiCard key={id} label="Impresiones" value={m.impressions.toLocaleString('es-ES')} />
    case 'ctr':         return <KpiCard key={id} label="CTR"         value={fmtPct(m.ctr)} />
    case 'cpc':         return <KpiCard key={id} label="CPC"         value={fmtEur(m.cpc)}                            invertColors />
    case 'cpp':         return <KpiCard key={id} label="CPM"         value={fmtEur(m.cpp)}                            invertColors />
    case 'reach':       return <KpiCard key={id} label="Alcance"     value={m.reach.toLocaleString('es-ES')} />
    default: return null
  }
}

// ── Block components ──────────────────────────────────────────────────────────

function ResumenBlock({ data, metrics }: { data: InformeData; metrics: string[] }) {
  const rangeLabel = `${data.desde} → ${data.hasta}`
  return (
    <div className="border border-[#e8e8e8]">
      <SectionHeader title="Resumen Global" subtitle={rangeLabel} />
      <div className="bg-white">
        {metrics.length > 0 ? (
          <KpiGrid>
            {metrics.map(id => renderResumenMetric(id, data))}
          </KpiGrid>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="font-mono text-[10px] text-[#888888] uppercase tracking-wide">Sin métricas seleccionadas</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaBlock({
  data, metrics, showFunnel, funnelSteps,
}: {
  data: InformeData
  metrics: string[]
  showFunnel: boolean
  funnelSteps: string[]
}) {
  const rangeLabel = `${data.desde} → ${data.hasta}`
  const m = data.meta
  return (
    <div className="border border-[#e8e8e8]">
      <SectionHeader title="Meta Ads" subtitle={rangeLabel} />
      <div className="bg-white">
        {data.metaError && (
          <div className="px-6 py-4 border-b border-[#e8e8e8]">
            <p className="font-mono text-[10px] text-[#F7415C]">Error: {data.metaError}</p>
          </div>
        )}
        {m ? (
          <>
            {metrics.length > 0 && (
              <KpiGrid>
                {metrics.map(id => renderMetaMetric(id, m))}
              </KpiGrid>
            )}

            {/* Funnel */}
            {showFunnel && funnelSteps.length >= 2 && (
              <div className="p-6 border-t border-[#e8e8e8]">
                <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-4">
                  Funnel de conversión
                </p>
                <div className="flex gap-px overflow-x-auto">
                  {funnelSteps.map((step, i) => {
                    const val  = m.funnel?.steps?.[step] ?? 0
                    const prev = i > 0 ? (m.funnel?.steps?.[funnelSteps[i - 1]] || undefined) : undefined
                    return (
                      <FunnelStepCard
                        key={step}
                        label={STEP_LABELS[step] ?? step}
                        value={val}
                        prev={prev}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Campaign table */}
            {data.campaigns && data.campaigns.length > 0 && (
              <div className="overflow-x-auto border-t border-[#e8e8e8]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#e8e8e8]">
                      {['Campaña', 'Estado', 'Inversión', 'Clicks',
                        data.tipo_proyecto === 'ecommerce' ? 'Compras' : 'Leads',
                        data.tipo_proyecto === 'ecommerce' ? 'ROAS'    : 'CPL',
                      ].map(h => (
                        <th key={h} className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-[1px] text-[#888888]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns!.map(c => {
                      const isEc = data.tipo_proyecto === 'ecommerce'
                      return (
                        <tr key={c.id} className="border-b border-[#e8e8e8] hover:bg-[#fafafa] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[#000000] max-w-[180px] truncate">{c.nombre}</td>
                          <td className="px-4 py-3">
                            <span className={`font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 ${
                              c.estado === 'ACTIVE' ? 'bg-[#edfaf2] text-[#1a7a4a]' : 'bg-[#e8e8e8] text-[#888888]'
                            }`}>
                              {c.estado === 'ACTIVE' ? 'Activa' : 'Pausada'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{fmtEur(c.spend)}</td>
                          <td className="px-4 py-3 font-mono text-xs">{c.clicks.toLocaleString('es-ES')}</td>
                          <td className="px-4 py-3 font-mono text-xs">{isEc ? c.purchases : c.conversions}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {isEc
                              ? (c.roas > 0         ? `${c.roas.toFixed(2)}x` : '—')
                              : (c.conversions > 0  ? fmtEur(c.cpl)           : '—')
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : !data.metaError ? (
          <div className="px-6 py-8 text-center">
            <p className="font-mono text-[10px] text-[#888888] uppercase tracking-wide">Sin cuenta Meta Ads configurada</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function OrganicoBlock({ data, metrics }: { data: InformeData; metrics: string[] }) {
  const rangeLabel = `${data.desde} → ${data.hasta}`
  const s = data.gsc

  function renderMetric(id: string) {
    switch (id) {
      case 'gsc_clicks':
        return s
          ? <KpiCard key={id} label="Clicks"          value={s.clicks}                  prev={s.clicks_prev} />
          : <EmptyKpi key={id} id={id} label="Clicks" error={data.gscError} />
      case 'gsc_impressions':
        return s
          ? <KpiCard key={id} label="Impresiones"     value={s.impressions}             prev={s.impressions_prev} />
          : <EmptyKpi key={id} id={id} label="Impresiones" error={data.gscError} />
      case 'gsc_ctr':
        return s
          ? <KpiCard key={id} label="CTR medio"       value={fmtPct(s.ctr)} />
          : <EmptyKpi key={id} id={id} label="CTR medio" error={data.gscError} />
      case 'gsc_position':
        return s
          ? <KpiCard key={id} label="Posición media"  value={s.position.toFixed(1)}     invertColors />
          : <EmptyKpi key={id} id={id} label="Posición media" error={data.gscError} />
      default: return null
    }
  }

  return (
    <div className="border border-[#e8e8e8]">
      <SectionHeader title="Orgánico (SEO)" subtitle={rangeLabel} />
      <div className="bg-white">
        {data.gscError && (
          <div className="px-6 py-4">
            <p className="font-mono text-[10px] text-[#F7415C]">Error: {data.gscError}</p>
          </div>
        )}
        {metrics.length > 0 && (!data.gscError || s) ? (
          <KpiGrid>
            {metrics.map(id => renderMetric(id))}
          </KpiGrid>
        ) : !data.gscError ? (
          <div className="px-6 py-8 text-center">
            <p className="font-mono text-[10px] text-[#888888] uppercase tracking-wide">Sin Search Console configurado</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

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

// ── Config Panel ──────────────────────────────────────────────────────────────

const BLOCK_DEFS = [
  { id: 'resumen',  label: 'Resumen Global' },
  { id: 'meta',     label: 'Meta Ads' },
  { id: 'gads',     label: 'Google Ads' },
  { id: 'organico', label: 'Orgánico (SEO)' },
]

function ConfigPanel({
  config, onChange, onSave, onClose, saving, tipoProyecto, availableFunnelSteps,
}: {
  config: InformeConfig
  onChange: (c: InformeConfig) => void
  onSave: () => void
  onClose: () => void
  saving: boolean
  tipoProyecto: TipoProyecto
  availableFunnelSteps: string[]
}) {
  const isEcommerce = tipoProyecto === 'ecommerce'

  function toggleBlock(id: string) {
    const next = config.blocks.includes(id)
      ? config.blocks.filter(b => b !== id)
      : [...config.blocks, id]
    onChange({ ...config, blocks: next })
  }

  function toggleMetric(key: 'resumen_metrics' | 'meta_metrics' | 'organico_metrics', id: string) {
    const curr = config[key]
    const next = curr.includes(id) ? curr.filter(m => m !== id) : [...curr, id]
    onChange({ ...config, [key]: next })
  }

  function toggleFunnelStep(step: string) {
    const curr = config.meta_funnel_steps
    const next = curr.includes(step) ? curr.filter(s => s !== step) : [...curr, step]
    onChange({ ...config, meta_funnel_steps: next })
  }

  const visibleResumenMetrics = filterMetrics(RESUMEN_METRIC_DEFS, tipoProyecto)
  const visibleMetaMetrics    = filterMetrics(META_METRIC_DEFS,    tipoProyecto)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[500px] bg-white flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8] shrink-0">
          <div>
            <h3 className="font-display text-base font-bold">Configurar informe</h3>
            <p className="font-mono text-[9px] text-[#888888] mt-0.5 uppercase tracking-wide">
              Selecciona bloques y métricas
            </p>
          </div>
          <button onClick={onClose} className="text-[#888888] hover:text-[#000000] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Block toggles */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[2px] text-[#888888] mb-3">Secciones activas</p>
            <div className="flex flex-wrap gap-1.5">
              {BLOCK_DEFS.map(b => (
                <InformeCheckbox
                  key={b.id}
                  checked={config.blocks.includes(b.id)}
                  label={b.label}
                  onChange={() => toggleBlock(b.id)}
                />
              ))}
            </div>
          </div>

          {/* Resumen metrics */}
          {config.blocks.includes('resumen') && (
            <div className="border-t border-[#e8e8e8] pt-6">
              <p className="font-display text-sm font-bold mb-0.5">Resumen Global</p>
              <p className="font-mono text-[9px] text-[#888888] uppercase tracking-wide mb-3">Métricas a mostrar</p>
              <div className="flex flex-wrap gap-1.5">
                {visibleResumenMetrics.map(m => (
                  <InformeCheckbox
                    key={m.id}
                    checked={config.resumen_metrics.includes(m.id)}
                    label={m.label}
                    onChange={() => toggleMetric('resumen_metrics', m.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Meta metrics */}
          {config.blocks.includes('meta') && (
            <div className="border-t border-[#e8e8e8] pt-6">
              <p className="font-display text-sm font-bold mb-0.5">Meta Ads</p>
              <p className="font-mono text-[9px] text-[#888888] uppercase tracking-wide mb-3">Métricas a mostrar</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {visibleMetaMetrics.map(m => (
                  <InformeCheckbox
                    key={m.id}
                    checked={config.meta_metrics.includes(m.id)}
                    label={m.label}
                    onChange={() => toggleMetric('meta_metrics', m.id)}
                  />
                ))}
              </div>

              {/* Funnel config */}
              {availableFunnelSteps.length > 0 && (
                <div className="bg-[#f9f9f9] border border-[#e8e8e8] p-4">
                  <p className="font-mono text-[9px] text-[#888888] uppercase tracking-wide mb-3">
                    Funnel de conversión
                  </p>
                  <div className="mb-3">
                    <InformeCheckbox
                      checked={config.meta_show_funnel}
                      label="Mostrar funnel"
                      onChange={() => onChange({ ...config, meta_show_funnel: !config.meta_show_funnel })}
                    />
                  </div>
                  {config.meta_show_funnel && (
                    <>
                      <p className="font-mono text-[9px] text-[#888888] uppercase tracking-wide mb-2 mt-4">
                        Pasos a mostrar
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableFunnelSteps.map(step => (
                          <InformeCheckbox
                            key={step}
                            checked={config.meta_funnel_steps.includes(step)}
                            label={STEP_LABELS[step] ?? step}
                            onChange={() => toggleFunnelStep(step)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Orgánico metrics */}
          {config.blocks.includes('organico') && (
            <div className="border-t border-[#e8e8e8] pt-6">
              <p className="font-display text-sm font-bold mb-0.5">Orgánico (SEO)</p>
              <p className="font-mono text-[9px] text-[#888888] uppercase tracking-wide mb-3">Métricas a mostrar</p>
              <div className="flex flex-wrap gap-1.5">
                {ORGANICO_METRIC_DEFS.map(m => (
                  <InformeCheckbox
                    key={m.id}
                    checked={config.organico_metrics.includes(m.id)}
                    label={m.label}
                    onChange={() => toggleMetric('organico_metrics', m.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e8e8e8] shrink-0">
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full font-mono text-[10px] uppercase tracking-wide bg-[#F7415C] text-white py-2.5 hover:bg-[#000000] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Loading / Error ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="p-8 space-y-8">
      <div className="h-8 w-48 bg-[#e8e8e8] animate-pulse" />
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-[#e8e8e8]">
            <div className="h-10 bg-[#e8e8e8] animate-pulse" />
            <div className="grid grid-cols-4 gap-px bg-[#e8e8e8]">
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
  const [editConfig, setEditConfig] = useState<InformeConfig | null>(null)
  const [saving,     setSaving]     = useState(false)

  const [desde, setDesde] = useState(() => prevMonth().desde)
  const [hasta,  setHasta]  = useState(() => prevMonth().hasta)

  const fetchData = useCallback(async (d: string, h: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/clientes/${clienteId}/informe?desde=${d}&hasta=${h}`)
      const json: InformeData = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    fetchData(desde, hasta)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openConfig() {
    if (!data) return
    setEditConfig(resolveConfig(data.informe_config, data.tipo_proyecto, data.funnel_steps))
    setConfigOpen(true)
  }

  async function saveConfig() {
    if (!editConfig) return
    setSaving(true)
    await fetch(`/api/clientes/${clienteId}/informe`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ informe_config: editConfig }),
    })
    if (data) setData({ ...data, informe_config: editConfig })
    setSaving(false)
    setConfigOpen(false)
  }

  if (loading) return <LoadingState />
  if (!data)   return null

  const config = resolveConfig(data.informe_config, data.tipo_proyecto, data.funnel_steps)

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#000000]">
        <div>
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-1">Informe por periodo</p>
          <h2 className="font-display text-2xl font-bold">Informe</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wide text-[#888888]">Desde</label>
            <input
              type="date" value={desde}
              onChange={e => setDesde(e.target.value)}
              className="font-mono text-[10px] border border-[#e8e8e8] px-2 py-1.5 focus:outline-none focus:border-[#000000] transition-colors"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wide text-[#888888]">Hasta</label>
            <input
              type="date" value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="font-mono text-[10px] border border-[#e8e8e8] px-2 py-1.5 focus:outline-none focus:border-[#000000] transition-colors"
            />
          </div>
          <button
            onClick={() => fetchData(desde, hasta)}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide bg-[#F7415C] text-white px-3 py-2 hover:bg-[#000000] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Actualizar
          </button>
          <button
            onClick={openConfig}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#000000] border border-[#e8e8e8] hover:border-[#000000] px-3 py-2 transition-colors"
          >
            <Settings className="w-3 h-3" />
            Configurar
          </button>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-6">
        {config.blocks.includes('resumen') && (
          <ResumenBlock data={data} metrics={config.resumen_metrics} />
        )}
        {config.blocks.includes('meta') && (
          <MetaBlock
            data={data}
            metrics={config.meta_metrics}
            showFunnel={config.meta_show_funnel}
            funnelSteps={config.meta_funnel_steps}
          />
        )}
        {config.blocks.includes('gads') && <GadsBlock />}
        {config.blocks.includes('organico') && (
          <OrganicoBlock data={data} metrics={config.organico_metrics} />
        )}
        {config.blocks.length === 0 && (
          <div className="border border-dashed border-[#e8e8e8] p-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[#888888] mb-3">Sin bloques seleccionados</p>
            <button
              onClick={openConfig}
              className="font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-4 py-2 hover:bg-[#F7415C] transition-colors"
            >
              Configurar informe
            </button>
          </div>
        )}
      </div>

      {/* Config panel */}
      {configOpen && editConfig && (
        <ConfigPanel
          config={editConfig}
          onChange={setEditConfig}
          onSave={saveConfig}
          onClose={() => setConfigOpen(false)}
          saving={saving}
          tipoProyecto={data.tipo_proyecto}
          availableFunnelSteps={data.funnel_steps}
        />
      )}
    </div>
  )
}
