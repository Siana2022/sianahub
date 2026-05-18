import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAlertToSlack } from '@/lib/slack'
import { z } from 'zod'

const createSchema = z.object({
  cliente_id: z.string().uuid(),
  tipo: z.string().min(1),
  severidad: z.enum(['low', 'medium', 'high', 'critical']),
  titulo: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  fuente: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const estado = searchParams.get('estado')
  const clienteId = searchParams.get('clienteId')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  let query = supabase
    .from('alerts')
    .select('*, clientes(nombre)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (estado) query = query.eq('estado', estado)
  if (clienteId) query = query.eq('cliente_id', clienteId)

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: alerta, error } = await supabase
    .from('alerts')
    .insert({
      ...parsed.data,
      estado: 'pending',
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Send Slack notification for critical/high alerts
  if (
    process.env.SLACK_BOT_TOKEN &&
    (parsed.data.severidad === 'critical' || parsed.data.severidad === 'high')
  ) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('nombre')
      .eq('id', parsed.data.cliente_id)
      .single()

    if (cliente) {
      await sendAlertToSlack({
        titulo: parsed.data.titulo,
        descripcion: parsed.data.descripcion ?? null,
        severidad: parsed.data.severidad,
        cliente_nombre: cliente.nombre,
        tipo: parsed.data.tipo,
      }).catch(console.error)
    }
  }

  return Response.json(alerta, { status: 201 })
}
