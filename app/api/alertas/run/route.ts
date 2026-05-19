import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runChecks, type ClienteParaChequear, type AlertaGenerada } from '@/lib/alertas/checker'

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? ''
  // Manual trigger: INGESTA_SECRET
  const ingestaSecret = process.env.INGESTA_SECRET
  if (ingestaSecret && auth === `Bearer ${ingestaSecret}`) return true
  // Vercel Cron: CRON_SECRET (injected automatically by Vercel)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true
  return false
}

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select(`
      id, nombre, slack_channel_id, alertas_activas, alertas_config,
      tipo_proyecto, meta_ad_account_id, meta_events_config, ga4_property_id
    `)
    .eq('alertas_activas', true)
    .neq('estado', 'churned')

  if (error || !clientes) {
    return NextResponse.json({ error: 'Error fetching clientes' }, { status: 500 })
  }

  async function saveAlerta(alerta: AlertaGenerada) {
    await supabase.from('alerts').insert({
      cliente_id:  alerta.cliente_id,
      tipo:        alerta.tipo,
      severidad:   alerta.severidad,
      titulo:      alerta.titulo,
      descripcion: alerta.descripcion,
      fuente:      alerta.fuente,
      estado:      'pending',
    })
  }

  const resultados = await runChecks(clientes as ClienteParaChequear[], saveAlerta)
  const totalAlertas = resultados.reduce((s, r) => s + r.alertas, 0)

  return NextResponse.json({
    ran_at:    new Date().toISOString(),
    clientes:  resultados.length,
    alertas:   totalAlertas,
    resultados,
  })
}

// GET — Vercel Cron
export async function GET(req: NextRequest) { return handler(req) }

// POST — curl / manual trigger
export async function POST(req: NextRequest) { return handler(req) }
