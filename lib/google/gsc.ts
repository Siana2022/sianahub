import { getGlobalGoogleToken } from './token'

const GSC_BASE = 'https://www.googleapis.com/webmasters/v3/sites'

async function gscFetch(siteUrl: string, body: object) {
  const token = await getGlobalGoogleToken()
  const encoded = encodeURIComponent(siteUrl)
  const res = await fetch(`${GSC_BASE}/${encoded}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC API error: ${err}`)
  }
  return res.json()
}

function dateNDaysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

type GscRow = {
  keys?: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function fetchGSCSummary(siteUrl: string) {
  const [curr, prev] = await Promise.all([
    gscFetch(siteUrl, { startDate: dateNDaysAgo(28), endDate: dateNDaysAgo(1) }),
    gscFetch(siteUrl, { startDate: dateNDaysAgo(56), endDate: dateNDaysAgo(29) }),
  ])

  const c: GscRow = curr.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  const p: GscRow = prev.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }

  return {
    clicks:           Math.round(c.clicks),
    clicks_prev:      Math.round(p.clicks),
    impressions:      Math.round(c.impressions),
    impressions_prev: Math.round(p.impressions),
    ctr:              c.ctr * 100,
    ctr_prev:         p.ctr * 100,
    position:         c.position,
    position_prev:    p.position,
  }
}

export async function fetchGSCSummaryRange(siteUrl: string, since: string, until: string) {
  // Calculate prev period of same duration
  const s = new Date(since)
  const u = new Date(until)
  const days = Math.round((u.getTime() - s.getTime()) / 86400000) + 1
  const prevUntilDate = new Date(s)
  prevUntilDate.setDate(prevUntilDate.getDate() - 1)
  const prevSinceDate = new Date(prevUntilDate)
  prevSinceDate.setDate(prevSinceDate.getDate() - days + 1)
  const prevSince = prevSinceDate.toISOString().slice(0, 10)
  const prevUntil = prevUntilDate.toISOString().slice(0, 10)

  const [curr, prev] = await Promise.all([
    gscFetch(siteUrl, { startDate: since, endDate: until }),
    gscFetch(siteUrl, { startDate: prevSince, endDate: prevUntil }),
  ])

  const c: GscRow = curr.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  const p: GscRow = prev.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }

  return {
    clicks:           Math.round(c.clicks),
    clicks_prev:      Math.round(p.clicks),
    impressions:      Math.round(c.impressions),
    impressions_prev: Math.round(p.impressions),
    ctr:              c.ctr * 100,
    ctr_prev:         p.ctr * 100,
    position:         c.position,
    position_prev:    p.position,
  }
}

export async function fetchGSCDaily(siteUrl: string) {
  const data = await gscFetch(siteUrl, {
    startDate:  dateNDaysAgo(29),
    endDate:    dateNDaysAgo(1),
    dimensions: ['date'],
  })

  return (data.rows ?? []).map((row: GscRow) => ({
    fecha:       row.keys![0],
    gsc_clicks:       Math.round(row.clicks),
    gsc_impressions:  Math.round(row.impressions),
  }))
}

export async function fetchGSCKeywords(siteUrl: string, limit = 20) {
  const data = await gscFetch(siteUrl, {
    startDate:  dateNDaysAgo(29),
    endDate:    dateNDaysAgo(1),
    dimensions: ['query'],
    rowLimit:   limit,
  })

  return (data.rows ?? []).map((row: GscRow) => ({
    keyword:     row.keys![0],
    clicks:      Math.round(row.clicks),
    impressions: Math.round(row.impressions),
    ctr:         row.ctr * 100,
    position:    row.position,
  }))
}
