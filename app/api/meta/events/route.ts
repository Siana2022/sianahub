import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMetaToken } from '@/lib/meta/token'

const API = 'https://graph.facebook.com/v21.0'

// Standard Meta pixel event names we care about
const STANDARD_EVENTS = new Set([
  'lead', 'contact', 'purchase', 'complete_registration',
  'schedule', 'submit_application', 'start_trial', 'subscribe',
  'find_location', 'view_content', 'add_to_cart', 'initiate_checkout',
  'page_view', 'add_to_wishlist', 'add_payment_info', 'donate',
])

// Standard ecommerce-only events (hide for leads projects)
export const ECOMMERCE_ONLY_EVENTS = new Set([
  'purchase', 'add_to_cart', 'initiate_checkout', 'add_payment_info', 'add_to_wishlist',
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

/** Normalize a Meta action_type to a canonical value we store.
 *  Returns null for engagement/non-conversion action types. */
function normalizeActionType(actionType: string): string | null {
  // Known standard pixel event
  if (STANDARD_EVENTS.has(actionType)) return actionType
  // offsite_conversion.fb_pixel_lead → lead, etc.
  if (actionType.startsWith('offsite_conversion.fb_pixel_')) {
    const evt = actionType.replace('offsite_conversion.fb_pixel_', '')
    if (STANDARD_EVENTS.has(evt)) return evt
    return null
  }
  // Custom conversion — keep full action_type
  if (actionType.startsWith('offsite_conversion.custom.')) return actionType
  // Everything else (link_click, post_engagement, video_view, etc.) — ignore
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

    // Fetch both in parallel
    const [insightsRes, customRes] = await Promise.all([
      // Insights: which events have data in the last year
      fetch(`${API}/act_${cleanId}/insights?` + new URLSearchParams({
        fields:       'actions',
        date_preset:  'last_year',
        level:        'account',
        limit:        '1',
        access_token: token,
      })),
      // Custom conversions with human-readable names
      fetch(`${API}/act_${cleanId}/customconversions?` + new URLSearchParams({
        fields:       'name,id',
        limit:        '100',
        access_token: token,
      })),
    ])

    const insightsData = insightsRes.ok ? await insightsRes.json() : { data: [] }
    const customData   = customRes.ok   ? await customRes.json()   : { data: [] }

    // Build a name map for custom conversions: action_type → human name
    const customNameMap = new Map<string, string>()
    for (const cc of (customData.data ?? []) as { id: string; name: string }[]) {
      customNameMap.set(`offsite_conversion.custom.${cc.id}`, cc.name)
    }

    const seen   = new Set<string>()
    const events: {
      value:  string
      label:  string
      type:   'standard' | 'custom'
      count?: number
    }[] = []

    // Process insights — events that have actually fired
    for (const row of insightsData.data ?? []) {
      for (const action of (row.actions ?? []) as { action_type: string; value: string }[]) {
        const normalized = normalizeActionType(action.action_type)
        if (!normalized || seen.has(normalized)) continue
        seen.add(normalized)

        const isCustom = normalized.startsWith('offsite_conversion.custom.')
        events.push({
          value: normalized,
          label: isCustom
            ? (customNameMap.get(normalized) ?? normalized)  // resolve ID → name
            : (EVENT_LABELS[normalized] ?? normalized),
          type:  isCustom ? 'custom' : 'standard',
          count: Math.round(parseFloat(action.value)),
        })
      }
    }

    // Add custom conversions with 0 data not yet in the list
    for (const cc of (customData.data ?? []) as { id: string; name: string }[]) {
      const value = `offsite_conversion.custom.${cc.id}`
      if (seen.has(value)) continue
      seen.add(value)
      events.push({ value, label: cc.name, type: 'custom', count: 0 })
    }

    // Sort: standard events first (by count desc), then custom (by count desc)
    events.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'standard' ? -1 : 1
      return (b.count ?? 0) - (a.count ?? 0)
    })

    return NextResponse.json({ events, account_id: cleanId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
