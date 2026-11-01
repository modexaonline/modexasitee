-- v16: scratch-to-reveal password. Safe to run more than once.
-- password_reveal: 'scratch' = scratch card under the password box, 'page' = box lower down the page, 'none' = not shown
alter table public.site_settings add column if not exists password_reveal text not null default 'scratch';
alter table public.site_settings drop constraint if exists site_settings_password_reveal_check;
alter table public.site_settings add constraint site_settings_password_reveal_check check (password_reveal in ('scratch','page','none'));
alter table public.site_settings add column if not exists password_scratch_wait int not null default 10;
alter table public.site_settings drop constraint if exists site_settings_password_scratch_wait_check;
alter table public.site_settings add constraint site_settings_password_scratch_wait_check check (password_scratch_wait between 0 and 60);
