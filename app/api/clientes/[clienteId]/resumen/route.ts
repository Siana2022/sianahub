import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGA4Summary } from '@/lib/google/ga4'
import { fetchGSCSummary } from '@/lib/google/gsc'
import { fetchMetaSummary } from '@/lib/meta/ads'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('ga4_property_id, gsc_site_url, meta_ad_account_id, resumen_widgets')
    .eq('id', clienteId)
    .single()

  const propertyId = cliente?.ga4_property_id
    ? cliente.ga4_property_id.startsWith('properties/')
      ? cliente.ga4_property_id
      : `properties/${cliente.ga4_property_id}`
    : null

  const metaAccountId = cliente?.meta_ad_account_id?.replace(/^act_/, '') ?? null

  const [ga4, gsc, meta] = await Promise.allSettled([
    propertyId ? fetchGA4Summary(propertyId) : Promise.resolve(null),
    cliente?.gsc_site_url ? fetchGSCSummary(cliente.gsc_site_url) : Promise.resolve(null),
    metaAccountId ? fetchMetaSummary(metaAccountId) : Promise.resolve(null),
  ])

  return NextResponse.json({
    widgets:   cliente?.resumen_widgets ?? ['ga4_sessions', 'ga4_conversions', 'gsc_clicks', 'gsc_position'],
    ga4:       ga4.status   === 'fulfilled' ? ga4.value   : null,
    gsc:       gsc.status   === 'fulfilled' ? gsc.value   : null,
    meta:      meta.status  === 'fulfilled' ? meta.value  : null,
    ga4Error:  ga4.status   === 'rejected'  ? String(ga4.reason)   : null,
    gscError:  gsc.status   === 'rejected'  ? String(gsc.reason)   : null,
    metaError: meta.status  === 'rejected'  ? String(meta.reason)  : null,
  })
}
