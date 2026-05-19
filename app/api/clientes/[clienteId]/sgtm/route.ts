import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGA4EventsByName, fetchGA4ByLeadType } from '@/lib/google/ga4'
import type { SgtmEventConfig } from '@/types/cliente'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const url   = req.nextUrl
  const desde = url.searchParams.get('desde')
  const hasta = url.searchParams.get('hasta')
  const mode  = url.searchParams.get('mode') ?? 'events' // 'events' | 'lead_type' | 'combined'

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

  if (!propertyId) {
    return NextResponse.json({ error: 'GA4 property not configured' }, { status: 422 })
  }

  const configuredEvents: SgtmEventConfig[] = cliente?.sgtm_events_config?.events ?? []

  try {

    // ── Mode: lead_type breakdown ──────────────────────────────────────────────
    if (mode === 'lead_type') {
      const counts = await fetchGA4ByLeadType(propertyId, desde, hasta)
      const total  = counts.reduce((s, r) => s + r.count, 0)
      const rows   = counts.map(r => ({
        key:        r.key,
        label:      r.key,
        url:        null,
        count:      r.count,
        count_prev: r.count_prev,
        pct:        total > 0 ? (r.count / total) * 100 : 0,
      }))
      return NextResponse.json({ rows, total, desde, hasta, mode: 'lead_type' })
    }

    // ── Mode: combined (lead_type breakdown + named events without duplicate) ──
    if (mode === 'combined') {
      const nonGenerateEvents = configuredEvents.filter(e => e.key !== 'generate_lead')

      const [leadTypeRows, namedCounts] = await Promise.all([
        fetchGA4ByLeadType(propertyId, desde, hasta),
        nonGenerateEvents.length > 0
          ? fetchGA4EventsByName(propertyId, nonGenerateEvents.map(e => e.key), desde, hasta)
          : Promise.resolve([]),
      ])

      // Keys already covered by lead_type — skip to avoid double count
      const leadTypeKeys = new Set(leadTypeRows.map(r => r.key))

      const extraRows = nonGenerateEvents
        .filter(cfg => !leadTypeKeys.has(cfg.key))
        .map(cfg => {
          const c = namedCounts.find(r => r.key === cfg.key)
          return {
            key:        cfg.key,
            label:      cfg.label,
            url:        cfg.url ?? null,
            count:      c?.count      ?? 0,
            count_prev: c?.count_prev ?? 0,
          }
        })

      const merged = [
        ...leadTypeRows.map(r => ({ key: r.key, label: r.key, url: null as string | null, count: r.count, count_prev: r.count_prev })),
        ...extraRows,
      ].sort((a, b) => b.count - a.count)

      const total = merged.reduce((s, r) => s + r.count, 0)
      const rows  = merged.map(r => ({
        ...r,
        pct: total > 0 ? (r.count / total) * 100 : 0,
      }))

      return NextResponse.json({ rows, total, desde, hasta, mode: 'combined' })
    }

    // ── Mode: configured events (default) ─────────────────────────────────────
    if (configuredEvents.length === 0) {
      return NextResponse.json({ rows: [], total: 0, desde, hasta, mode: 'events' })
    }

    const eventNames = configuredEvents.map(e => e.key)
    const counts     = await fetchGA4EventsByName(propertyId, eventNames, desde, hasta)
    const total      = counts.reduce((s, r) => s + r.count, 0)
    const rows       = configuredEvents.map(cfg => {
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

    return NextResponse.json({ rows, total, desde, hasta, mode: 'events' })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
