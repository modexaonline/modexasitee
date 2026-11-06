-- v21: Open Graph / Twitter card fields for posts and listings, and a default social-share image. Safe to run more than once.
alter table public.posts add column if not exists og_title text not null default '';
alter table public.posts add column if not exists og_description text not null default '';
alter table public.posts add column if not exists og_image text not null default '';
alter table public.posts add column if not exists twitter_card text not null default 'summary_large_image';
alter table public.mods add column if not exists og_title text not null default '';
alter table public.mods add column if not exists og_description text not null default '';
alter table public.mods add column if not exists og_image text not null default '';
alter table public.mods add column if not exists twitter_card text not null default 'summary_large_image';
alter table public.site_settings add column if not exists default_og_image text not null default '';
update public.site_settings set default_og_image = 'https://modexa.online/og-default.png' where id = 1 and coalesce(trim(default_og_image), '') = '';
notify pgrst, 'reload schema';
