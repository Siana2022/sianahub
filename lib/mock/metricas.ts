import { subDays, format, eachDayOfInterval } from 'date-fns'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function seeded(base: number, day: number, variance = 0.3) {
  const factor = 1 + (Math.sin(day * 2.1 + base) * variance)
  return Math.max(0, Math.round(base * factor))
}

export function getDays(n = 30) {
  const end = new Date()
  const start = subDays(end, n - 1)
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
}

// ── GA4 ──────────────────────────────────────────────────────────────────────

export function mockGA4Daily(days = 30) {
  return getDays(days).map((fecha, i) => ({
    fecha,
    sessions: seeded(320, i),
    users: seeded(260, i),
    new_users: seeded(180, i),
    conversions: seeded(18, i),
    conversion_rate: randFloat(3.5, 7.2),
    bounce_rate: randFloat(32, 58),
    avg_session_duration: randFloat(90, 210),
  }))
}

export function mockGA4Summary() {
  const days = mockGA4Daily(30)
  const prev = mockGA4Daily(30)
  const sum = (arr: typeof days, key: keyof typeof days[0]) =>
    arr.reduce((a, b) => a + (b[key] as number), 0)

  return {
    sessions: sum(days, 'sessions'),
    sessions_prev: sum(prev, 'sessions'),
    users: sum(days, 'users'),
    users_prev: sum(prev, 'users'),
    conversions: sum(days, 'conversions'),
    conversions_prev: sum(prev, 'conversions'),
    conversion_rate: randFloat(4.2, 6.8),
    conversion_rate_prev: randFloat(3.8, 5.9),
    bounce_rate: randFloat(38, 52),
    avg_session_duration: randFloat(120, 180),
    daily: days,
  }
}

export function mockTrafficSources() {
  return [
    { source: 'google', medium: 'organic', sessions: rand(1800, 3200), conversions: rand(60, 140) },
    { source: 'google', medium: 'cpc', sessions: rand(900, 1800), conversions: rand(45, 110) },
    { source: 'facebook', medium: 'cpc', sessions: rand(400, 900), conversions: rand(15, 55) },
    { source: 'instagram', medium: 'cpc', sessions: rand(300, 700), conversions: rand(10, 40) },
    { source: '(direct)', medium: '(none)', sessions: rand(600, 1200), conversions: rand(20, 70) },
    { source: 'email', medium: 'newsletter', sessions: rand(150, 400), conversions: rand(8, 30) },
    { source: 'bing', medium: 'organic', sessions: rand(80, 200), conversions: rand(3, 15) },
    { source: 'referral', medium: 'referral', sessions: rand(100, 300), conversions: rand(4, 20) },
  ]
}

export function mockGeoData() {
  return [
    { country: 'España', sessions: rand(6000, 9000), pct: randFloat(72, 85) },
    { country: 'México', sessions: rand(400, 800), pct: randFloat(4, 8) },
    { country: 'Argentina', sessions: rand(200, 500), pct: randFloat(2, 5) },
    { country: 'Colombia', sessions: rand(150, 400), pct: randFloat(1.5, 4) },
    { country: 'Otros', sessions: rand(300, 700), pct: randFloat(3, 8) },
  ]
}

export function mockDeviceData() {
  return [
    { device: 'Mobile', sessions: rand(4500, 6500), pct: 58 },
    { device: 'Desktop', sessions: rand(2500, 3800), pct: 34 },
    { device: 'Tablet', sessions: rand(400, 700), pct: 8 },
  ]
}

export function mockTopPages() {
  const pages = [
    '/inicio', '/servicios', '/contacto', '/nosotros', '/blog',
    '/presupuesto', '/portfolio', '/precios', '/faq', '/gracias',
  ]
  return pages.map(page => ({
    page_path: page,
    sessions: rand(200, 2000),
    users: rand(180, 1800),
    conversions: rand(2, 80),
    conversion_rate: randFloat(0.5, 8.0),
  })).sort((a, b) => b.sessions - a.sessions)
}

// ── GSC ──────────────────────────────────────────────────────────────────────

export function mockGSCDaily(days = 30) {
  return getDays(days).map((fecha, i) => ({
    fecha,
    gsc_clicks: seeded(85, i),
    gsc_impressions: seeded(3200, i),
    gsc_ctr: randFloat(1.8, 4.2),
    gsc_position: randFloat(8.5, 18.0),
  }))
}

export function mockGSCSummary() {
  const days = mockGSCDaily(30)
  return {
    clicks: days.reduce((a, b) => a + b.gsc_clicks, 0),
    clicks_prev: rand(1800, 2800),
    impressions: days.reduce((a, b) => a + b.gsc_impressions, 0),
    impressions_prev: rand(70000, 110000),
    ctr: randFloat(2.1, 3.8),
    ctr_prev: randFloat(1.9, 3.2),
    position: randFloat(10.2, 16.5),
    position_prev: randFloat(11.0, 18.0),
    daily: days,
  }
}

export function mockKeywords() {
  const keywords = [
    'agencia marketing digital valencia', 'diseño web valencia', 'seo valencia',
    'google ads agencia', 'marketing digital empresa', 'posicionamiento web',
    'publicidad facebook ads', 'agencia publicidad online', 'diseño web profesional',
    'consultoría marketing digital', 'gestión redes sociales', 'email marketing',
  ]
  return keywords.map(kw => ({
    keyword: kw,
    clicks: rand(10, 450),
    impressions: rand(200, 8000),
    ctr: randFloat(1.5, 12.0),
    position: randFloat(1.2, 25.0),
  })).sort((a, b) => b.clicks - a.clicks)
}

