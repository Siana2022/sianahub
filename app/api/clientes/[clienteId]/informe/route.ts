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
    .select('meta_ad_account_id, meta_events_config, tipo_proyecto, ga4_property_id, gsc_site_url, informe_blocks')
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

  const [ga4, gsc, meta, campaigns] = await Promise.allSettled([
    propertyId            ? fetchGA4SummaryRange(propertyId, desde, hasta)                          : Promise.resolve(null),
    cliente?.gsc_site_url ? fetchGSCSummaryRange(cliente.gsc_site_url, desde, hasta)               : Promise.resolve(null),
    metaAccountId         ? fetchMetaSummary(metaAccountId, metaConfig, customRange)               : Promise.resolve(null),
    metaAccountId         ? fetchMetaCampaigns(metaAccountId, metaConfig, customRange)             : Promise.resolve(null),
  ])

  return NextResponse.json({
    blocks:        cliente?.informe_blocks ?? ['resumen', 'meta', 'gads', 'organico'],
    tipo_proyecto: cliente?.tipo_proyecto  ?? 'leads',
    desde,
    hasta,
    ga4:       ga4.status        === 'fulfilled' ? ga4.value        : null,
    gsc:       gsc.status        === 'fulfilled' ? gsc.value        : null,
    meta:      meta.status       === 'fulfilled' ? meta.value       : null,
    campaigns: campaigns.status  === 'fulfilled' ? campaigns.value  : null,
    ga4Error:  ga4.status        === 'rejected'  ? String(ga4.reason)        : null,
    gscError:  gsc.status        === 'rejected'  ? String(gsc.reason)        : null,
    metaError: meta.status       === 'rejected'  ? String(meta.reason)       : null,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()
  const body = await req.json()

  if (!Array.isArray(body.informe_blocks)) {
    return NextResponse.json({ error: 'informe_blocks must be an array' }, { status: 400 })
  }

  const { error } = await supabase
    .from('clientes')
    .update({ informe_blocks: body.informe_blocks })
    .eq('id', clienteId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
