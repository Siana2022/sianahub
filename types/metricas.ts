export interface MetricasDiarias {
  id: string
  cliente_id: string
  fuente: 'ga4' | 'google_ads' | 'gsc' | 'meta'
  fecha: string
  sessions?: number
  users?: number
  new_users?: number
  conversions?: number
  conversion_rate?: number
  bounce_rate?: number
  avg_session_duration?: number
  spend?: number
  impressions?: number
  clicks?: number
  ctr?: number
  cpc?: number
  cpl?: number
  conversions_ads?: number
  roas?: number
  reach?: number
  engagement?: number
  cost_per_engagement?: number
  video_views?: number
  cpv?: number
  gsc_clicks?: number
  gsc_impressions?: number
  gsc_ctr?: number
  gsc_position?: number
}

export interface CustomMetricDefinition {
  id: string
  cliente_id: string
  nombre_visible: string
  event_name: string
  grupo: string | null
  orden: number
  activa: boolean
}

export interface CustomMetricData {
  definition: CustomMetricDefinition
  valor_actual: number
  valor_anterior: number
  delta_pct: number
}
