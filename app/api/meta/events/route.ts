import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMetaToken } from '@/lib/meta/token'

const API = 'https://graph.facebook.com/v21.0'

// Standard Meta pixel event names
const STANDARD_EVENTS = new Set([
  'lead', 'contact', 'purchase', 'complete_registration',
  'schedule', 'submit_application', 'start_trial', 'subscribe',
  'find_location', 'view_content', 'add_to_cart', 'initiate_checkout',
  'page_view', 'add_to_wishlist', 'add_payment_info', 'donate',
])

const EVENT_LABELS: Record<string, string> = {
  lead:                  'Lead (formulario Meta)',
  contact:               'Contacto',
  purchase:              'Compra',
  complete_registration: 'Registro completado',
  schedule:              'Cita programada',
  submit_application:    'Solicitud enviada',
  start_trial:           'Trial iniciado (Financiación)',
  subscribe:             'Suscripción',
  find_location:         'Find Location',
  view_content:          'View Content',
  add_to_cart:           'Add to Cart',
  initiate_checkout:     'Checkout',
  page_view:             'Page View',
  add_to_wishlist:       'Add to Wishlist',
  add_payment_info:      'Add Payment Info',
  donate:                'Donación',
}

/** Map an action_type from Meta insights back to a canonical event name */
function normalizeActionType(actionType: string): string | null {
  if (STANDARD_EVENTS.has(actionType)) return actionType
  // offsite_conversion.fb_pixel_lead → lead, etc.
  if (actionType.startsWith('offsite_conversion.fb_pixel_')) {
    const evt = actionType.replace('offsite_conversion.fb_pixel_', '')
    if (STANDARD_EVENTS.has(evt)) return evt
  }
  // Custom conversions — keep the full action_type
  if (actionType.startsWith('offsite_conversion.custom.')) return actionType
  return null
}

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('account_id')
  if (!accountId) {
    return NextResponse.json({ error: 'Missing account_id' }, { status: 400 })
  }

  try {
    const token   = await getMetaToken()
    const cleanId = accountId.replace(/^act_/, '')

    // 1. Insights: which events have actually fired in this account (last 12 months)
    const insightsRes = await fetch(
      `${API}/act_${cleanId}/insights?` + new URLSearchParams({
        fields:      'actions',
        date_preset: 'last_year',
        level:       'account',
        limit:       '1',
        access_token: token,
      })
    )

    // 2. Custom conversions defined in this account
    const customRes = await fetch(
      `${API}/act_${cleanId}/customconversions?` + new URLSearchParams({
        fields:      'name,id,event_source_type',
        limit:       '50',
        access_token: token,
      })
    )

    const insightsData = insightsRes.ok ? await insightsRes.json() : { data: [] }
    const customData   = customRes.ok   ? await customRes.json()   : { data: [] }

    // Collect standard events that have actually fired
    const seen = new Set<string>()
    const events: { value: string; label: string; type: 'standard' | 'custom'; count?: number }[] = []

    for (const row of insightsData.data ?? []) {
      for (const action of (row.actions ?? []) as { action_type: string; value: string }[]) {
        const normalized = normalizeActionType(action.action_type)
        if (!normalized || seen.has(normalized)) continue
        seen.add(normalized)
        events.push({
          value: normalized,
          label: EVENT_LABELS[normalized] ?? normalized,
          type:  'standard',
          count: Math.round(parseFloat(action.value)),
        })
      }
    }

    // Add custom conversions (deduplicated)
    for (const cc of (customData.data ?? []) as { id: string; name: string }[]) {
      const value = `offsite_conversion.custom.${cc.id}`
      if (seen.has(value)) continue
      seen.add(value)
      events.push({
        value,
        label: cc.name,
        type:  'custom',
      })
    }

    // Sort: standard events first, then by count desc
    events.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'standard' ? -1 : 1
      return (b.count ?? 0) - (a.count ?? 0)
    })

    return NextResponse.json({ events, account_id: cleanId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
