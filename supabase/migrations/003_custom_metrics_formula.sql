-- Extend custom_metric_definitions with formula support
alter table custom_metric_definitions
  add column if not exists tipo text not null default 'event_count'
    check (tipo in ('event_count', 'formula')),
  add column if not exists formula jsonb,
  add column if not exists unidad text not null default 'count'
    check (unidad in ('count', 'eur', 'pct', 'x')),
  add column if not exists invertir_colores boolean not null default false,
  alter column event_name drop not null;

comment on column custom_metric_definitions.tipo is 'event_count = raw GA4 event; formula = expression combining sources';
comment on column custom_metric_definitions.formula is
  'e.g. {"op":"/","left":{"src":"gads_spend"},"right":{"src":"ga4_event","event":"lead_web"}}';
comment on column custom_metric_definitions.unidad is 'count | eur | pct | x (multiplier)';
