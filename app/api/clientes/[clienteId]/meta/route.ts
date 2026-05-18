import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMetaSummary, fetchMetaCampaigns, fetchMetaDaily } from '@/lib/meta/ads'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('meta_ad_account_id, tipo_proyecto, meta_events_config')
    .eq('id', clienteId)
    .single()

  if (!cliente?.meta_ad_account_id) {
    return NextResponse.json(
      { error: 'Este cliente no tiene Meta Ad Account ID configurado. Edita el cliente y añádelo.' },
      { status: 422 }
    )
  }

  // Remove "act_" prefix if present — we add it in the lib
  const accountId    = cliente.meta_ad_account_id.replace(/^act_/, '')
  const config       = cliente.meta_events_config ?? {}
  const tipoProyecto = cliente.tipo_proyecto ?? 'leads'

  try {
    const [summary, campaigns, daily] = await Promise.all([
      fetchMetaSummary(accountId, config),
      fetchMetaCampaigns(accountId, config),
      fetchMetaDaily(accountId, config),
    ])
    return NextResponse.json({
      summary,
      campaigns,
      daily,
      tipo_proyecto:          tipoProyecto,
      funnel_steps:           config.funnel_steps ?? [],
      breakdown_events:       config.breakdown_events ?? [],
      breakdown_event_labels: config.breakdown_event_labels ?? {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
