import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateClientSnippet, checkSgtmHealth } from '@/lib/google/sgtm-validator'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('id, nombre, dominio, gtm_container_id, sgtm_url, gads_customer_id')
    .eq('id', clienteId)
    .single()

  if (error || !cliente) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  // Run checks in parallel
  const [snippet, health] = await Promise.all([
    cliente.dominio
      ? validateClientSnippet(cliente.dominio, cliente.gtm_container_id, cliente.sgtm_url)
      : Promise.resolve({
          gtm_id_found: null,
          sgtm_url_found: null,
          gtm_id_matches: null,
          sgtm_url_matches: null,
          error: 'El cliente no tiene dominio configurado',
        }),
    cliente.sgtm_url
      ? checkSgtmHealth(cliente.sgtm_url, cliente.gtm_container_id)
      : Promise.resolve({ healthy: false, status: 0, error: 'sGTM URL no configurada' }),
  ])

  // Create alerts for failed checks
  const alertsCreated: string[] = []

  // GTM ID mismatch
  if (snippet.gtm_id_matches === false) {
    const { data: alerta } = await supabase
      .from('alerts')
      .insert({
        cliente_id: clienteId,
        tipo: 'gtm_id_mismatch',
        severidad: 'high',
        titulo: 'GTM ID no coincide en el sitio',
        descripcion: `Se esperaba ${cliente.gtm_container_id}, se encontró ${snippet.gtm_id_found ?? 'ninguno'}`,
        fuente: 'sgtm_check',
        estado: 'pending',
      })
      .select('id')
      .single()
    if (alerta) alertsCreated.push(alerta.id)
  }

  // GTM ID not found
  if (snippet.gtm_id_found === null && !snippet.error) {
    const { data: alerta } = await supabase
      .from('alerts')
      .insert({
        cliente_id: clienteId,
        tipo: 'gtm_id_missing',
        severidad: 'critical',
        titulo: 'GTM no detectado en el sitio',
        descripcion: `No se encontró ningún GTM container ID en ${cliente.dominio}`,
        fuente: 'sgtm_check',
        estado: 'pending',
      })
      .select('id')
      .single()
    if (alerta) alertsCreated.push(alerta.id)
  }

  // sGTM URL mismatch
  if (snippet.sgtm_url_matches === false) {
    const { data: alerta } = await supabase
      .from('alerts')
      .insert({
        cliente_id: clienteId,
        tipo: 'sgtm_url_mismatch',
        severidad: 'high',
        titulo: 'URL de sGTM no coincide en el sitio',
        descripcion: `Se esperaba ${cliente.sgtm_url}, se encontró ${snippet.sgtm_url_found ?? 'ninguna'}`,
        fuente: 'sgtm_check',
        estado: 'pending',
      })
      .select('id')
      .single()
    if (alerta) alertsCreated.push(alerta.id)
  }

  // sGTM health failure
  if (!health.healthy && cliente.sgtm_url) {
    const { data: alerta } = await supabase
      .from('alerts')
      .insert({
        cliente_id: clienteId,
        tipo: 'sgtm_health_failure',
        severidad: 'critical',
        titulo: 'sGTM /healthz no responde correctamente',
        descripcion: health.error ?? `HTTP ${health.status} en ${cliente.sgtm_url}/healthz`,
        fuente: 'sgtm_check',
        estado: 'pending',
      })
      .select('id')
      .single()
    if (alerta) alertsCreated.push(alerta.id)
  }

  return Response.json({ snippet, health, alerts_created: alertsCreated })
}
