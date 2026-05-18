import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — fetch definitions + last 30 days of daily values
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()

  const { data: definitions, error } = await supabase
    .from('custom_metric_definitions')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('activa', true)
    .order('orden')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!definitions || definitions.length === 0) {
    return NextResponse.json({ definitions: [], daily: {} })
  }

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: daily } = await supabase
    .from('custom_metrics_daily')
    .select('definition_id, fecha, valor')
    .eq('cliente_id', clienteId)
    .gte('fecha', since.toISOString().slice(0, 10))
    .order('fecha')

  // Group daily values by definition_id
  const dailyByDef: Record<string, { fecha: string; valor: number }[]> = {}
  for (const row of daily ?? []) {
    if (!dailyByDef[row.definition_id]) dailyByDef[row.definition_id] = []
    dailyByDef[row.definition_id].push({ fecha: row.fecha, valor: row.valor })
  }

  return NextResponse.json({ definitions, daily: dailyByDef })
}

// POST — create a new definition
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('custom_metric_definitions')
    .insert({
      cliente_id:      clienteId,
      nombre_visible:  body.nombre_visible,
      event_name:      body.event_name,
      grupo:           body.grupo ?? null,
      orden:           body.orden ?? 0,
      activa:          true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — deactivate a definition
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const { id } = await req.json()
  const supabase = await createClient()

  await supabase
    .from('custom_metric_definitions')
    .update({ activa: false })
    .eq('id', id)
    .eq('cliente_id', clienteId)

  return NextResponse.json({ ok: true })
}
