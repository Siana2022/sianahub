import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGSCSummary, fetchGSCDaily, fetchGSCKeywords } from '@/lib/google/gsc'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
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
