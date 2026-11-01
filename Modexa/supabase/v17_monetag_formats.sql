-- v17: several Monetag ad formats (paste each code) + optional push service worker file. Safe to run more than once.
alter table public.site_settings add column if not exists monetag_formats jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists monetag_sw text not null default '';
notify pgrst, 'reload schema';
