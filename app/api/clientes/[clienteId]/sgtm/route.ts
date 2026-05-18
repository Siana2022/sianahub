import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGA4EventsByName } from '@/lib/google/ga4'
import type { SgtmEventConfig } from '@/types/cliente'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const url   = req.nextUrl
  const desde = url.searchParams.get('desde')
  const hasta = url.searchParams.get('hasta')

  if (!desde || !hasta) {
    return NextResponse.json({ error: 'Missing desde/hasta' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: cliente } = await supabase
    .from('clientes')
    .select('ga4_property_id, sgtm_events_config')
    .eq('id', clienteId)
    .single()

  const propertyId = cliente?.ga4_property_id
    ? cliente.ga4_property_id.startsWith('properties/')
      ? cliente.ga4_property_id
      : `properties/${cliente.ga4_property_id}`
    : null

  const configuredEvents: SgtmEventConfig[] = cliente?.sgtm_events_config?.events ?? []

  if (!propertyId) {
    return NextResponse.json({ error: 'GA4 property not configured' }, { status: 422 })
  }

  if (configuredEvents.length === 0) {
    return NextResponse.json({ rows: [], desde, hasta })
  }

  try {
    const eventNames = configuredEvents.map(e => e.key)
    const counts = await fetchGA4EventsByName(propertyId, eventNames, desde, hasta)

    // Merge counts with config labels/urls
    const total = counts.reduce((s, r) => s + r.count, 0)
    const rows = configuredEvents.map(cfg => {
      const c = counts.find(r => r.key === cfg.key)
      return {
        key:        cfg.key,
        label:      cfg.label,
        url:        cfg.url ?? null,
        count:      c?.count      ?? 0,
        count_prev: c?.count_prev ?? 0,
        pct:        total > 0 ? ((c?.count ?? 0) / total) * 100 : 0,
      }
    }).sort((a, b) => b.count - a.count)

    return NextResponse.json({ rows, total, desde, hasta })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
