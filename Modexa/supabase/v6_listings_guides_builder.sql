-- Modexa v6 — Apps/Games listings, Guide/Blog posts, page builder blocks, social links, download wait (already applied to project modexa)
alter table public.mods add column if not exists listing_type text not null default 'app';
alter table public.mods drop constraint if exists mods_listing_type_check;
alter table public.mods add constraint mods_listing_type_check check (listing_type in ('app','game'));
create index if not exists mods_type_idx on public.mods(listing_type,status);
alter table public.posts add column if not exists post_type text not null default 'blog';
alter table public.posts drop constraint if exists posts_post_type_check;
alter table public.posts add constraint posts_post_type_check check (post_type in ('blog','guide'));
alter table public.pages add column if not exists blocks jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists social_links jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists announcement_position text not null default 'top';
alter table public.site_settings drop constraint if exists site_settings_announcement_position_check;
alter table public.site_settings add constraint site_settings_announcement_position_check check (announcement_position in ('top','bottom','below_header'));
alter table public.site_settings add column if not exists download_wait_seconds int not null default 30;
alter table public.site_settings drop constraint if exists site_settings_download_wait_check;
alter table public.site_settings add constraint site_settings_download_wait_check check (download_wait_seconds between 0 and 300);
alter table public.ad_units drop constraint if exists ad_units_placement_check;
alter table public.ad_units add constraint ad_units_placement_check check (placement in ('blog_top','blog_in_content','blog_bottom','mod_sidebar','mod_bottom','home_middle','sticky_bottom','global_head','global_body','download_gate'));
alter table public.ad_units drop constraint if exists ad_units_render_mode_check;
alter table public.ad_units add constraint ad_units_render_mode_check check (render_mode in ('isolated','inline','strict'));
insert into public.mods(title, slug, excerpt, cover_image, platform, game, listing_type, status)
select g.name, g.slug, g.description, g.image, g.platform, g.name, 'game', 'draft' from public.games g where not exists (select 1 from public.mods m where m.slug = g.slug);
