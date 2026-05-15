import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const clienteSchema = z.object({
  nombre: z.string().min(1),
  dominio: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  account_manager_id: z.string().uuid().optional().nullable(),
  estado: z.enum(['active', 'paused', 'churned']).default('active'),
  notas: z.string().optional().nullable(),
  slack_channel_id: z.string().optional().nullable(),
  alertas_activas: z.boolean().default(true),
  ga4_property_id: z.string().optional().nullable(),
  ga4_account_id: z.string().optional().nullable(),
  gads_customer_id: z.string().optional().nullable(),
  gads_via_mcc: z.boolean().default(true),
  gsc_site_url: z.string().optional().nullable(),
  gtm_account_id: z.string().optional().nullable(),
  gtm_container_id: z.string().optional().nullable(),
  meta_ad_account_id: z.string().optional().nullable(),
  meta_pixel_id: z.string().optional().nullable(),
  sgtm_url: z.string().optional().nullable(),
  sgtm_service_name: z.string().optional().nullable(),
  gcp_project_id: z.string().optional().nullable(),
})

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const parsed = clienteSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
