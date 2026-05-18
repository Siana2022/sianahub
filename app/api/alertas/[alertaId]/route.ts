import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  estado: z.enum(['reviewing', 'resolved']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ alertaId: string }> }
) {
  const { alertaId } = await params
  const supabase = await createClient()
  const body = await req.json()

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const update: Record<string, unknown> = { estado: parsed.data.estado }
  if (parsed.data.estado === 'resolved') {
    update.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('alerts')
    .update(update)
    .eq('id', alertaId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