// ── Google Ads ────────────────────────────────────────────────────────────────

export function mockAdsDaily(days = 30) {
  return getDays(days).map((fecha, i) => ({
    fecha,
    spend: randFloat(45, 180),
    clicks: seeded(85, i),
    impressions: seeded(2800, i),
    conversions: seeded(6, i),
    ctr: randFloat(2.1, 5.8),
    cpc: randFloat(0.65, 2.40),
    cpl: randFloat(8, 32),
  }))
}

export function mockAdsSummary() {
  const days = mockAdsDaily(30)
  return {
    spend: parseFloat(days.reduce((a, b) => a + b.spend, 0).toFixed(2)),
    spend_prev: randFloat(2800, 4200),
    clicks: days.reduce((a, b) => a + b.clicks, 0),
    impressions: days.reduce((a, b) => a + b.impressions, 0),
    conversions: days.reduce((a, b) => a + b.conversions, 0),
    conversions_prev: rand(80, 160),
    ctr: randFloat(2.8, 4.9),
    cpc: randFloat(0.85, 1.95),
    cpl: randFloat(12, 28),
    cpl_prev: randFloat(14, 32),
    roas: randFloat(2.8, 6.5),
    daily: days,
  }
}

export function mockAdsCampaigns() {
  const campaigns = [
    { nombre: 'Búsqueda — Marca', estado: 'ENABLED' },
    { nombre: 'Búsqueda — Competencia', estado: 'ENABLED' },
    { nombre: 'Búsqueda — Servicios', estado: 'ENABLED' },
    { nombre: 'Display — Remarketing', estado: 'ENABLED' },
    { nombre: 'Performance Max', estado: 'ENABLED' },
    { nombre: 'Búsqueda — Branding 2023', estado: 'PAUSED' },
  ]
  return campaigns.map(c => ({
    ...c,
    spend: randFloat(120, 1200),
    clicks: rand(80, 800),
    impressions: rand(2000, 25000),
    conversions: rand(3, 60),
    ctr: randFloat(1.8, 7.2),
    cpc: randFloat(0.55, 3.20),
    cpl: randFloat(8, 45),
  }))
}

// ── Meta ─────────────────────────────────────────────────────────────────────

export function mockMetaDaily(days = 30) {
  return getDays(days).map((fecha, i) => ({
    fecha,
    spend: randFloat(25, 120),
    reach: seeded(3200, i),
    impressions: seeded(5800, i),
    clicks: seeded(95, i),
    conversions: seeded(4, i),
    cpl: randFloat(6, 28),
    ctr: randFloat(1.2, 4.5),
    video_views: seeded(850, i),
  }))
}

export function mockMetaSummary() {
  const days = mockMetaDaily(30)
  return {
    spend: parseFloat(days.reduce((a, b) => a + b.spend, 0).toFixed(2)),
    spend_prev: randFloat(1400, 2800),
    reach: days.reduce((a, b) => a + b.reach, 0),
    impressions: days.reduce((a, b) => a + b.impressions, 0),
    clicks: days.reduce((a, b) => a + b.clicks, 0),
    conversions: days.reduce((a, b) => a + b.conversions, 0),
    conversions_prev: rand(50, 120),
    cpl: randFloat(8, 22),
    cpl_prev: randFloat(10, 28),
    ctr: randFloat(1.6, 3.8),
    video_views: days.reduce((a, b) => a + b.video_views, 0),
    daily: days,
  }
}

export function mockMetaCampaigns() {
  const campaigns = [
    { nombre: 'Conversiones — Leads Formulario', estado: 'ACTIVE' },
    { nombre: 'Tráfico — Blog y Recursos', estado: 'ACTIVE' },
    { nombre: 'Reconocimiento — Branding', estado: 'ACTIVE' },
    { nombre: 'Retargeting — Visitantes Web', estado: 'ACTIVE' },
    { nombre: 'Catálogo — Productos Destacados', estado: 'PAUSED' },
  ]
  return campaigns.map(c => ({
    ...c,
    spend: randFloat(80, 800),
    reach: rand(2000, 18000),
    impressions: rand(4000, 35000),
    clicks: rand(60, 600),
    conversions: rand(2, 45),
    cpl: randFloat(6, 40),
    ctr: randFloat(0.9, 5.5),
  }))
}

// ── Resumen consolidado ───────────────────────────────────────────────────────

export function mockResumen() {
  const ga4 = mockGA4Summary()
  const ads = mockAdsSummary()
  const meta = mockMetaSummary()
  const gsc = mockGSCSummary()

  return {
    total_leads: ga4.conversions + ads.conversions + meta.conversions,
    total_leads_prev: ga4.conversions_prev + ads.conversions_prev + meta.conversions_prev,
    organic_leads: ga4.conversions,
    gads_leads: ads.conversions,
    meta_leads: meta.conversions,
    gads_spend: ads.spend,
    meta_spend: meta.spend,
    total_spend: ads.spend + meta.spend,
    sessions: ga4.sessions,
    sessions_prev: ga4.sessions_prev,
    conversion_rate: ga4.conversion_rate,
    gsc_clicks: gsc.clicks,
    gsc_position: gsc.position,
    gads_cpl: ads.cpl,
    meta_cpl: meta.cpl,
    roas: ads.roas,
  }
}
