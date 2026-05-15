-- Widget selection for the Resumen tab, stored per client
alter table clientes
  add column if not exists resumen_widgets jsonb not null
  default '["ga4_sessions","ga4_conversions","gsc_clicks","gsc_position"]'::jsonb;
