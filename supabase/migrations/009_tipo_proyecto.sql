-- Project type and Meta events configuration per client
alter table clientes
  add column if not exists tipo_proyecto      text    default 'leads',
  add column if not exists meta_events_config jsonb   default '{}';

comment on column clientes.tipo_proyecto      is 'leads | ecommerce';
comment on column clientes.meta_events_config is 'Meta Ads events config: { conversion_event, funnel_steps[] }';
