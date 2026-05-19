import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const metaEventsConfigSchema = z.object({
  conversion_event:        z.string().optional(),
  conversion_events:       z.array(z.string()).optional(),
  breakdown_events:        z.array(z.string()).optional(),
  breakdown_event_labels:  z.record(z.string()).optional(),
  funnel_steps:            z.array(z.string()).optional(),
})

const sgtmEventConfigSchema = z.object({
  key:   z.string(),
  label: z.string(),
  url:   z.string().optional(),
})

const sgtmEventsConfigSchema = z.object({
  events: z.array(sgtmEventConfigSchema),
})

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  dominio: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  account_manager_id: z.string().uuid().optional().nullable(),
  estado: z.enum(['active', 'paused', 'churned']).optional(),
  notas: z.string().optional().nullable(),
  slack_channel_id: z.string().optional().nullable(),
  alertas_activas: z.boolean().optional(),
  tipo_proyecto: z.enum(['leads', 'ecommerce']).optional(),
  meta_events_config: metaEventsConfigSchema.optional(),
  ga4_property_id: z.string().optional().nullable(),
  ga4_account_id: z.string().optional().nullable(),
  gads_customer_id: z.string().optional().nullable(),
  gads_via_mcc: z.boolean().optional(),
  gsc_site_url: z.string().optional().nullable(),
  gtm_account_id: z.string().optional().nullable(),
  gtm_container_id: z.string().optional().nullable(),
  meta_ad_account_id: z.string().optional().nullable(),
  meta_pixel_id: z.string().optional().nullable(),
  sgtm_url: z.string().optional().nullable(),
  sgtm_service_name: z.string().optional().nullable(),
  gcp_project_id: z.string().optional().nullable(),
  resumen_widgets: z.array(z.string()).optional(),
  ga4_conversion_events: z.string().optional().nullable(),
  sgtm_events_config: sgtmEventsConfigSchema.optional().nullable(),
  alertas_config: z.object({
    cpl_max:        z.number().positive().optional(),
    leads_drop_pct: z.number().min(1).max(100).optional(),
    sin_sesiones_h: z.number().positive().optional(),
  }).optional().nullable(),
})

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/clientes/[clienteId]'>
) {
  const { clienteId } = await ctx.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/clientes/[clienteId]'>
) {
  const { clienteId } = await ctx.params
  const supabase = await createClient()
  const body = await req.json()

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(parsed.data)
    .eq('id', clienteId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/clientes/[clienteId]'>
) {
  const { clienteId } = await ctx.params
  const supabase = await createClient()

  const { error } = await supabase
    .from('clientes')
    .update({ estado: 'churned' })
    .eq('id', clienteId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
