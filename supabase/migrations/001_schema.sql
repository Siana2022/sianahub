create extension if not exists "uuid-ossp";

create table users (
  id uuid references auth.users primary key,
  nombre text not null,
  email text not null unique,
  rol text not null default 'account_manager'
    check (rol in ('admin', 'account_manager')),
  avatar_url text,
  created_at timestamptz default now()
);

create table clientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  dominio text,
  logo_url text,
  account_manager_id uuid references users(id),
  estado text default 'active'
    check (estado in ('active', 'paused', 'churned')),
  notas text,
  slack_channel_id text,
  alertas_activas boolean default true,
  ga4_property_id text,
  ga4_account_id text,
  gads_customer_id text,
  gads_via_mcc boolean default true,
  gsc_site_url text,
  gtm_account_id text,
  gtm_container_id text,
  meta_ad_account_id text,
  meta_pixel_id text,
  sgtm_url text,
  sgtm_service_name text,
  gcp_project_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table oauth_tokens (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  plataforma text not null check (plataforma in ('google', 'meta')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(cliente_id, plataforma)
);

create table metrics_daily (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  fuente text not null check (fuente in ('ga4', 'google_ads', 'gsc', 'meta')),
  fecha date not null,
  sessions integer,
  users integer,
  new_users integer,
  conversions integer,
  conversion_rate numeric(5,2),
  bounce_rate numeric(5,2),
  avg_session_duration numeric(8,2),
  spend numeric(10,2),
  impressions integer,
  clicks integer,
  ctr numeric(5,2),
  cpc numeric(8,2),
  cpl numeric(8,2),
  conversions_ads integer,
  roas numeric(6,2),
  reach integer,
  engagement integer,
  cost_per_engagement numeric(8,2),
  video_views integer,
  cpv numeric(8,2),
  gsc_clicks integer,
  gsc_impressions integer,
  gsc_ctr numeric(5,2),
  gsc_position numeric(5,2),
  created_at timestamptz default now(),
  unique(cliente_id, fuente, fecha)
);

create table custom_metric_definitions (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  nombre_visible text not null,
  event_name text not null,
  grupo text,
  orden integer default 0,
  activa boolean default true,
  created_at timestamptz default now()
);

create table custom_metrics_daily (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  definition_id uuid references custom_metric_definitions(id) on delete cascade,
  fecha date not null,
  valor integer not null default 0,
  created_at timestamptz default now(),
  unique(definition_id, fecha)
);

create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  plataforma text not null check (plataforma in ('google_ads', 'meta')),
  campaign_id text not null,
  nombre text not null,
  estado text,
  fecha date not null,
  spend numeric(10,2),
  impressions integer,
  clicks integer,
  conversions integer,
  cpl numeric(8,2),
  ctr numeric(5,2),
  cpc numeric(8,2),
  reach integer,
  video_views integer,
  cpv numeric(8,2),
  created_at timestamptz default now(),
  unique(cliente_id, plataforma, campaign_id, fecha)
);

create table page_metrics (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  fecha date not null,
  page_path text not null,
  sessions integer,
  users integer,
  conversions integer,
  conversion_rate numeric(5,2),
  created_at timestamptz default now(),
  unique(cliente_id, fecha, page_path)
);

create table traffic_sources (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  fecha date not null,
  source text not null,
  medium text not null,
  sessions integer,
  conversions integer,
  created_at timestamptz default now(),
  unique(cliente_id, fecha, source, medium)
);

create table gtm_containers (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  account_id text,
  container_id text not null,
  nombre text,
  version_actual text,
  fecha_ultimo_publish timestamptz,
  total_tags integer,
  active_tags integer,
  paused_tags integer,
  has_ga4 boolean default false,
  has_ads_conversion boolean default false,
  has_meta_pixel boolean default false,
  last_synced_at timestamptz,
  unique(cliente_id, container_id)
);

create table gtm_tags (
  id uuid primary key default uuid_generate_v4(),
  container_id uuid references gtm_containers(id) on delete cascade,
  tag_id text not null,
  nombre text,
  tipo text,
  estado text check (estado in ('active', 'paused')),
  trigger_count integer,
  ultima_modificacion timestamptz,
  unique(container_id, tag_id)
);

create table alerts (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  tipo text not null,
  severidad text not null check (severidad in ('low', 'medium', 'high', 'critical')),
  titulo text not null,
  descripcion text,
  fuente text,
  estado text default 'pending'
    check (estado in ('pending', 'reviewing', 'resolved')),
  resolved_at timestamptz,
  resolved_by uuid references users(id),
  created_at timestamptz default now()
);

create table alert_rules (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  fuente text not null,
  condicion_json jsonb not null,
  umbral numeric,
  severidad text not null,
  activa boolean default true,
  notificar_slack boolean default true,
  notificar_email boolean default false,
  created_at timestamptz default now()
);

create table ia_conversations (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  user_id uuid references users(id),
  messages jsonb not null default '[]',
  tipo text default 'manual' check (tipo in ('manual', 'briefing_automatico', 'alerta_analisis')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table gsc_keywords (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  fecha date not null,
  keyword text not null,
  clicks integer,
  impressions integer,
  ctr numeric(5,2),
  position numeric(5,2),
  unique(cliente_id, fecha, keyword)
);

create table sync_logs (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  fuente text not null,
  estado text check (estado in ('ok', 'error')),
  registros_actualizados integer,
  error_mensaje text,
  ejecutado_at timestamptz default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clientes_updated_at before update on clientes
  for each row execute function update_updated_at();

create trigger oauth_tokens_updated_at before update on oauth_tokens
  for each row execute function update_updated_at();
