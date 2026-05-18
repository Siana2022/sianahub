-- Cache for nightly pre-calculated metrics (GA4, GSC, GAds)
create table if not exists metricas_cache (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references clientes(id) on delete cascade,
  fuente        text not null,  -- 'ga4' | 'gsc' | 'gads'
  tipo          text not null,  -- 'trafico' | 'procedencia' | 'organico' | 'campanas'
  datos         jsonb not null,
  fecha_calculo timestamptz not null default now(),
  unique (cliente_id, fuente, tipo)
);

create index if not exists metricas_cache_cliente_idx
  on metricas_cache (cliente_id, fuente, tipo);

-- RLS: same service role access as other tables
alter table metricas_cache enable row level security;
create policy "service role full access" on metricas_cache
  using (true) with check (true);
