alter table clientes
  add column if not exists informe_blocks jsonb default '["resumen","meta","gads","organico"]';
