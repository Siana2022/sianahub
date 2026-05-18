'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente, TipoProyecto } from '@/types/cliente'

interface Props { cliente?: Cliente }

interface MetaEvent {
  value:  string
  label:  string
  type:   'standard' | 'custom'
  count?: number
}

interface FormState {
  nombre: string; dominio: string; estado: 'active' | 'paused' | 'churned'
  notas: string; alertas_activas: boolean; gads_via_mcc: boolean
  tipo_proyecto: TipoProyecto
  meta_conversion_events: string[]
  meta_funnel_steps: string[]
  ga4_property_id: string; ga4_account_id: string; gads_customer_id: string
  ga4_conversion_events: string
  gsc_site_url: string; gtm_account_id: string; gtm_container_id: string
  meta_ad_account_id: string; meta_pixel_id: string
  sgtm_url: string; sgtm_service_name: string; gcp_project_id: string; slack_channel_id: string
}

// ── Meta event presets ─────────────────────────────────────────────────────────
const META_LEAD_EVENTS = [
  { value: 'lead',                  label: 'Lead (formulario Meta)' },
  { value: 'complete_registration', label: 'Registro completado' },
  { value: 'contact',               label: 'Contacto' },
  { value: 'schedule',              label: 'Cita programada' },
  { value: 'submit_application',    label: 'Solicitud enviada' },
  { value: 'subscribe',             label: 'Suscripción' },
  { value: 'start_trial',           label: 'Trial iniciado (Financiación)' },
  { value: 'find_location',         label: 'Find Location' },
]

const META_ECOMMERCE_EVENTS = [
  { value: 'purchase',              label: 'Compra (Purchase)' },
  { value: 'add_to_cart',           label: 'Añadir al carrito' },
  { value: 'initiate_checkout',     label: 'Iniciar pago' },
  { value: 'complete_registration', label: 'Registro completado' },
]

const FUNNEL_STEPS_LEADS = [
  { value: 'page_view',             label: 'Page Views' },
  { value: 'view_content',          label: 'View Content' },
  { value: 'lead',                  label: 'Lead' },
  { value: 'complete_registration', label: 'Registro completado' },
  { value: 'contact',               label: 'Contacto' },
  { value: 'schedule',              label: 'Cita programada' },
  { value: 'submit_application',    label: 'Solicitud enviada' },
  { value: 'start_trial',           label: 'Trial iniciado' },
]

const FUNNEL_STEPS_ECOMMERCE = [
  { value: 'page_view',         label: 'Page Views' },
  { value: 'view_content',      label: 'View Content' },
  { value: 'add_to_cart',       label: 'Add to Cart' },
  { value: 'initiate_checkout', label: 'Checkout' },
  { value: 'purchase',          label: 'Compra' },
]

const DEFAULT_FUNNEL_STEPS_LEADS     = ['page_view', 'view_content', 'lead']
const DEFAULT_FUNNEL_STEPS_ECOMMERCE = ['view_content', 'add_to_cart', 'initiate_checkout', 'purchase']
const DEFAULT_LEAD_EVENT             = 'lead'
const DEFAULT_PURCHASE_EVENT         = 'purchase'

interface GA4Property { id: string; name: string; account: string }
interface GSCSite     { url: string; permission: string }

function toFormState(c?: Cliente): FormState {
  return {
    nombre:                c?.nombre                ?? '',
    dominio:               c?.dominio               ?? '',
    estado:                c?.estado                ?? 'active',
    notas:                 c?.notas                 ?? '',
    alertas_activas:       c?.alertas_activas       ?? true,
    gads_via_mcc:          c?.gads_via_mcc          ?? true,
    tipo_proyecto:          c?.tipo_proyecto ?? 'leads',
    // Read from conversion_events array first; fall back to wrapping single conversion_event
    meta_conversion_events: c?.meta_events_config?.conversion_events?.length
      ? c.meta_events_config.conversion_events
      : c?.meta_events_config?.conversion_event
        ? [c.meta_events_config.conversion_event]
        : [],
    meta_funnel_steps:      c?.meta_events_config?.funnel_steps ??
      (c?.tipo_proyecto === 'ecommerce' ? DEFAULT_FUNNEL_STEPS_ECOMMERCE : DEFAULT_FUNNEL_STEPS_LEADS),
    ga4_property_id:       c?.ga4_property_id       ?? '',
    ga4_account_id:        c?.ga4_account_id        ?? '',
    ga4_conversion_events: c?.ga4_conversion_events ?? '',
    gads_customer_id:      c?.gads_customer_id      ?? '',
    gsc_site_url:          c?.gsc_site_url           ?? '',
    gtm_account_id:        c?.gtm_account_id         ?? '',
    gtm_container_id:      c?.gtm_container_id       ?? '',
    meta_ad_account_id:    c?.meta_ad_account_id     ?? '',
    meta_pixel_id:         c?.meta_pixel_id          ?? '',
    sgtm_url:              c?.sgtm_url              ?? '',
    sgtm_service_name:     c?.sgtm_service_name     ?? '',
    gcp_project_id:        c?.gcp_project_id        ?? '',
    slack_channel_id:      c?.slack_channel_id      ?? '',
  }
}

