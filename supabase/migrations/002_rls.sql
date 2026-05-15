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

-- Users: can read their own profile
create policy "users_own" on users
  for all using (id = auth.uid());

-- Admins see all users
create policy "admin_users_all" on users
  for all using (
    exists (select 1 from users where id = auth.uid() and rol = 'admin')
  );

-- Clientes: admins see everything
create policy "admin_clientes_all" on clientes
  for all using (
    exists (select 1 from users where id = auth.uid() and rol = 'admin')
  );

-- Clientes: account managers see their own
create policy "am_clientes_own" on clientes
  for select using (account_manager_id = auth.uid());

-- All authenticated users can read/write metrics for their clients
create policy "metrics_daily_auth" on metrics_daily
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "custom_metric_definitions_auth" on custom_metric_definitions
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "custom_metrics_daily_auth" on custom_metrics_daily
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "campaigns_auth" on campaigns
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "page_metrics_auth" on page_metrics
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "traffic_sources_auth" on traffic_sources
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "gtm_containers_auth" on gtm_containers
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "gtm_tags_auth" on gtm_tags
  for all using (
    exists (
      select 1 from gtm_containers gc
        join clientes c on c.id = gc.cliente_id
      where gc.id = container_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "alerts_auth" on alerts
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "alert_rules_auth" on alert_rules
  for all using (
    exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
  );

create policy "alert_rules_read" on alert_rules
  for select using (auth.uid() is not null);

create policy "ia_conversations_auth" on ia_conversations
  for all using (
    user_id = auth.uid()
    or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
  );

create policy "gsc_keywords_auth" on gsc_keywords
  for all using (
    exists (
      select 1 from clientes c
      where c.id = cliente_id
        and (
          c.account_manager_id = auth.uid()
          or exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
        )
    )
  );

create policy "sync_logs_auth" on sync_logs
  for all using (
    exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
  );

create policy "oauth_tokens_auth" on oauth_tokens
  for all using (
    exists (select 1 from users u where u.id = auth.uid() and u.rol = 'admin')
  );
