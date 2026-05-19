export type TipoProyecto = 'leads' | 'ecommerce'

export interface AlertasConfig {
  cpl_max?:        number  // Alerta si CPL supera este valor (€)
  leads_drop_pct?: number  // Alerta si leads caen más de X% vs periodo anterior
  sin_sesiones_h?: number  // Horas sin sesiones GA4 (default 48)
}

export interface SgtmEventConfig {
  key:    string   // GA4 event name e.g. "lead_liften"
  label:  string   // human-readable e.g. "Liften"
  url?:   string   // thank you page URL e.g. "https://ceivanmedical.es/gracias-liften/"
}

export interface SgtmEventsConfig {
  events: SgtmEventConfig[]
}

export interface MetaEventsConfig {
  /** Primary conversion event for CPL/ROAS calculation (single) */
  conversion_event?: string
  /** Legacy: multiple events summed — kept for backward compat only */
  conversion_events?: string[]
  /** Breakdown events shown individually as attribution (NOT summed into total) */
  breakdown_events?: string[]
  /** Human-readable labels for breakdown events: eventKey → label */
  breakdown_event_labels?: Record<string, string>
  /** Funnel steps to display */
  funnel_steps?: string[]
}

export interface Cliente {
  id: string
  nombre: string
  dominio: string | null
  logo_url: string | null
  account_manager_id: string | null
  estado: 'active' | 'paused' | 'churned'
  notas: string | null
  slack_channel_id: string | null
  alertas_activas: boolean
  tipo_proyecto: TipoProyecto
  meta_events_config: MetaEventsConfig
  ga4_property_id: string | null
  ga4_account_id: string | null
  gads_customer_id: string | null
  ga4_conversion_events: string | null
  gads_via_mcc: boolean
  gsc_site_url: string | null
  gtm_account_id: string | null
  gtm_container_id: string | null
  meta_ad_account_id: string | null
  meta_pixel_id: string | null
  sgtm_url: string | null
  sgtm_service_name: string | null
  gcp_project_id: string | null
  sgtm_events_config: SgtmEventsConfig | null
  alertas_config: AlertasConfig | null
  created_at: string
  updated_at: string
}

export type ClienteInsert = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>
export type ClienteUpdate = Partial<ClienteInsert>
