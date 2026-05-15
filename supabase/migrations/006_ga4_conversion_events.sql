-- Custom GA4 conversion event names per client (comma-separated)
alter table clientes
  add column if not exists ga4_conversion_events text;
