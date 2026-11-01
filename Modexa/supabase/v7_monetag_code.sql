-- Modexa v7 — Monetag "insert code" box in admin (already applied to project modexa)
alter table public.site_settings add column if not exists monetag_code text not null default '';
alter table public.site_settings add column if not exists monetag_enabled boolean not null default true;
alter table public.site_settings drop constraint if exists site_settings_monetag_code_len;
alter table public.site_settings add constraint site_settings_monetag_code_len check (char_length(monetag_code) <= 20000);
