import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGA4Summary, fetchGA4TrafficSources, fetchGA4Devices, fetchGA4Geo } from '@/lib/google/ga4'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
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
