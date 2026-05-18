import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGA4Summary, fetchGA4Daily, fetchGA4TopPages, fetchGA4TrafficSources, fetchGA4Devices, fetchGA4Geo } from '@/lib/google/ga4'
import { fetchGSCSummary, fetchGSCDaily, fetchGSCKeywords } from '@/lib/google/gsc'

// Only accept requests with the correct secret
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INGESTA_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

type IngestaResult = {
  clienteId: string
  nombre: string
  ga4?: 'ok' | 'skipped' | string
  gsc?: 'ok' | 'skipped' | string
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch all clients that have GA4 or GSC configured
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('id, nombre, ga4_property_id, gsc_site_url')
    .or('ga4_property_id.not.is.null,gsc_site_url.not.is.null')

  if (error || !clientes) {
    return NextResponse.json({ error: 'Error fetching clientes' }, { status: 500 })
  }

  const results: IngestaResult[] = []

  // Process each client — continue even if one fails
  for (const cliente of clientes) {
    const result: IngestaResult = { clienteId: cliente.id, nombre: cliente.nombre }

    // ── GA4 ────────────────────────────────────────────────────────────────
    if (cliente.ga4_property_id) {
      const propertyId = cliente.ga4_property_id.startsWith('properties/')
        ? cliente.ga4_property_id
        : `properties/${cliente.ga4_property_id}`

      try {
        const [summaryT, dailyT, pagesT] = await Promise.all([
          fetchGA4Summary(propertyId),
          fetchGA4Daily(propertyId),
          fetchGA4TopPages(propertyId),
        ])
        await supabase.from('metricas_cache').upsert({
          cliente_id: cliente.id,
          fuente: 'ga4',
          tipo: 'trafico',
          datos: { summary: summaryT, daily: dailyT, pages: pagesT },
          fecha_calculo: new Date().toISOString(),
        }, { onConflict: 'cliente_id,fuente,tipo' })

        const [summaryP, sources, devices, geo] = await Promise.all([
          fetchGA4Summary(propertyId),
          fetchGA4TrafficSources(propertyId),
          fetchGA4Devices(propertyId),
          fetchGA4Geo(propertyId),
        ])
        await supabase.from('metricas_cache').upsert({
          cliente_id: cliente.id,
          fuente: 'ga4',
          tipo: 'procedencia',
          datos: { summary: summaryP, sources, devices, geo },
          fecha_calculo: new Date().toISOString(),
        }, { onConflict: 'cliente_id,fuente,tipo' })

        result.ga4 = 'ok'
      } catch (err) {
        result.ga4 = err instanceof Error ? err.message : 'error'
      }
    } else {
      result.ga4 = 'skipped'
    }

    // ── GSC ────────────────────────────────────────────────────────────────
    if (cliente.gsc_site_url) {
      try {
        const [summary, daily, keywords] = await Promise.all([
          fetchGSCSummary(cliente.gsc_site_url),
          fetchGSCDaily(cliente.gsc_site_url),
          fetchGSCKeywords(cliente.gsc_site_url),
        ])
        await supabase.from('metricas_cache').upsert({
          cliente_id: cliente.id,
          fuente: 'gsc',
          tipo: 'organico',
          datos: { summary, daily, keywords },
          fecha_calculo: new Date().toISOString(),
        }, { onConflict: 'cliente_id,fuente,tipo' })

        result.gsc = 'ok'
      } catch (err) {
        result.gsc = err instanceof Error ? err.message : 'error'
      }
    } else {
      result.gsc = 'skipped'
    }

    results.push(result)
  }

  const processed = results.filter(r => r.ga4 === 'ok' || r.gsc === 'ok').length
  const errors = results.filter(r =>
    (r.ga4 && r.ga4 !== 'ok' && r.ga4 !== 'skipped') ||
    (r.gsc && r.gsc !== 'ok' && r.gsc !== 'skipped')
  )

  return NextResponse.json({
    processed,
    total: clientes.length,
    errors: errors.length,
    results,
    ran_at: new Date().toISOString(),
  })
}
