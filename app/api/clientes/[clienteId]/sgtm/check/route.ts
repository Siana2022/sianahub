import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateClientSnippet, checkSgtmHealth, ContaminacionItem } from '@/lib/google/sgtm-validator'

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

  // Fetch all OTHER clients that have GTM/sGTM config (for cross-contamination check)
  const { data: otrosClientes } = await supabase
    .from('clientes')
    .select('id, nombre, gtm_container_id, sgtm_url')
    .neq('id', clienteId)
    .or('gtm_container_id.not.is.null,sgtm_url.not.is.null')

  // Run snippet + health checks in parallel
  const [snippet, health] = await Promise.all([
    cliente.dominio
      ? validateClientSnippet(cliente.dominio, cliente.gtm_container_id, cliente.sgtm_url)
      : Promise.resolve({
          gtm_id_found: null,
          sgtm_url_found: null,
          gtm_ids_found: [],
          sgtm_urls_found: [],
          gtm_id_matches: null,
          sgtm_url_matches: null,
          error: 'El cliente no tiene dominio configurado',
        }),
    cliente.sgtm_url
      ? checkSgtmHealth(cliente.sgtm_url, cliente.gtm_container_id)
      : Promise.resolve({ healthy: false, status: 0, error: 'sGTM URL no configurada' }),
  ])

  // ── Cross-contamination detection ─────────────────────────────────────────
  const contaminacionItems: ContaminacionItem[] = []

  if (!snippet.error && otrosClientes) {
    for (const otro of otrosClientes) {
      // Check if another client's GTM ID appears in this client's page
      if (otro.gtm_container_id && snippet.gtm_ids_found.includes(otro.gtm_container_id)) {
        contaminacionItems.push({
          tipo: 'gtm_id',
          valor: otro.gtm_container_id,
          cliente_nombre: otro.nombre,
          cliente_id: otro.id,
        })
      }
      // Check if another client's sGTM URL appears in this client's page
      if (otro.sgtm_url && snippet.sgtm_urls_found.includes(otro.sgtm_url)) {
        contaminacionItems.push({
          tipo: 'sgtm_url',
          valor: otro.sgtm_url,
          cliente_nombre: otro.nombre,
          cliente_id: otro.id,
        })
      }
    }
  }

  const contaminacion = {
    contaminado: contaminacionItems.length > 0,
    items: contaminacionItems,
  }

  // ── Create alerts ──────────────────────────────────────────────────────────
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
        titulo: 'sGTM /gtm.js no responde correctamente',
        descripcion: health.error ?? `HTTP ${health.status} en ${cliente.sgtm_url}/gtm.js`,
        fuente: 'sgtm_check',
        estado: 'pending',
      })
      .select('id')
      .single()
    if (alerta) alertsCreated.push(alerta.id)
  }

  // Cross-contamination alerts — one per contamination item
  for (const item of contaminacionItems) {
    const { data: alerta } = await supabase
      .from('alerts')
      .insert({
        cliente_id: clienteId,
        tipo: 'cross_contamination',
        severidad: 'critical',
        titulo: 'Contaminación cruzada detectada',
        descripcion: item.tipo === 'gtm_id'
          ? `El GTM ID ${item.valor} del cliente "${item.cliente_nombre}" está presente en el sitio de ${cliente.nombre}`
          : `La URL sGTM ${item.valor} del cliente "${item.cliente_nombre}" está presente en el sitio de ${cliente.nombre}`,
        fuente: 'sgtm_check',
        estado: 'pending',
      })
      .select('id')
      .single()
    if (alerta) alertsCreated.push(alerta.id)
  }

  return Response.json({ snippet, health, contaminacion, alerts_created: alertsCreated })
}
