import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGAdsSummary, fetchGAdsCampaigns, fetchGAdsDaily } from '@/lib/google/gads'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('gads_customer_id')
    .eq('id', clienteId)
    .single()

  if (!cliente?.gads_customer_id) {
    return NextResponse.json(
      { error: 'Este cliente no tiene Google Ads Customer ID configurado. Edita el cliente y añádelo.' },
      { status: 422 }
    )
  }

  try {
    const [summary, campaigns, daily] = await Promise.all([
      fetchGAdsSummary(cliente.gads_customer_id),
      fetchGAdsCampaigns(cliente.gads_customer_id),
      fetchGAdsDaily(cliente.gads_customer_id),
    ])
    return NextResponse.json({ summary, campaigns, daily })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
