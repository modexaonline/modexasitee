-- v15: 4-digit download password gate. Safe to run more than once.
alter table public.site_settings add column if not exists password_enabled boolean not null default false;
alter table public.site_settings add column if not exists password_show boolean not null default true;
alter table public.site_settings add column if not exists password_hint text not null default '';

-- 'default' = follow the site setting, 'off' = this listing keeps the normal download button
alter table public.mods add column if not exists password_mode text not null default 'default';
alter table public.mods drop constraint if exists mods_password_mode_check;
alter table public.mods add constraint mods_password_mode_check check (password_mode in ('default','off'));
-- empty = automatic password (worked out from the listing slug)
alter table public.mods add column if not exists download_password text not null default '';
alter table public.mods drop constraint if exists mods_download_password_check;
alter table public.mods add constraint mods_download_password_check check (download_password = '' or download_password ~ '^[0-9]{4}$');
