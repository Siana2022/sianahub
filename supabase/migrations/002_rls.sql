-- RLS: cualquier usuario autenticado (equipo Siana Digital) tiene acceso completo.
-- Granularidad admin vs account_manager se añade en una migración posterior.

alter table users enable row level security;
alter table clientes enable row level security;
alter table oauth_tokens enable row level security;
alter table metrics_daily enable row level security;
alter table custom_metric_definitions enable row level security;
alter table custom_metrics_daily enable row level security;
alter table campaigns enable row level security;
alter table page_metrics enable row level security;
alter table traffic_sources enable row level security;
alter table gtm_containers enable row level security;
alter table gtm_tags enable row level security;
alter table alerts enable row level security;
alter table alert_rules enable row level security;
alter table ia_conversations enable row level security;
alter table gsc_keywords enable row level security;
alter table sync_logs enable row level security;

create policy "auth_users" on users
  for all using (auth.role() = 'authenticated');

create policy "auth_clientes" on clientes
  for all using (auth.role() = 'authenticated');

create policy "auth_oauth_tokens" on oauth_tokens
  for all using (auth.role() = 'authenticated');

create policy "auth_metrics_daily" on metrics_daily
  for all using (auth.role() = 'authenticated');

create policy "auth_custom_metric_definitions" on custom_metric_definitions
  for all using (auth.role() = 'authenticated');

create policy "auth_custom_metrics_daily" on custom_metrics_daily
  for all using (auth.role() = 'authenticated');

create policy "auth_campaigns" on campaigns
  for all using (auth.role() = 'authenticated');

create policy "auth_page_metrics" on page_metrics
  for all using (auth.role() = 'authenticated');

create policy "auth_traffic_sources" on traffic_sources
  for all using (auth.role() = 'authenticated');

create policy "auth_gtm_containers" on gtm_containers
  for all using (auth.role() = 'authenticated');

create policy "auth_gtm_tags" on gtm_tags
  for all using (auth.role() = 'authenticated');

create policy "auth_alerts" on alerts
  for all using (auth.role() = 'authenticated');

create policy "auth_alert_rules" on alert_rules
  for all using (auth.role() = 'authenticated');

create policy "auth_ia_conversations" on ia_conversations
  for all using (auth.role() = 'authenticated');

create policy "auth_gsc_keywords" on gsc_keywords
  for all using (auth.role() = 'authenticated');

create policy "auth_sync_logs" on sync_logs
  for all using (auth.role() = 'authenticated');
