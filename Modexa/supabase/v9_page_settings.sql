-- Modexa v9: per-page settings (show title, layout). Already applied.
alter table public.pages add column if not exists settings jsonb not null default '{}'::jsonb;
