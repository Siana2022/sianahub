import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateClientSnippet, checkSgtmHealth, ContaminacionItem } from '@/lib/google/sgtm-validator'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INGESTA_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // All clients with a domain configured
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('id, nombre, dominio, gtm_container_id, sgtm_url')
    .not('dominio', 'is', null)

  if (error || !clientes) {
    return NextResponse.json({ error: 'Error fetching clientes' }, { status: 500 })
  }

  // Build lookup maps for cross-contamination
  const gtmIdMap = new Map<string, { id: string; nombre: string }>()
  const sgtmUrlMap = new Map<string, { id: string; nombre: string }>()
  for (const c of clientes) {
    if (c.gtm_container_id) gtmIdMap.set(c.gtm_container_id, { id: c.id, nombre: c.nombre })
    if (c.sgtm_url) sgtmUrlMap.set(c.sgtm_url, { id: c.id, nombre: c.nombre })
  }

  const results = []
  let totalAlertas = 0

  for (const cliente of clientes) {
    const result: Record<string, unknown> = { clienteId: cliente.id, nombre: cliente.nombre }

    // Snippet + health in parallel
    const [snippet, health] = await Promise.all([
      validateClientSnippet(cliente.dominio!, cliente.gtm_container_id, cliente.sgtm_url),
      cliente.sgtm_url
        ? checkSgtmHealth(cliente.sgtm_url, cliente.gtm_container_id)
        : Promise.resolve({ healthy: false, status: 0, error: 'sGTM URL no configurada' }),
    ])

    // Cross-contamination
    const contaminacionItems: ContaminacionItem[] = []
    if (!snippet.error) {
      for (const foundId of snippet.gtm_ids_found) {
        const owner = gtmIdMap.get(foundId)
        if (owner && owner.id !== cliente.id) {
          contaminacionItems.push({ tipo: 'gtm_id', valor: foundId, cliente_nombre: owner.nombre, cliente_id: owner.id })
        }
      }
      for (const foundUrl of snippet.sgtm_urls_found) {
        const owner = sgtmUrlMap.get(foundUrl)
        if (owner && owner.id !== cliente.id) {
          contaminacionItems.push({ tipo: 'sgtm_url', valor: foundUrl, cliente_nombre: owner.nombre, cliente_id: owner.id })
        }
      }
    }

    result.contaminado = contaminacionItems.length > 0
    result.snippet_ok = !snippet.error && snippet.gtm_id_matches !== false && snippet.sgtm_url_matches !== false
    result.health_ok = health.healthy

    // Insert alerts
    const alertInserts = []

    if (snippet.gtm_id_matches === false) {
      alertInserts.push({ cliente_id: cliente.id, tipo: 'gtm_id_mismatch', severidad: 'high', titulo: 'GTM ID no coincide en el sitio', descripcion: `Se esperaba ${cliente.gtm_container_id}, se encontró ${snippet.gtm_id_found ?? 'ninguno'}`, fuente: 'sgtm_check_auto', estado: 'pending' })
    }
    if (snippet.gtm_id_found === null && !snippet.error) {
      alertInserts.push({ cliente_id: cliente.id, tipo: 'gtm_id_missing', severidad: 'critical', titulo: 'GTM no detectado en el sitio', descripcion: `No se encontró ningún GTM container ID en ${cliente.dominio}`, fuente: 'sgtm_check_auto', estado: 'pending' })
    }
    if (snippet.sgtm_url_matches === false) {
      alertInserts.push({ cliente_id: cliente.id, tipo: 'sgtm_url_mismatch', severidad: 'high', titulo: 'URL de sGTM no coincide en el sitio', descripcion: `Se esperaba ${cliente.sgtm_url}, se encontró ${snippet.sgtm_url_found ?? 'ninguna'}`, fuente: 'sgtm_check_auto', estado: 'pending' })
    }
    if (!health.healthy && cliente.sgtm_url) {
      alertInserts.push({ cliente_id: cliente.id, tipo: 'sgtm_health_failure', severidad: 'critical', titulo: 'sGTM no responde correctamente', descripcion: health.error ?? `HTTP ${health.status}`, fuente: 'sgtm_check_auto', estado: 'pending' })
    }
    for (const item of contaminacionItems) {
      alertInserts.push({
        cliente_id: cliente.id,
        tipo: 'cross_contamination',
        severidad: 'critical',
        titulo: 'Contaminación cruzada detectada',
        descripcion: item.tipo === 'gtm_id'
          ? `GTM ID ${item.valor} del cliente "${item.cliente_nombre}" encontrado en ${cliente.nombre}`
          : `URL sGTM ${item.valor} del cliente "${item.cliente_nombre}" encontrada en ${cliente.nombre}`,
        fuente: 'sgtm_check_auto',
        estado: 'pending',
      })
    }

    if (alertInserts.length > 0) {
      await supabase.from('alerts').insert(alertInserts)
      totalAlertas += alertInserts.length
    }

    results.push(result)
  }

  const contaminados = results.filter(r => r.contaminado).length
  const conProblemas = results.filter(r => !r.snippet_ok || !r.health_ok).length

  return NextResponse.json({
    total: clientes.length,
    contaminados,
    con_problemas: conProblemas,
    alertas_creadas: totalAlertas,
    ran_at: new Date().toISOString(),
    results,
  })
}
