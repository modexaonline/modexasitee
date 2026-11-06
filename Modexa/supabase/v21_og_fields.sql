-- v21: social-sharing fields (Open Graph + Twitter card) for posts and game/app listings, and a default share image.
-- Safe to run more than once. Run in Supabase → SQL Editor, then redeploy.
alter table public.posts add column if not exists og_title text not null default '';
alter table public.posts add column if not exists og_description text not null default '';
alter table public.posts add column if not exists og_image text not null default '';
alter table public.posts add column if not exists twitter_card text not null default 'summary_large_image';
alter table public.mods  add column if not exists og_title text not null default '';
alter table public.mods  add column if not exists og_description text not null default '';
alter table public.mods  add column if not exists og_image text not null default '';
alter table public.mods  add column if not exists twitter_card text not null default 'summary_large_image';
-- “Default social-share image” (Site & brand): fill it with the built-in Modexa image if it is still empty.
update public.site_settings set default_og_image = 'https://modexa.online/og-default.png' where id = 1 and coalesce(default_og_image, '') = '';
notify pgrst, 'reload schema';
