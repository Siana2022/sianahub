import { getMetaToken } from './token'
import type { MetaEventsConfig } from '@/types/cliente'

const API = 'https://graph.facebook.com/v21.0'

async function metaFetch(path: string, params: Record<string, string> = {}) {
  const token = await getMetaToken()
  const qs = new URLSearchParams({ ...params, access_token: token })
  const res = await fetch(`${API}${path}?${qs}`)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meta API error: ${err}`)
  }
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MetaFunnel {
  page_views:        number
  view_content:      number
  add_to_cart:       number
  initiate_checkout: number
  purchases:         number
  revenue:           number
  /** Dynamic map: event_name → count (for any configured funnel step) */
  steps:             Record<string, number>
}

export interface MetaSummary {
  spend:        number
  spend_prev:   number
  impressions:  number
  clicks:       number
  ctr:          number
  cpc:          number
  cpp:          number
  reach:        number
  // Main conversions (driven by conversion_event config)
  conversions:  number
  cpl:          number       // cost per conversion
  cpl_prev:     number
  // Revenue / ecommerce
  roas:         number
  revenue:      number
  revenue_prev: number
  purchases:    number
  // Funnel
  funnel:       MetaFunnel
}

export interface MetaCampaign {
  id:          string
  nombre:      string
  estado:      string
  objetivo:    string
  spend:       number
  impressions: number
  clicks:      number
  ctr:         number
  cpc:         number
  // Main conversion
  conversions: number
  cpl:         number
  // Ecommerce
  purchases:   number
  revenue:     number
  roas:        number
}

export interface MetaDailyRow {
  fecha:       string
  spend:       number
  impressions: number
  clicks:      number
  conversions: number
  purchases:   number
  revenue:     number
}

// ── DateRange ──────────────────────────────────────────────────────────────────

export interface DateRange {
  since: string  // YYYY-MM-DD
  until: string  // YYYY-MM-DD
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<MetaEventsConfig> = {
  conversion_event: 'lead',
  funnel_steps: ['view_content', 'add_to_cart', 'initiate_checkout', 'purchase'],
}

function resolveConfig(config?: MetaEventsConfig): Required<MetaEventsConfig> {
  return {
    conversion_event: config?.conversion_event ?? DEFAULT_CONFIG.conversion_event,
    funnel_steps:     config?.funnel_steps     ?? DEFAULT_CONFIG.funnel_steps,
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dateRange(daysAgo: number) {
  const end   = new Date()
  const start = new Date()
  start.setDate(start.getDate() - daysAgo)
  return {
    since: start.toISOString().slice(0, 10),
    until: end.toISOString().slice(0, 10),
  }
}

/** Given a since/until range, compute a previous period of equal duration */
function prevDateRange(since: string, until: string): DateRange {
  const s = new Date(since)
  const u = new Date(until)
  const days = Math.round((u.getTime() - s.getTime()) / 86400000) + 1
  const prevUntil = new Date(s)
  prevUntil.setDate(prevUntil.getDate() - 1)
  const prevSince = new Date(prevUntil)
  prevSince.setDate(prevSince.getDate() - days + 1)
  return {
    since: prevSince.toISOString().slice(0, 10),
    until: prevUntil.toISOString().slice(0, 10),
  }
}

type ActionRow = { action_type: string; value: string }

function getAction(actions: ActionRow[], ...types: string[]): number {
  for (const type of types) {
    const a = actions.find(a => a.action_type === type)
    if (a) return parseFloat(a.value)
  }
  return 0
}

function getActionValue(actionValues: ActionRow[], ...types: string[]): number {
  for (const type of types) {
    const a = actionValues.find(a => a.action_type === type)
    if (a) return parseFloat(a.value)
  }
  return 0
}

function parseInsightsFull(data: Record<string, unknown>[]): {
  spend: number; impressions: number; clicks: number; reach: number
  actions: ActionRow[]; actionValues: ActionRow[]
} {
  if (!data || data.length === 0) {
    return { spend: 0, impressions: 0, clicks: 0, reach: 0, actions: [], actionValues: [] }
  }
  const row = data[0]
  return {
    spend:        parseFloat(row.spend       as string ?? '0'),
    impressions:  parseInt(row.impressions   as string ?? '0'),
    clicks:       parseInt(row.clicks        as string ?? '0'),
    reach:        parseInt(row.reach         as string ?? '0'),
    actions:      Array.isArray(row.actions)       ? (row.actions       as ActionRow[]) : [],
    actionValues: Array.isArray(row.action_values) ? (row.action_values as ActionRow[]) : [],
  }
}

// Common pixel fallback prefix
function pixelFallback(type: string) { return `offsite_conversion.fb_pixel_${type}` }

function buildFunnel(actions: ActionRow[], actionValues: ActionRow[], funnelSteps: string[] = []): MetaFunnel {
  const purchases = getAction(actions, 'purchase', pixelFallback('purchase'))

  // Build dynamic steps map for any configured event
  const steps: Record<string, number> = {}
  for (const step of funnelSteps) {
    steps[step] = getAction(actions, step, pixelFallback(step))
  }

  return {
    page_views:        getAction(actions, 'page_view'),
    view_content:      getAction(actions, 'view_content',      pixelFallback('view_content')),
    add_to_cart:       getAction(actions, 'add_to_cart',       pixelFallback('add_to_cart')),
    initiate_checkout: getAction(actions, 'initiate_checkout', pixelFallback('initiate_checkout')),
    purchases,
    revenue:           getActionValue(actionValues, 'purchase', pixelFallback('purchase')),
    steps,
  }
}

// ── API functions ──────────────────────────────────────────────────────────────

export async function fetchMetaSummary(
  adAccountId: string,
  config?: MetaEventsConfig,
  customRange?: DateRange
): Promise<MetaSummary> {
  const cfg    = resolveConfig(config)
  const fields = 'spend,impressions,clicks,reach,actions,action_values'

  let currRange: DateRange
  let prevRange: DateRange
  if (customRange) {
    currRange = customRange
    prevRange = prevDateRange(customRange.since, customRange.until)
  } else {
    currRange = dateRange(30)
    const range60 = dateRange(60)
    prevRange = { since: range60.since, until: currRange.since }
  }

  const [curr, prev] = await Promise.all([
    metaFetch(`/act_${adAccountId}/insights`, {
      fields,
      time_range: JSON.stringify({ since: currRange.since, until: currRange.until }),
      level: 'account',
    }),
    metaFetch(`/act_${adAccountId}/insights`, {
      fields,
      time_range: JSON.stringify({ since: prevRange.since, until: prevRange.until }),
      level: 'account',
    }),
  ])

  const c = parseInsightsFull(curr.data ?? [])
  const p = parseInsightsFull(prev.data ?? [])

  // Main conversions: use configured event type (with pixel fallback)
  const convEvent   = cfg.conversion_event
  const convPixel   = pixelFallback(convEvent)
  const convCurr    = getAction(c.actions, convEvent, convPixel)
  const convPrev    = getAction(p.actions, convEvent, convPixel)

  const funnel     = buildFunnel(c.actions, c.actionValues, cfg.funnel_steps)
  const funnelPrev = buildFunnel(p.actions, p.actionValues, cfg.funnel_steps)

  return {
    spend:        c.spend,
    spend_prev:   p.spend,
    impressions:  c.impressions,
    clicks:       c.clicks,
    reach:        c.reach,
    conversions:  convCurr,
    cpl:          convCurr > 0 ? c.spend / convCurr : 0,
    cpl_prev:     convPrev > 0 ? p.spend / convPrev : 0,
    purchases:    funnel.purchases,
    revenue:      funnel.revenue,
    revenue_prev: funnelPrev.revenue,
    roas:         c.spend > 0 ? funnel.revenue / c.spend : 0,
    ctr:          c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    cpc:          c.clicks > 0      ? c.spend / c.clicks               : 0,
    cpp:          c.reach > 0       ? (c.spend / c.reach) * 1000       : 0,
    funnel,
  }
}

export async function fetchMetaCampaigns(
  adAccountId: string,
  config?: MetaEventsConfig,
  customRange?: DateRange
): Promise<MetaCampaign[]> {
  const cfg   = resolveConfig(config)
  const range = customRange ?? dateRange(30)
  const data  = await metaFetch(`/act_${adAccountId}/campaigns`, {
    fields:     'id,name,status,objective,insights{spend,impressions,clicks,reach,actions,action_values}',
    time_range: JSON.stringify({ since: range.since, until: range.until }),
    limit:      '20',
  })

  const convEvent = cfg.conversion_event
  const convPixel = pixelFallback(convEvent)

  return (data.data ?? []).map((c: Record<string, unknown>) => {
    const insData = (c.insights as { data: Record<string, unknown>[] })?.data ?? []
    const ins     = parseInsightsFull(insData)
    const funnel  = buildFunnel(ins.actions, ins.actionValues, cfg.funnel_steps)
    const convs   = getAction(ins.actions, convEvent, convPixel)

    return {
      id:          c.id       as string,
      nombre:      c.name     as string,
      estado:      c.status   as string,
      objetivo:    c.objective as string,
      spend:       ins.spend,
      impressions: ins.impressions,
      clicks:      ins.clicks,
      conversions: convs,
      purchases:   funnel.purchases,
      revenue:     funnel.revenue,
      ctr:         ins.impressions > 0 ? (ins.clicks / ins.impressions) * 100 : 0,
      cpc:         ins.clicks > 0      ? ins.spend / ins.clicks               : 0,
      cpl:         convs > 0           ? ins.spend / convs                    : 0,
      roas:        ins.spend > 0       ? funnel.revenue / ins.spend           : 0,
    }
  })
}

export async function fetchMetaDaily(
  adAccountId: string,
  config?: MetaEventsConfig,
  customRange?: DateRange
): Promise<MetaDailyRow[]> {
  const cfg   = resolveConfig(config)
  const range = customRange ?? dateRange(30)
  const data  = await metaFetch(`/act_${adAccountId}/insights`, {
    fields:         'spend,impressions,clicks,actions,action_values',
    time_range:     JSON.stringify({ since: range.since, until: range.until }),
    time_increment: '1',
    level:          'account',
  })

  const convEvent = cfg.conversion_event
  const convPixel = pixelFallback(convEvent)

  return (data.data ?? []).map((row: Record<string, unknown>) => {
    const ins    = parseInsightsFull([row])
    const funnel = buildFunnel(ins.actions, ins.actionValues, cfg.funnel_steps)
    const convs  = getAction(ins.actions, convEvent, convPixel)

    return {
      fecha:       row.date_start as string,
      spend:       ins.spend,
      impressions: ins.impressions,
      clicks:      ins.clicks,
      conversions: convs,
      purchases:   funnel.purchases,
      revenue:     funnel.revenue,
    }
  })
}
