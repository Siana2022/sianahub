import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGA4Summary, fetchGA4TrafficSources, fetchGA4Devices, fetchGA4Geo } from '@/lib/google/ga4'

const CACHE_MAX_AGE_HOURS = 26

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1'
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('ga4_property_id')
    .eq('id', clienteId)
    .single()

  if (!cliente?.ga4_property_id) {
    return NextResponse.json(
      { error: 'Este cliente no tiene GA4 Property ID configurado. Edita el cliente y añádelo.' },
      { status: 422 }
    )
  }

  // Check cache first (unless forced refresh)
  if (!forceRefresh) {
    const { data: cache } = await supabase
      .from('metricas_cache')
      .select('datos, fecha_calculo')
      .eq('cliente_id', clienteId)
      .eq('fuente', 'ga4')
      .eq('tipo', 'procedencia')
      .single()

    if (cache) {
      const ageHours = (Date.now() - new Date(cache.fecha_calculo).getTime()) / 3600000
      if (ageHours < CACHE_MAX_AGE_HOURS) {
        return NextResponse.json({
          ...cache.datos,
          _cached: true,
          _cached_at: cache.fecha_calculo,
        })
      }
    }
  }

  // Live fetch
  const propertyId = cliente.ga4_property_id.startsWith('properties/')
    ? cliente.ga4_property_id
    : `properties/${cliente.ga4_property_id}`

  try {
    const [summary, sources, devices, geo] = await Promise.all([
      fetchGA4Summary(propertyId),
      fetchGA4TrafficSources(propertyId),
      fetchGA4Devices(propertyId),
      fetchGA4Geo(propertyId),
    ])
    return NextResponse.json({ summary, sources, devices, geo })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
