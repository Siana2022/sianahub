'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente } from '@/types/cliente'

interface Props { cliente?: Cliente }

interface FormState {
  nombre: string; dominio: string; estado: 'active' | 'paused' | 'churned'
  notas: string; alertas_activas: boolean; gads_via_mcc: boolean
  ga4_property_id: string; ga4_account_id: string; gads_customer_id: string
  gsc_site_url: string; gtm_account_id: string; gtm_container_id: string
  meta_ad_account_id: string; meta_pixel_id: string
  sgtm_url: string; sgtm_service_name: string; gcp_project_id: string; slack_channel_id: string
}

interface GA4Property { id: string; name: string; account: string }
interface GSCSite     { url: string; permission: string }

function toFormState(c?: Cliente): FormState {
  return {
    nombre: c?.nombre ?? '', dominio: c?.dominio ?? '',
    estado: c?.estado ?? 'active', notas: c?.notas ?? '',
    alertas_activas: c?.alertas_activas ?? true, gads_via_mcc: c?.gads_via_mcc ?? true,
    ga4_property_id: c?.ga4_property_id ?? '', ga4_account_id: c?.ga4_account_id ?? '',
    gads_customer_id: c?.gads_customer_id ?? '', gsc_site_url: c?.gsc_site_url ?? '',
    gtm_account_id: c?.gtm_account_id ?? '', gtm_container_id: c?.gtm_container_id ?? '',
    meta_ad_account_id: c?.meta_ad_account_id ?? '', meta_pixel_id: c?.meta_pixel_id ?? '',
    sgtm_url: c?.sgtm_url ?? '', sgtm_service_name: c?.sgtm_service_name ?? '',
    gcp_project_id: c?.gcp_project_id ?? '', slack_channel_id: c?.slack_channel_id ?? '',
  }
}

const nullIfEmpty = (v: string) => v.trim() === '' ? null : v.trim()

const inputCls  = "w-full border border-[#e2dfd8] bg-white px-3 py-2 text-sm text-[#1a1a18] placeholder-[#9a9a8e] focus:outline-none focus:border-[#1a1a18] transition-colors font-mono"
const selectCls = "w-full border border-[#e2dfd8] bg-white px-3 py-2 text-sm text-[#1a1a18] focus:outline-none focus:border-[#1a1a18] transition-colors"
const labelCls  = "block font-mono text-[9px] tracking-[1.5px] uppercase text-[#9a9a8e] mb-1.5"

export default function ClienteForm({ cliente }: Props) {
  const [form, setForm]         = useState<FormState>(toFormState(cliente))
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [ga4Props, setGa4Props] = useState<GA4Property[]>([])
  const [gscSites, setGscSites] = useState<GSCSite[]>([])
  const [googleOk, setGoogleOk] = useState<boolean | null>(null)
  const [ga4ApiError, setGa4ApiError] = useState<string | null>(null)
  const router = useRouter()
  const isEdit = !!cliente

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

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm(f => ({ ...f, [key]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const payload = {
      nombre: form.nombre, dominio: nullIfEmpty(form.dominio),
      estado: form.estado, notas: nullIfEmpty(form.notas),
      alertas_activas: form.alertas_activas, gads_via_mcc: form.gads_via_mcc,
      ga4_property_id: nullIfEmpty(form.ga4_property_id), ga4_account_id: nullIfEmpty(form.ga4_account_id),
      gads_customer_id: nullIfEmpty(form.gads_customer_id), gsc_site_url: nullIfEmpty(form.gsc_site_url),
      gtm_account_id: nullIfEmpty(form.gtm_account_id), gtm_container_id: nullIfEmpty(form.gtm_container_id),
      meta_ad_account_id: nullIfEmpty(form.meta_ad_account_id), meta_pixel_id: nullIfEmpty(form.meta_pixel_id),
      sgtm_url: nullIfEmpty(form.sgtm_url), sgtm_service_name: nullIfEmpty(form.sgtm_service_name),
      gcp_project_id: nullIfEmpty(form.gcp_project_id), slack_channel_id: nullIfEmpty(form.slack_channel_id),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-3xl">

      {/* GENERAL */}
      <section className="space-y-5">
        <div className="flex items-baseline gap-3 pb-3 border-b-2 border-[#1a1a18]">
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
            <label key={key} className="flex items-center gap-2 text-sm text-[#4a4a42] cursor-pointer">
              <input type="checkbox" checked={form[key] as boolean} onChange={set(key)} className="accent-[#e8321a]" />
              {label}
            </label>
          ))}
        </div>
        <div>
          <label className={labelCls}>Notas internas</label>
          <textarea value={form.notas} onChange={set('notas')} rows={3} placeholder="Notas internas..."
            className="w-full border border-[#e2dfd8] bg-white px-3 py-2 text-sm text-[#1a1a18] placeholder-[#9a9a8e] focus:outline-none focus:border-[#1a1a18] transition-colors resize-none" />
        </div>
      </section>

      {/* GOOGLE */}
      <section className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#1a1a18]">
          <h2 className="font-display text-lg font-bold">Google</h2>
          {googleOk === false && (
            <a href="/config" className="font-mono text-[9px] uppercase tracking-wide text-[#e8321a] hover:underline">
              Conectar Google primero →
            </a>
          )}
          {googleOk === true && (
            <span className="font-mono text-[9px] uppercase tracking-wide text-[#1a7a4a]">✓ Cuenta conectada</span>
          )}
          {googleOk === null && (
            <span className="font-mono text-[9px] uppercase tracking-wide text-[#9a9a8e]">Cargando propiedades…</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* GA4 Property — dropdown if connected, text if not */}
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
              <p className="mt-1.5 font-mono text-[9px] text-[#e8321a]">
                API no disponible — habilita &ldquo;Google Analytics Admin API&rdquo; en{' '}
                <a href="https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com"
                   target="_blank" rel="noreferrer" className="underline">GCP Console</a>
                {' '}y vuelve a conectar Google en{' '}
                <a href="/config" className="underline">Configuración</a>.
              </p>
            )}
          </div>

          {/* GSC Site — dropdown if connected */}
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
        </div>
      </section>

      {/* META */}
      <section className="space-y-5">
        <div className="pb-3 border-b-2 border-[#1a1a18]">
          <h2 className="font-display text-lg font-bold">Meta</h2>
        </div>
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
      </section>

      {/* sGTM */}
      <section className="space-y-5">
        <div className="pb-3 border-b-2 border-[#1a1a18]">
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
        <div className="bg-[#fef0ed] border border-[#e8321a] border-l-4 border-l-[#e8321a] px-4 py-3">
          <p className="font-mono text-xs text-[#e8321a]">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="font-mono text-[10px] uppercase tracking-wide bg-[#1a1a18] text-white px-6 py-2.5 hover:bg-[#e8321a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="font-mono text-[10px] uppercase tracking-wide text-[#9a9a8e] hover:text-[#1a1a18] border border-[#e2dfd8] hover:border-[#1a1a18] px-6 py-2.5 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
