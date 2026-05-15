-- Allow null cliente_id for global agency tokens
alter table oauth_tokens alter column cliente_id drop not null;

-- Add token_type to distinguish global vs per-client
alter table oauth_tokens add column if not exists token_type text not null default 'client'
  check (token_type in ('global', 'client'));

-- Global tokens don't need a unique per-client constraint
drop index if exists oauth_tokens_cliente_id_plataforma_key;
alter table oauth_tokens drop constraint if exists oauth_tokens_cliente_id_plataforma_key;

-- New: unique global token per platform, and unique client token per platform+client
create unique index if not exists oauth_tokens_global_platform
  on oauth_tokens (plataforma) where token_type = 'global';

create unique index if not exists oauth_tokens_client_platform
  on oauth_tokens (cliente_id, plataforma) where token_type = 'client' and cliente_id is not null;
