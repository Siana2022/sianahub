'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Cliente } from '@/types/cliente'

interface Props {
  cliente?: Cliente
}

interface FormState {
  nombre: string
  dominio: string
  estado: 'active' | 'paused' | 'churned'
  notas: string
  alertas_activas: boolean
  gads_via_mcc: boolean
  ga4_property_id: string
  ga4_account_id: string
  gads_customer_id: string
  gsc_site_url: string
  gtm_account_id: string
  gtm_container_id: string
  meta_ad_account_id: string
  meta_pixel_id: string
  sgtm_url: string
  sgtm_service_name: string
  gcp_project_id: string
  slack_channel_id: string
}

function toFormState(c?: Cliente): FormState {
  return {
    nombre: c?.nombre ?? '',
    dominio: c?.dominio ?? '',
    estado: c?.estado ?? 'active',
    notas: c?.notas ?? '',
    alertas_activas: c?.alertas_activas ?? true,
    gads_via_mcc: c?.gads_via_mcc ?? true,
    ga4_property_id: c?.ga4_property_id ?? '',
    ga4_account_id: c?.ga4_account_id ?? '',
    gads_customer_id: c?.gads_customer_id ?? '',
    gsc_site_url: c?.gsc_site_url ?? '',
    gtm_account_id: c?.gtm_account_id ?? '',
    gtm_container_id: c?.gtm_container_id ?? '',
    meta_ad_account_id: c?.meta_ad_account_id ?? '',
    meta_pixel_id: c?.meta_pixel_id ?? '',
    sgtm_url: c?.sgtm_url ?? '',
    sgtm_service_name: c?.sgtm_service_name ?? '',
    gcp_project_id: c?.gcp_project_id ?? '',
    slack_channel_id: c?.slack_channel_id ?? '',
  }
}

function nullIfEmpty(v: string) {
  return v.trim() === '' ? null : v.trim()
}

export default function ClienteForm({ cliente }: Props) {
  const [form, setForm] = useState<FormState>(toFormState(cliente))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const isEdit = !!cliente

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm((f) => ({ ...f, [key]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      nombre: form.nombre,
      dominio: nullIfEmpty(form.dominio),
      estado: form.estado,
      notas: nullIfEmpty(form.notas),
      alertas_activas: form.alertas_activas,
      gads_via_mcc: form.gads_via_mcc,
      ga4_property_id: nullIfEmpty(form.ga4_property_id),
      ga4_account_id: nullIfEmpty(form.ga4_account_id),
      gads_customer_id: nullIfEmpty(form.gads_customer_id),
      gsc_site_url: nullIfEmpty(form.gsc_site_url),
      gtm_account_id: nullIfEmpty(form.gtm_account_id),
      gtm_container_id: nullIfEmpty(form.gtm_container_id),
      meta_ad_account_id: nullIfEmpty(form.meta_ad_account_id),
      meta_pixel_id: nullIfEmpty(form.meta_pixel_id),
      sgtm_url: nullIfEmpty(form.sgtm_url),
      sgtm_service_name: nullIfEmpty(form.sgtm_service_name),
      gcp_project_id: nullIfEmpty(form.gcp_project_id),
      slack_channel_id: nullIfEmpty(form.slack_channel_id),
    }

    const url = isEdit ? `/api/clientes/${cliente.id}` : '/api/clientes'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Error desconocido')
      setLoading(false)
      return
    }

    const data = await res.json()
    router.push(`/clientes/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General */}
      <section className="space-y-4">
        <h2 className="text-white text-sm font-semibold uppercase tracking-wide">General</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">Nombre *</Label>
            <Input
              value={form.nombre}
              onChange={set('nombre')}
              required
              placeholder="Nombre del cliente"
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">Dominio</Label>
            <Input
              value={form.dominio}
              onChange={set('dominio')}
              placeholder="ejemplo.com"
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">Estado</Label>
            <select
              value={form.estado}
              onChange={set('estado')}
              className="w-full h-9 rounded-md border border-gray-700 bg-gray-900 px-3 text-sm text-white"
            >
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="churned">Churn</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">Slack Channel ID</Label>
            <Input
              value={form.slack_channel_id}
              onChange={set('slack_channel_id')}
              placeholder="C0123456789"
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.alertas_activas}
              onChange={set('alertas_activas')}
              className="rounded"
            />
            Alertas activas
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.gads_via_mcc}
              onChange={set('gads_via_mcc')}
              className="rounded"
            />
            Google Ads vía MCC
          </label>
        </div>

        <div className="space-y-1.5">
          <Label className="text-gray-300 text-xs">Notas</Label>
          <Textarea
            value={form.notas}
            onChange={set('notas')}
            rows={3}
            placeholder="Notas internas..."
            className="bg-gray-900 border-gray-700 text-white resize-none"
          />
        </div>
      </section>

      {/* Google */}
      <section className="space-y-4">
        <h2 className="text-white text-sm font-semibold uppercase tracking-wide border-t border-gray-800 pt-6">Google</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">GA4 Property ID</Label>
            <Input value={form.ga4_property_id} onChange={set('ga4_property_id')} placeholder="properties/123456789" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">GA4 Account ID</Label>
            <Input value={form.ga4_account_id} onChange={set('ga4_account_id')} placeholder="accounts/123456" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">Google Ads Customer ID</Label>
            <Input value={form.gads_customer_id} onChange={set('gads_customer_id')} placeholder="123-456-7890" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">GSC Site URL</Label>
            <Input value={form.gsc_site_url} onChange={set('gsc_site_url')} placeholder="https://cliente.com" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">GTM Container ID</Label>
            <Input value={form.gtm_container_id} onChange={set('gtm_container_id')} placeholder="GTM-XXXXXXX" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">GTM Account ID</Label>
            <Input value={form.gtm_account_id} onChange={set('gtm_account_id')} placeholder="123456" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
        </div>
      </section>

      {/* Meta */}
      <section className="space-y-4">
        <h2 className="text-white text-sm font-semibold uppercase tracking-wide border-t border-gray-800 pt-6">Meta</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">Ad Account ID</Label>
            <Input value={form.meta_ad_account_id} onChange={set('meta_ad_account_id')} placeholder="act_123456789" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">Pixel ID</Label>
            <Input value={form.meta_pixel_id} onChange={set('meta_pixel_id')} placeholder="123456789" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
        </div>
      </section>

      {/* sGTM */}
      <section className="space-y-4">
        <h2 className="text-white text-sm font-semibold uppercase tracking-wide border-t border-gray-800 pt-6">sGTM / Google Cloud</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">sGTM URL</Label>
            <Input value={form.sgtm_url} onChange={set('sgtm_url')} placeholder="https://sgtm.sianadigital.com/cliente" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">Service Name (Cloud Run)</Label>
            <Input value={form.sgtm_service_name} onChange={set('sgtm_service_name')} placeholder="sgtm-cliente-nombre" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">GCP Project ID</Label>
            <Input value={form.gcp_project_id} onChange={set('gcp_project_id')} placeholder="siana-digital-prod" className="bg-gray-900 border-gray-700 text-white font-mono text-xs" />
          </div>
        </div>
      </section>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-gray-700 text-gray-300 hover:text-white"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
