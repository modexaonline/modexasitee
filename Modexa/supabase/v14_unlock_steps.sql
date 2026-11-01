-- v14: download unlock steps (site default + per-listing override) and the /download/<slug> page.
-- Safe to run more than once.
alter table public.site_settings add column if not exists unlock_enabled boolean not null default false;
alter table public.site_settings add column if not exists unlock_final_page boolean not null default true;
alter table public.site_settings add column if not exists unlock_steps jsonb not null default '[]'::jsonb;

-- 'default' = follow the site-wide steps, 'custom' = use this listing's own steps, 'off' = direct download
alter table public.mods add column if not exists unlock_mode text not null default 'default';
alter table public.mods drop constraint if exists mods_unlock_mode_check;
alter table public.mods add constraint mods_unlock_mode_check check (unlock_mode in ('default','custom','off'));
alter table public.mods add column if not exists unlock_steps jsonb not null default '[]'::jsonb;