const nullIfEmpty = (v: string) => v.trim() === '' ? null : v.trim()

const inputCls  = "w-full border border-[#e8e8e8] bg-white px-3 py-2 text-sm text-[#000000] placeholder-[#888888] focus:outline-none focus:border-[#000000] transition-colors font-mono"
const selectCls = "w-full border border-[#e8e8e8] bg-white px-3 py-2 text-sm text-[#000000] focus:outline-none focus:border-[#000000] transition-colors"
const labelCls  = "block font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888] mb-1.5"

export default function ClienteForm({ cliente }: Props) {
  const [form, setForm]         = useState<FormState>(toFormState(cliente))
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [ga4Props, setGa4Props] = useState<GA4Property[]>([])
  const [gscSites, setGscSites] = useState<GSCSite[]>([])
  const [googleOk, setGoogleOk]       = useState<boolean | null>(null)
  const [ga4ApiError, setGa4ApiError] = useState<string | null>(null)

  // Meta event detection
  const [metaEvents, setMetaEvents]               = useState<MetaEvent[] | null>(null)
  const [metaEventsLoading, setMetaEventsLoading] = useState(false)
  const [metaEventsError, setMetaEventsError]     = useState<string | null>(null)

  const router = useRouter()
  const isEdit = !!cliente

  // Auto-detect Meta events if account ID already set (edit mode)
  useEffect(() => {
    if (cliente?.meta_ad_account_id) {
      detectMetaEvents(cliente.meta_ad_account_id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load Google properties on mount
  useEffect(() => {
    fetch('/api/google/properties')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setGoogleOk(false); return }
        setGa4Props(data.ga4Properties ?? [])
        setGscSites(data.gscSites ?? [])
        setGa4ApiError(data.ga4Error ?? null)
        setGoogleOk(true)
      })
      .catch(() => setGoogleOk(false))
  }, [])

  // When tipo_proyecto changes, reset to sensible defaults
  function handleTipoProyecto(tipo: TipoProyecto) {
    setForm(f => ({
      ...f,
      tipo_proyecto:          tipo,
      meta_conversion_events: [],
      meta_funnel_steps:      tipo === 'ecommerce'
        ? DEFAULT_FUNNEL_STEPS_ECOMMERCE
        : DEFAULT_FUNNEL_STEPS_LEADS,
    }))
  }

  async function detectMetaEvents(accountId?: string) {
    const id = (accountId ?? form.meta_ad_account_id).replace(/^act_/, '').trim()
    if (!id) return
    setMetaEventsLoading(true)
    setMetaEventsError(null)
    try {
      const res  = await fetch(`/api/meta/events?account_id=${id}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMetaEvents(data.events ?? [])
    } catch (e) {
      setMetaEventsError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setMetaEventsLoading(false)
    }
  }

  function toggleConversionEvent(evt: string) {
    setForm(f => {
      const curr = f.meta_conversion_events
      return {
        ...f,
        meta_conversion_events: curr.includes(evt)
          ? curr.filter(e => e !== evt)
          : [...curr, evt],
      }
    })
  }

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm(f => ({ ...f, [key]: value }))
    }
  }

  function toggleFunnelStep(step: string) {
    setForm(f => {
      const current = f.meta_funnel_steps
      return {
        ...f,
        meta_funnel_steps: current.includes(step)
          ? current.filter(s => s !== step)
          : [...current, step],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)

    // Resolve conversion events — default to single event if nothing selected
    const defaultEvent = form.tipo_proyecto === 'ecommerce' ? DEFAULT_PURCHASE_EVENT : DEFAULT_LEAD_EVENT
    const conversionEvents = form.meta_conversion_events.length > 0
      ? form.meta_conversion_events
      : [defaultEvent]

    const defaultFunnel = form.tipo_proyecto === 'ecommerce'
      ? DEFAULT_FUNNEL_STEPS_ECOMMERCE
      : DEFAULT_FUNNEL_STEPS_LEADS
    const funnelSteps = form.meta_funnel_steps.length > 0
      ? form.meta_funnel_steps
      : defaultFunnel

    const payload = {
      nombre:             form.nombre,
      dominio:            nullIfEmpty(form.dominio),
      estado:             form.estado,
      notas:              nullIfEmpty(form.notas),
      alertas_activas:    form.alertas_activas,
      gads_via_mcc:       form.gads_via_mcc,
      tipo_proyecto:      form.tipo_proyecto,
      meta_events_config: {
        conversion_event:  conversionEvents[0],   // backward compat
        conversion_events: conversionEvents,
        funnel_steps:      funnelSteps,
      },
      ga4_property_id:       nullIfEmpty(form.ga4_property_id),
      ga4_account_id:        nullIfEmpty(form.ga4_account_id),
      ga4_conversion_events: nullIfEmpty(form.ga4_conversion_events),
      gads_customer_id:      nullIfEmpty(form.gads_customer_id),
      gsc_site_url:          nullIfEmpty(form.gsc_site_url),
      gtm_account_id:        nullIfEmpty(form.gtm_account_id),
      gtm_container_id:      nullIfEmpty(form.gtm_container_id),
      meta_ad_account_id:    nullIfEmpty(form.meta_ad_account_id),
      meta_pixel_id:         nullIfEmpty(form.meta_pixel_id),
      sgtm_url:              nullIfEmpty(form.sgtm_url),
      sgtm_service_name:     nullIfEmpty(form.sgtm_service_name),
      gcp_project_id:        nullIfEmpty(form.gcp_project_id),
      slack_channel_id:      nullIfEmpty(form.slack_channel_id),
    }
    const res = await fetch(isEdit ? `/api/clientes/${cliente.id}` : '/api/clientes', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error desconocido')
      setLoading(false); return
    }
    const data = await res.json()
    router.push(`/clientes/${data.id}`)
    router.refresh()
  }

  const eventOptions = form.tipo_proyecto === 'ecommerce' ? META_ECOMMERCE_EVENTS : META_LEAD_EVENTS

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* GENERAL */}
      <section className="space-y-5">
        <div className="flex items-baseline gap-3 pb-3 border-b-2 border-[#000000]">
          <h2 className="font-display text-lg font-bold">General</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input value={form.nombre} onChange={set('nombre')} required placeholder="Nombre del cliente" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Dominio</label>
            <input value={form.dominio} onChange={set('dominio')} placeholder="ejemplo.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tipo de proyecto</label>
            <select
              value={form.tipo_proyecto}
              onChange={e => handleTipoProyecto(e.target.value as TipoProyecto)}
              className={selectCls}
            >
              <option value="leads">Captación de leads</option>
              <option value="ecommerce">Ecommerce</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select value={form.estado} onChange={set('estado')} className={selectCls}>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="churned">Churn</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Slack Channel ID</label>
            <input value={form.slack_channel_id} onChange={set('slack_channel_id')} placeholder="C0123456789" className={inputCls} />
          </div>
        </div>
        <div className="flex gap-6">
          {[
            { key: 'alertas_activas' as const, label: 'Alertas activas' },
            { key: 'gads_via_mcc'    as const, label: 'Google Ads vía MCC' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-[#555555] cursor-pointer">
              <input type="checkbox" checked={form[key] as boolean} onChange={set(key)} className="accent-[#F7415C]" />
              {label}
            </label>
          ))}
        </div>
        <div>
          <label className={labelCls}>Notas internas</label>
          <textarea value={form.notas} onChange={set('notas')} rows={3} placeholder="Notas internas..."
            className="w-full border border-[#e8e8e8] bg-white px-3 py-2 text-sm text-[#000000] placeholder-[#888888] focus:outline-none focus:border-[#000000] transition-colors resize-none" />
        </div>
      </section>

      {/* GOOGLE */}
      <section className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#000000]">
          <h2 className="font-display text-lg font-bold">Google</h2>
          {googleOk === false && (
            <a href="/config" className="font-mono text-[9px] uppercase tracking-wide text-[#F7415C] hover:underline">
              Conectar Google primero →
            </a>
          )}
          {googleOk === true && (
            <span className="font-mono text-[9px] uppercase tracking-wide text-[#1a7a4a]">✓ Cuenta conectada</span>
          )}
          {googleOk === null && (
            <span className="font-mono text-[9px] uppercase tracking-wide text-[#888888]">Cargando propiedades…</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>GA4 Property</label>
            {googleOk === true && ga4Props.length > 0 ? (
              <select value={form.ga4_property_id} onChange={set('ga4_property_id')} className={selectCls}>
                <option value="">— Selecciona una propiedad —</option>
                {ga4Props.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) · {p.account}
                  </option>
                ))}
              </select>
            ) : (
              <input value={form.ga4_property_id} onChange={set('ga4_property_id')}
                placeholder={googleOk === null ? 'Cargando...' : 'properties/123456789'}
                className={inputCls} />
            )}
            {ga4ApiError && (
              <p className="mt-1.5 font-mono text-[9px] text-[#F7415C]">
                API no disponible — habilita &ldquo;Google Analytics Admin API&rdquo; en{' '}
                <a href="https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com"
                   target="_blank" rel="noreferrer" className="underline">GCP Console</a>
                {' '}y vuelve a conectar Google en{' '}
                <a href="/config" className="underline">Configuración</a>.
              </p>
            )}
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Search Console Site</label>
            {googleOk === true && gscSites.length > 0 ? (
              <select value={form.gsc_site_url} onChange={set('gsc_site_url')} className={selectCls}>
                <option value="">— Selecciona un sitio —</option>
                {gscSites.map(s => (
                  <option key={s.url} value={s.url}>
                    {s.url} · {s.permission}
                  </option>
                ))}
              </select>
            ) : (
              <input value={form.gsc_site_url} onChange={set('gsc_site_url')}
                placeholder={googleOk === null ? 'Cargando...' : 'https://cliente.com'}
                className={inputCls} />
            )}
          </div>

          <div>
            <label className={labelCls}>Google Ads Customer ID</label>
            <input value={form.gads_customer_id} onChange={set('gads_customer_id')} placeholder="123-456-7890" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>GA4 Account ID</label>
            <input value={form.ga4_account_id} onChange={set('ga4_account_id')} placeholder="accounts/123456" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>GTM Container ID</label>
            <input value={form.gtm_container_id} onChange={set('gtm_container_id')} placeholder="GTM-XXXXXXX" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>GTM Account ID</label>
            <input value={form.gtm_account_id} onChange={set('gtm_account_id')} placeholder="123456" className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Eventos de conversión GA4</label>
            <input value={form.ga4_conversion_events} onChange={set('ga4_conversion_events')}
              placeholder="generate_lead, purchase, form_submit"
              className={inputCls} />
            <p className="mt-1 font-mono text-[9px] text-[#888888]">Separados por coma. Si se deja vacío se usan las conversiones marcadas en GA4.</p>
          </div>
        </div>
      </section>

      {/* META */}
      <section className="space-y-5">
        <div className="pb-3 border-b-2 border-[#000000]">
          <h2 className="font-display text-lg font-bold">Meta</h2>
        </div>

        {/* IDs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ad Account ID</label>
            <input value={form.meta_ad_account_id} onChange={set('meta_ad_account_id')} placeholder="act_123456789" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Pixel ID</label>
            <input value={form.meta_pixel_id} onChange={set('meta_pixel_id')} placeholder="123456789" className={inputCls} />
          </div>
        </div>

        {/* Event config */}
        <div className="bg-[#fafafa] border border-[#e8e8e8] p-5 space-y-5">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888]">Configuración de eventos</p>

          {/* Conversion events — dynamic from Meta API */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>
                {form.tipo_proyecto === 'ecommerce' ? 'Evento de conversión principal' : 'Eventos de conversión (leads)'}
              </label>
              <button
                type="button"
                onClick={() => detectMetaEvents()}
                disabled={!form.meta_ad_account_id.trim() || metaEventsLoading}
                className="font-mono text-[9px] uppercase tracking-wide px-2.5 py-1 border border-[#e8e8e8] text-[#555555] hover:border-[#000000] hover:text-[#000000] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {metaEventsLoading ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 border border-[#888888] border-t-transparent rounded-full animate-spin" />
                    Detectando…
                  </>
                ) : (
                  <>↻ Detectar eventos de la cuenta</>
                )}
              </button>
            </div>

            {/* Error state */}
            {metaEventsError && (
              <p className="mb-2 font-mono text-[9px] text-[#F7415C]">Error: {metaEventsError}</p>
            )}

            {/* No account ID yet */}
            {!form.meta_ad_account_id.trim() && (
              <p className="mb-2 font-mono text-[9px] text-[#888888]">
                Introduce el Ad Account ID para detectar los eventos reales de esta cuenta.
              </p>
            )}

            {/* Event checkboxes */}
            {(() => {
              // Build display list: detected events + any already-selected not in list
              const detected = metaEvents ?? []
              const detectedValues = new Set(detected.map(e => e.value))
              const savedButNotDetected: MetaEvent[] = form.meta_conversion_events
                .filter(v => !detectedValues.has(v))
                .map(v => ({ value: v, label: v, type: 'standard' as const }))
              const displayList = detected.length > 0
                ? [...detected, ...savedButNotDetected]
                : eventOptions.map(e => ({ ...e, type: 'standard' as const, count: undefined }))

              return (
                <div className="space-y-1">
                  {displayList.map(e => {
                    const checked = form.meta_conversion_events.includes(e.value)
                    return (
                      <label
                        key={e.value}
                        className={`flex items-center gap-3 px-3 py-2 border cursor-pointer transition-colors ${
                          checked
                            ? 'border-[#000000] bg-[#000000]'
                            : 'border-[#e8e8e8] hover:border-[#555555]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleConversionEvent(e.value)}
                          className="accent-[#F7415C] shrink-0"
                        />
                        <span className={`font-mono text-xs flex-1 ${checked ? 'text-white' : 'text-[#000000]'}`}>
                          {e.label}
                        </span>
                        {e.count !== undefined && e.count > 0 && (
                          <span className={`font-mono text-[9px] px-1.5 py-0.5 ${
                            checked ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#888888]'
                          }`}>
                            {e.count.toLocaleString('es-ES')} eventos
                          </span>
                        )}
                        {e.type === 'custom' && (
                          <span className={`font-mono text-[9px] px-1.5 py-0.5 ${
                            checked ? 'bg-white/20 text-white' : 'bg-[#fef8ed] text-[#d4820a]'
                          }`}>
                            custom
                          </span>
                        )}
                      </label>
                    )
                  })}
                  {detected.length > 0 && (
                    <p className="pt-1 font-mono text-[9px] text-[#888888]">
                      {detected.length} evento{detected.length !== 1 ? 's' : ''} detectado{detected.length !== 1 ? 's' : ''} en esta cuenta
                    </p>
                  )}
                </div>
              )
            })()}

            <p className="mt-2 font-mono text-[9px] text-[#888888]">
              {form.tipo_proyecto === 'ecommerce'
                ? 'Selecciona el evento principal de compra.'
                : 'Selecciona uno o varios eventos — se sumarán como leads totales en todos los reportes.'}
            </p>
            {form.meta_conversion_events.length > 1 && (
              <p className="mt-1 font-mono text-[9px] text-[#1a7a4a]">
                ✓ {form.meta_conversion_events.length} eventos seleccionados — se sumarán automáticamente
              </p>
            )}
          </div>

          {/* Funnel steps — all project types */}
          <div>
            <label className={labelCls}>Pasos del funnel a visualizar</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {(form.tipo_proyecto === 'ecommerce' ? FUNNEL_STEPS_ECOMMERCE : FUNNEL_STEPS_LEADS).map(step => (
                <label key={step.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.meta_funnel_steps.includes(step.value)}
                    onChange={() => toggleFunnelStep(step.value)}
                    className="accent-[#F7415C]"
                  />
                  <span className="font-mono text-xs text-[#555555]">{step.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 font-mono text-[9px] text-[#888888]">
              Los pasos seleccionados aparecen en el funnel dentro de Meta Ads.
            </p>
          </div>
        </div>
      </section>

      {/* sGTM */}
      <section className="space-y-5">
        <div className="pb-3 border-b-2 border-[#000000]">
          <h2 className="font-display text-lg font-bold">sGTM / Google Cloud</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>sGTM URL</label>
            <input value={form.sgtm_url} onChange={set('sgtm_url')} placeholder="https://sgtm.sianadigital.com/cliente" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Service Name (Cloud Run)</label>
            <input value={form.sgtm_service_name} onChange={set('sgtm_service_name')} placeholder="sgtm-cliente-nombre" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>GCP Project ID</label>
            <input value={form.gcp_project_id} onChange={set('gcp_project_id')} placeholder="siana-digital-prod" className={inputCls} />
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-[#fff0f2] border border-[#F7415C] border-l-4 border-l-[#F7415C] px-4 py-3">
          <p className="font-mono text-xs text-[#F7415C]">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="font-mono text-[10px] uppercase tracking-wide bg-[#000000] text-white px-6 py-2.5 hover:bg-[#F7415C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="font-mono text-[10px] uppercase tracking-wide text-[#888888] hover:text-[#000000] border border-[#e8e8e8] hover:border-[#000000] px-6 py-2.5 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
