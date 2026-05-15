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
  ga4_property_id: string | null
  ga4_account_id: string | null
  gads_customer_id: string | null
  gads_via_mcc: boolean
  gsc_site_url: string | null
  gtm_account_id: string | null
  gtm_container_id: string | null
  meta_ad_account_id: string | null
  meta_pixel_id: string | null
  sgtm_url: string | null
  sgtm_service_name: string | null
  gcp_project_id: string | null
  created_at: string
  updated_at: string
}

export type ClienteInsert = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>
export type ClienteUpdate = Partial<ClienteInsert>
