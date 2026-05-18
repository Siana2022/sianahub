import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGA4SummaryRange } from '@/lib/google/ga4'
import { fetchGSCSummaryRange } from '@/lib/google/gsc'
import { fetchMetaSummary, fetchMetaCampaigns } from '@/lib/meta/ads'
import type { DateRange } from '@/lib/meta/ads'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()

  const url = req.nextUrl
  const desde = url.searchParams.get('desde')
  const hasta = url.searchParams.get('hasta')

  if (!desde || !hasta) {
    return NextResponse.json({ error: 'Missing desde/hasta params' }, { status: 400 })
  }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('meta_ad_account_id, meta_events_config, tipo_proyecto, ga4_property_id, gsc_site_url, informe_config')
    .eq('id', clienteId)
    .single()

  const propertyId = cliente?.ga4_property_id
    ? cliente.ga4_property_id.startsWith('properties/')
      ? cliente.ga4_property_id
      : `properties/${cliente.ga4_property_id}`
    : null

  const metaAccountId = cliente?.meta_ad_account_id?.replace(/^act_/, '') ?? null
  const metaConfig    = cliente?.meta_events_config ?? {}
  const customRange: DateRange = { since: desde, until: hasta }

  // Available funnel steps come from the client's meta_events_config
  const funnel_steps: string[]              = metaConfig.funnel_steps      ?? []
  const breakdown_events: string[]          = metaConfig.breakdown_events  ?? []
  const breakdown_event_labels: Record<string, string> = metaConfig.breakdown_event_labels ?? {}

  const [ga4, gsc, meta, campaigns] = await Promise.allSettled([
    propertyId            ? fetchGA4SummaryRange(propertyId, desde, hasta)                : Promise.resolve(null),
    cliente?.gsc_site_url ? fetchGSCSummaryRange(cliente.gsc_site_url, desde, hasta)     : Promise.resolve(null),
    metaAccountId         ? fetchMetaSummary(metaAccountId, metaConfig, customRange)      : Promise.resolve(null),
    metaAccountId         ? fetchMetaCampaigns(metaAccountId, metaConfig, customRange)    : Promise.resolve(null),
  ])

  return NextResponse.json({
    informe_config:         cliente?.informe_config ?? {},
    tipo_proyecto:          cliente?.tipo_proyecto  ?? 'leads',
    funnel_steps,
    breakdown_events,
    breakdown_event_labels,
    desde,
    hasta,
    ga4:       ga4.status       === 'fulfilled' ? ga4.value       : null,
    gsc:       gsc.status       === 'fulfilled' ? gsc.value       : null,
    meta:      meta.status      === 'fulfilled' ? meta.value      : null,
    campaigns: campaigns.status === 'fulfilled' ? campaigns.value : null,
    ga4Error:  ga4.status       === 'rejected'  ? String(ga4.reason)       : null,
    gscError:  gsc.status       === 'rejected'  ? String(gsc.reason)       : null,
    metaError: meta.status      === 'rejected'  ? String(meta.reason)      : null,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()
  const body = await req.json()

  if (!body.informe_config || typeof body.informe_config !== 'object' || Array.isArray(body.informe_config)) {
    return NextResponse.json({ error: 'informe_config must be an object' }, { status: 400 })
  }

  const { error } = await supabase
    .from('clientes')
    .update({ informe_config: body.informe_config })
    .eq('id', clienteId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
