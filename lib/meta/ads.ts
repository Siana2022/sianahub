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

export interface MetaSummary {
  spend: number
  spend_prev: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpp: number
  reach: number
  conversions: number
  cpl: number
  cpl_prev: number
  roas: number
}

export interface MetaCampaign {
  id: string
  nombre: string
  estado: string
  objetivo: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  cpl: number
  roas: number
}

export interface MetaDailyRow {
  fecha: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
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

function parseInsights(data: Record<string, string>[]): {
  spend: number; impressions: number; clicks: number
  conversions: number; reach: number
} {
  if (!data || data.length === 0) {
    return { spend: 0, impressions: 0, clicks: 0, conversions: 0, reach: 0 }
  }
  const row = data[0]
  // Use only one action type per conversion type to avoid double-counting.
  // Meta reports both 'lead' (Lead Ads) and 'offsite_conversion.fb_pixel_lead' (pixel)
  // for the same event — pick whichever is present, preferring 'lead'.
  const actions = Array.isArray(row.actions)
    ? (row.actions as { action_type: string; value: string }[])
    : []

  // Only count 'lead' action type to match Meta Business Manager "Resultados" column.
  // Meta reports both 'lead' (Lead Ads) and 'offsite_conversion.fb_pixel_lead' (pixel) —
  // prefer 'lead', fall back to pixel lead if not present.
  const leadCount      = actions.find(a => a.action_type === 'lead')
  const pixelLeadCount = actions.find(a => a.action_type === 'offsite_conversion.fb_pixel_lead')

  const conversions = parseFloat(leadCount?.value ?? pixelLeadCount?.value ?? '0')
  return {
    spend:       parseFloat(row.spend ?? '0'),
    impressions: parseInt(row.impressions ?? '0'),
    clicks:      parseInt(row.clicks ?? '0'),
    reach:       parseInt(row.reach ?? '0'),
    conversions,
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

  const c = parseInsights(curr.data ?? [])
  const p = parseInsights(prev.data ?? [])

  const roas = Array.isArray(curr.data?.[0]?.action_values)
    ? (curr.data[0].action_values as { action_type: string; value: string }[])
        .filter(a => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'purchase')
        .reduce((sum, a) => sum + parseFloat(a.value), 0) / (c.spend || 1)
    : 0

  return {
    spend:       c.spend,
    spend_prev:  p.spend,
    impressions: c.impressions,
    clicks:      c.clicks,
    reach:       c.reach,
    conversions: c.conversions,
    ctr:         c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    cpc:         c.clicks > 0 ? c.spend / c.clicks : 0,
    cpp:         c.reach > 0 ? (c.spend / c.reach) * 1000 : 0,
    cpl:         c.conversions > 0 ? c.spend / c.conversions : 0,
    cpl_prev:    p.conversions > 0 ? p.spend / p.conversions : 0,
    roas,
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
    const ins = parseInsights((c.insights as { data: Record<string, string>[] })?.data ?? [])
    const roas = Array.isArray((c.insights as { data: Record<string, unknown>[] })?.data?.[0]?.action_values)
      ? ((c.insights as { data: { action_values: { action_type: string; value: string }[] }[] }).data[0].action_values)
          .filter((a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')
          .reduce((sum, a) => sum + parseFloat(a.value), 0) / (ins.spend || 1)
      : 0

    return {
      id:          c.id as string,
      nombre:      c.name as string,
      estado:      c.status as string,
      objetivo:    c.objective as string,
      spend:       ins.spend,
      impressions: ins.impressions,
      clicks:      ins.clicks,
      conversions: ins.conversions,
      ctr:         ins.impressions > 0 ? (ins.clicks / ins.impressions) * 100 : 0,
      cpc:         ins.clicks > 0 ? ins.spend / ins.clicks : 0,
      cpl:         ins.conversions > 0 ? ins.spend / ins.conversions : 0,
      roas,
    }
  })
}

export async function fetchMetaDaily(adAccountId: string): Promise<MetaDailyRow[]> {
  const range = dateRange(30)
  const data = await metaFetch(`/act_${adAccountId}/insights`, {
    fields: 'spend,impressions,clicks,actions',
    time_range: JSON.stringify({ since: range.since, until: range.until }),
    time_increment: '1',
    level: 'account',
  })

  return (data.data ?? []).map((row: Record<string, unknown>) => {
    const acts = Array.isArray(row.actions) ? (row.actions as { action_type: string; value: string }[]) : []
    const leadAct = acts.find(a => a.action_type === 'lead') ?? acts.find(a => a.action_type === 'offsite_conversion.fb_pixel_lead')
    const conversions = parseFloat(leadAct?.value ?? '0')
    return {
      fecha:       row.date_start as string,
      spend:       parseFloat(row.spend as string ?? '0'),
      impressions: parseInt(row.impressions as string ?? '0'),
      clicks:      parseInt(row.clicks as string ?? '0'),
      conversions,
    }
  })
}
