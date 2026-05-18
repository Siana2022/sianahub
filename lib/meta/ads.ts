import { getMetaToken } from './token'

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
  page_views:       number
  view_content:     number
  add_to_cart:      number
  initiate_checkout: number
  purchases:        number
  revenue:          number
}

export interface MetaSummary {
  spend:       number
  spend_prev:  number
  impressions: number
  clicks:      number
  ctr:         number
  cpc:         number
  cpp:         number
  reach:       number
  // Leads mode
  conversions: number
  cpl:         number
  cpl_prev:    number
  // Ecommerce mode
  roas:        number
  revenue:     number
  revenue_prev: number
  purchases:   number
  // Funnel
  funnel:      MetaFunnel
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
  // Leads
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function dateRange(daysAgo: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - daysAgo)
  return {
    since: start.toISOString().slice(0, 10),
    until: end.toISOString().slice(0, 10),
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
  leads: number; purchases: number; revenue: number
  funnel: MetaFunnel
} {
  if (!data || data.length === 0) {
    return { spend: 0, impressions: 0, clicks: 0, reach: 0, leads: 0, purchases: 0, revenue: 0, funnel: { page_views: 0, view_content: 0, add_to_cart: 0, initiate_checkout: 0, purchases: 0, revenue: 0 } }
  }
  const row = data[0]
  const actions:      ActionRow[] = Array.isArray(row.actions)       ? (row.actions as ActionRow[])       : []
  const actionValues: ActionRow[] = Array.isArray(row.action_values) ? (row.action_values as ActionRow[]) : []

  const leads     = getAction(actions, 'lead', 'offsite_conversion.fb_pixel_lead')
  const purchases = getAction(actions, 'purchase', 'offsite_conversion.fb_pixel_purchase')
  const revenue   = getActionValue(actionValues, 'purchase', 'offsite_conversion.fb_pixel_purchase')

  const funnel: MetaFunnel = {
    page_views:        getAction(actions, 'page_view'),
    view_content:      getAction(actions, 'view_content', 'offsite_conversion.fb_pixel_view_content'),
    add_to_cart:       getAction(actions, 'add_to_cart',  'offsite_conversion.fb_pixel_add_to_cart'),
    initiate_checkout: getAction(actions, 'initiate_checkout', 'offsite_conversion.fb_pixel_initiate_checkout'),
    purchases,
    revenue,
  }

  return {
    spend:       parseFloat(row.spend as string ?? '0'),
    impressions: parseInt(row.impressions as string ?? '0'),
    clicks:      parseInt(row.clicks as string ?? '0'),
    reach:       parseInt(row.reach as string ?? '0'),
    leads,
    purchases,
    revenue,
    funnel,
  }
}

// ── API functions ──────────────────────────────────────────────────────────────

export async function fetchMetaSummary(adAccountId: string): Promise<MetaSummary> {
  const fields = 'spend,impressions,clicks,reach,actions,action_values'
  const range30 = dateRange(30)
  const range60 = dateRange(60)

  const [curr, prev] = await Promise.all([
    metaFetch(`/act_${adAccountId}/insights`, {
      fields,
      time_range: JSON.stringify({ since: range30.since, until: range30.until }),
      level: 'account',
    }),
    metaFetch(`/act_${adAccountId}/insights`, {
      fields,
      time_range: JSON.stringify({ since: range60.since, until: range30.since }),
      level: 'account',
    }),
  ])

  const c = parseInsightsFull(curr.data ?? [])
  const p = parseInsightsFull(prev.data ?? [])

  return {
    spend:        c.spend,
    spend_prev:   p.spend,
    impressions:  c.impressions,
    clicks:       c.clicks,
    reach:        c.reach,
    conversions:  c.leads,
    cpl:          c.leads > 0     ? c.spend / c.leads     : 0,
    cpl_prev:     p.leads > 0     ? p.spend / p.leads     : 0,
    purchases:    c.purchases,
    revenue:      c.revenue,
    revenue_prev: p.revenue,
    roas:         c.spend > 0     ? c.revenue / c.spend   : 0,
    ctr:          c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    cpc:          c.clicks > 0    ? c.spend / c.clicks    : 0,
    cpp:          c.reach > 0     ? (c.spend / c.reach) * 1000 : 0,
    funnel:       c.funnel,
  }
}

export async function fetchMetaCampaigns(adAccountId: string): Promise<MetaCampaign[]> {
  const range = dateRange(30)
  const data = await metaFetch(`/act_${adAccountId}/campaigns`, {
    fields: 'id,name,status,objective,insights{spend,impressions,clicks,reach,actions,action_values}',
    time_range: JSON.stringify({ since: range.since, until: range.until }),
    limit: '20',
  })

  return (data.data ?? []).map((c: Record<string, unknown>) => {
    const insData = (c.insights as { data: Record<string, unknown>[] })?.data ?? []
    const ins = parseInsightsFull(insData)

    return {
      id:          c.id as string,
      nombre:      c.name as string,
      estado:      c.status as string,
      objetivo:    c.objective as string,
      spend:       ins.spend,
      impressions: ins.impressions,
      clicks:      ins.clicks,
      conversions: ins.leads,
      purchases:   ins.purchases,
      revenue:     ins.revenue,
      ctr:         ins.impressions > 0 ? (ins.clicks / ins.impressions) * 100 : 0,
      cpc:         ins.clicks > 0      ? ins.spend / ins.clicks               : 0,
      cpl:         ins.leads > 0       ? ins.spend / ins.leads                : 0,
      roas:        ins.spend > 0       ? ins.revenue / ins.spend              : 0,
    }
  })
}

export async function fetchMetaDaily(adAccountId: string): Promise<MetaDailyRow[]> {
  const range = dateRange(30)
  const data = await metaFetch(`/act_${adAccountId}/insights`, {
    fields: 'spend,impressions,clicks,actions,action_values',
    time_range: JSON.stringify({ since: range.since, until: range.until }),
    time_increment: '1',
    level: 'account',
  })

  return (data.data ?? []).map((row: Record<string, unknown>) => {
    const ins = parseInsightsFull([row])
    return {
      fecha:       row.date_start as string,
      spend:       ins.spend,
      impressions: ins.impressions,
      clicks:      ins.clicks,
      conversions: ins.leads,
      purchases:   ins.purchases,
      revenue:     ins.revenue,
    }
  })
}
