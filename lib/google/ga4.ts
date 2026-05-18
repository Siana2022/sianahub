import { getGlobalGoogleToken } from './token'

const GA4_BASE = 'https://analyticsdata.googleapis.com/v1beta'

async function ga4Fetch(propertyId: string, body: object) {
  const token = await getGlobalGoogleToken()
  const res = await fetch(`${GA4_BASE}/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 3600 }, // cache 1h
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 API error: ${err}`)
  }
  return res.json()
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dim(name: string) { return { name } }
function met(name: string) { return { name } }
function dateRange(startDate: string, endDate: string) { return { startDate, endDate } }

function getVal(row: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }, idx: number, type: 'dim' | 'met') {
  const vals = type === 'dim' ? row.dimensionValues : row.metricValues
  return vals?.[idx]?.value ?? '0'
}

// ── Summary (últimos 30 días) ──────────────────────────────────────────────────

export async function fetchGA4Summary(propertyId: string) {
  const data = await ga4Fetch(propertyId, {
    dateRanges: [dateRange('30daysAgo', 'today'), dateRange('60daysAgo', '31daysAgo')],
    metrics: [
      met('sessions'), met('activeUsers'), met('newUsers'),
      met('conversions'), met('bounceRate'), met('averageSessionDuration'),
    ],
  })

  const curr = data.rows?.[0]?.metricValues ?? []
  const prev = data.rows?.[1]?.metricValues ?? []

  const n = (i: number, rows: { value: string }[]) => parseFloat(rows[i]?.value ?? '0')

  return {
    sessions:              Math.round(n(0, curr)),
    sessions_prev:         Math.round(n(0, prev)),
    users:                 Math.round(n(1, curr)),
    users_prev:            Math.round(n(1, prev)),
    new_users:             Math.round(n(2, curr)),
    conversions:           Math.round(n(3, curr)),
    conversions_prev:      Math.round(n(3, prev)),
    bounce_rate:           n(4, curr) * 100,
    avg_session_duration:  n(5, curr),
    conversion_rate:       curr[0]?.value ? (n(3, curr) / n(0, curr)) * 100 : 0,
  }
}

// ── Summary with explicit date range ──────────────────────────────────────────

export async function fetchGA4SummaryRange(propertyId: string, since: string, until: string) {
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

  const data = await ga4Fetch(propertyId, {
    dateRanges: [dateRange(since, until), dateRange(prevSince, prevUntil)],
    metrics: [
      met('sessions'), met('activeUsers'), met('newUsers'),
      met('conversions'), met('bounceRate'), met('averageSessionDuration'),
    ],
  })

  const curr = data.rows?.[0]?.metricValues ?? []
  const prev = data.rows?.[1]?.metricValues ?? []

  const n = (i: number, rows: { value: string }[]) => parseFloat(rows[i]?.value ?? '0')

  return {
    sessions:              Math.round(n(0, curr)),
    sessions_prev:         Math.round(n(0, prev)),
    users:                 Math.round(n(1, curr)),
    users_prev:            Math.round(n(1, prev)),
    new_users:             Math.round(n(2, curr)),
    conversions:           Math.round(n(3, curr)),
    conversions_prev:      Math.round(n(3, prev)),
    bounce_rate:           n(4, curr) * 100,
    avg_session_duration:  n(5, curr),
    conversion_rate:       curr[0]?.value ? (n(3, curr) / n(0, curr)) * 100 : 0,
  }
}

// ── Daily (últimos 30 días) ────────────────────────────────────────────────────

export async function fetchGA4Daily(propertyId: string) {
  const data = await ga4Fetch(propertyId, {
    dateRanges: [dateRange('29daysAgo', 'today')],
    dimensions: [dim('date')],
    metrics:    [met('sessions'), met('activeUsers'), met('newUsers'), met('conversions')],
    orderBys:   [{ dimension: { dimensionName: 'date' } }],
  })

  return (data.rows ?? []).map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
    const d = row.dimensionValues[0].value // YYYYMMDD
    const fecha = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
    return {
      fecha,
      sessions:    parseInt(row.metricValues[0].value),
      users:       parseInt(row.metricValues[1].value),
      new_users:   parseInt(row.metricValues[2].value),
      conversions: parseInt(row.metricValues[3].value),
    }
  })
}

// ── Top pages ──────────────────────────────────────────────────────────────────

export async function fetchGA4TopPages(propertyId: string, limit = 10) {
  const data = await ga4Fetch(propertyId, {
    dateRanges: [dateRange('30daysAgo', 'today')],
    dimensions: [dim('pagePath')],
    metrics:    [met('sessions'), met('activeUsers'), met('conversions')],
    orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
    limit,
  })

  return (data.rows ?? []).map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
    const sessions    = parseInt(row.metricValues[0].value)
    const users       = parseInt(row.metricValues[1].value)
    const conversions = parseInt(row.metricValues[2].value)
    return {
      page_path:       row.dimensionValues[0].value,
      sessions,
      users,
      conversions,
      conversion_rate: sessions > 0 ? (conversions / sessions) * 100 : 0,
    }
  })
}

// ── Traffic sources ────────────────────────────────────────────────────────────

export async function fetchGA4TrafficSources(propertyId: string) {
  const data = await ga4Fetch(propertyId, {
    dateRanges: [dateRange('30daysAgo', 'today')],
    dimensions: [dim('sessionSource'), dim('sessionMedium')],
    metrics:    [met('sessions'), met('activeUsers'), met('conversions')],
    orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 20,
  })

  return (data.rows ?? []).map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    source:      row.dimensionValues[0].value,
    medium:      row.dimensionValues[1].value,
    sessions:    parseInt(row.metricValues[0].value),
    users:       parseInt(row.metricValues[1].value),
    conversions: parseInt(row.metricValues[2].value),
  }))
}

// ── Device / Geo ───────────────────────────────────────────────────────────────

export async function fetchGA4Devices(propertyId: string) {
  const data = await ga4Fetch(propertyId, {
    dateRanges: [dateRange('30daysAgo', 'today')],
    dimensions: [dim('deviceCategory')],
    metrics:    [met('sessions')],
    orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
  })
  return (data.rows ?? []).map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    device:   row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value),
  }))
}

export async function fetchGA4Geo(propertyId: string) {
  const data = await ga4Fetch(propertyId, {
    dateRanges: [dateRange('30daysAgo', 'today')],
    dimensions: [dim('country')],
    metrics:    [met('sessions')],
    orderBys:   [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 8,
  })
  return (data.rows ?? []).map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    country:  row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value),
  }))
}
