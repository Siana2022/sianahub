import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGSCSummary, fetchGSCDaily, fetchGSCKeywords } from '@/lib/google/gsc'

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
    .select('gsc_site_url')
    .eq('id', clienteId)
    .single()

  if (!cliente?.gsc_site_url) {
    return NextResponse.json(
      { error: 'Este cliente no tiene Search Console configurado. Edita el cliente y añade el sitio GSC.' },
      { status: 422 }
    )
  }

  // Check cache first (unless forced refresh)
  if (!forceRefresh) {
    const { data: cache } = await supabase
      .from('metricas_cache')
      .select('datos, fecha_calculo')
      .eq('cliente_id', clienteId)
      .eq('fuente', 'gsc')
      .eq('tipo', 'organico')
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
  try {
    const [summary, daily, keywords] = await Promise.all([
      fetchGSCSummary(cliente.gsc_site_url),
      fetchGSCDaily(cliente.gsc_site_url),
      fetchGSCKeywords(cliente.gsc_site_url),
    ])
    return NextResponse.json({ summary, daily, keywords })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
