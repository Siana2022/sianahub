import { getGlobalGoogleToken } from './token'

const GADS_BASE = 'https://googleads.googleapis.com/v18'

async function gadsSearch(customerId: string, query: string) {
  const token    = await getGlobalGoogleToken()
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!
  const mccId    = process.env.GOOGLE_ADS_MCC_ID!

  // Strip dashes from customer ID (API requires plain number)
  const cid = customerId.replace(/-/g, '')

  const res = await fetch(`${GADS_BASE}/customers/${cid}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization:       `Bearer ${token}`,
      'developer-token':   devToken,
      'login-customer-id': mccId.replace(/-/g, ''),
      'Content-Type':      'application/json',
    },
    body: JSON.stringify({ query }),
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Ads API error: ${err}`)
  }
  return res.json()
}

// ── Summary (last 30 days) ────────────────────────────────────────────────────

export async function fetchGAdsSummary(customerId: string) {
  const [curr, prev] = await Promise.all([
    gadsSearch(customerId, `
      SELECT
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
    `),
    gadsSearch(customerId, `
      SELECT
        metrics.cost_micros,
        metrics.conversions
      FROM customer
      WHERE segments.date DURING LAST_MONTH
    `),
  ])

  function parse(data: { results?: { metrics: Record<string, string> }[] }) {
    const m = data.results?.[0]?.metrics ?? {}
    const spend       = parseInt(m.costMicros ?? '0') / 1_000_000
    const clicks      = parseInt(m.clicks ?? '0')
    const impressions = parseInt(m.impressions ?? '0')
    const conversions = parseFloat(m.conversions ?? '0')
    const ctr         = parseFloat(m.ctr ?? '0') * 100
    const cpc         = parseInt(m.averageCpc ?? '0') / 1_000_000
    const cpl         = conversions > 0 ? spend / conversions : 0
    return { spend, clicks, impressions, conversions, ctr, cpc, cpl }
  }

  const c = parse(curr)
  const p = parse(prev)

  return {
    spend:            c.spend,         spend_prev:       p.spend,
    clicks:           c.clicks,
    impressions:      c.impressions,
    conversions:      Math.round(c.conversions), conversions_prev: Math.round(p.conversions),
    ctr:              c.ctr,
    cpc:              c.cpc,
    cpl:              c.cpl,           cpl_prev:         p.cpl,
  }
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export async function fetchGAdsCampaigns(customerId: string) {
  const data = await gadsSearch(customerId, `
    SELECT
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 20
  `)

  type Row = { campaign: { name: string; status: string }; metrics: Record<string, string> }

  return (data.results ?? []).map((row: Row) => {
    const m           = row.metrics
    const spend       = parseInt(m.costMicros ?? '0') / 1_000_000
    const conversions = parseFloat(m.conversions ?? '0')
    return {
      nombre:      row.campaign.name,
      estado:      row.campaign.status,
      spend,
      clicks:      parseInt(m.clicks ?? '0'),
      impressions: parseInt(m.impressions ?? '0'),
      conversions: Math.round(conversions),
      ctr:         parseFloat(m.ctr ?? '0') * 100,
      cpc:         parseInt(m.averageCpc ?? '0') / 1_000_000,
      cpl:         conversions > 0 ? spend / conversions : 0,
    }
  })
}

// ── Daily spend + conversions ─────────────────────────────────────────────────

export async function fetchGAdsDaily(customerId: string) {
  const data = await gadsSearch(customerId, `
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.conversions
    FROM customer
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY segments.date ASC
  `)

  type Row = { segments: { date: string }; metrics: Record<string, string> }

  return (data.results ?? []).map((row: Row) => ({
    fecha:       row.segments.date,
    spend:       parseInt(row.metrics.costMicros ?? '0') / 1_000_000,
    conversions: Math.round(parseFloat(row.metrics.conversions ?? '0')),
  }))
}
