-- Richer informe config: replaces simple informe_blocks array
-- Stores per-block metric selection, funnel config, etc.
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS informe_config jsonb NOT NULL DEFAULT '{}';
