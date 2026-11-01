-- =====================================================================
-- MODEXA v5 — Ads manager, Games (home → blog), Website editor (CMS)
-- Safe to re-run. Run AFTER schema.sql.
-- =====================================================================

-- ---------- Games (home "Browse by game" container; click opens the game's blog) ----------
create table if not exists public.games(
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(name) between 1 and 120),
  slug text not null unique check(slug ~ '^[a-z0-9-]{1,80}$'),
  description text not null default '',
  image text not null default '',
  platform text not null default 'PC',
  blog_slug text not null default '',
  sort_order int not null default 0,
  show_on_home boolean not null default true,
  status text not null default 'published' check(status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Posts: link a blog post to a game + per-post ads switch
alter table public.posts add column if not exists game_slug text not null default '';
alter table public.posts add column if not exists ads_enabled boolean not null default true;
create index if not exists posts_game_idx on public.posts(game_slug);

-- ---------- Website editor content (page text, home sections, navigation) ----------
create table if not exists public.site_content(
  key text primary key check(key ~ '^[a-z0-9:_-]{1,60}$'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Ad units ----------
create table if not exists public.ad_units(
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(name) between 1 and 120),
  slot_key text not null unique check(slot_key ~ '^[a-z0-9-]{1,60}$'),
  kind text not null default 'banner' check(kind in ('banner','native','popunder','social_bar','direct_link','script')),
  size text not null default '300x250' check(char_length(size) <= 20),
  custom_width int not null default 300 check(custom_width between 1 and 2000),
  custom_height int not null default 250 check(custom_height between 1 and 2000),
  render_mode text not null default 'isolated' check(render_mode in ('isolated','inline','strict')),
  code text not null default '' check(char_length(code) <= 20000),
  link_url text not null default '' check(link_url = '' or link_url ~* '^https?://'),
  link_label text not null default 'Learn more' check(char_length(link_label) <= 80),
  link_text text not null default '' check(char_length(link_text) <= 300),
  link_style text not null default 'button' check(link_style in ('button','card','text')),
  placement text not null default 'blog_in_content' check(placement in ('blog_top','blog_in_content','blog_bottom','mod_sidebar','mod_bottom','home_middle','sticky_bottom','global_head','global_body')),
  position_after int not null default 3 check(position_after between 1 and 100),
  repeat_every int not null default 0 check(repeat_every between 0 and 100),
  devices text not null default 'all' check(devices in ('all','desktop','mobile')),
  scope text not null default 'all' check(scope in ('all','selected_posts','selected_games')),
  target_slugs text[] not null default '{}',
  exclude_slugs text[] not null default '{}',
  label text not null default 'Advertisement' check(char_length(label) <= 40),
  priority int not null default 0,
  status text not null default 'active' check(status in ('active','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ad_units_placement_idx on public.ad_units(placement,status);

-- ---------- Extra site settings ----------
alter table public.site_settings add column if not exists ads_enabled boolean not null default false;
alter table public.site_settings add column if not exists ads_require_consent boolean not null default true;
alter table public.site_settings add column if not exists logo_url text not null default '';
alter table public.site_settings add column if not exists default_og_image text not null default '';
alter table public.site_settings add column if not exists footer_text text not null default '';

-- ---------- updated_at triggers ----------
do $$ declare t text; begin
  foreach t in array array['games','site_content','ad_units'] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- RLS ----------
alter table public.games enable row level security;
alter table public.site_content enable row level security;
alter table public.ad_units enable row level security;

grant select on public.games, public.site_content, public.ad_units to anon, authenticated;
grant insert, update, delete on public.games, public.site_content, public.ad_units to authenticated;

drop policy if exists "Public read published games" on public.games;
create policy "Public read published games" on public.games for select to anon,authenticated using (status='published' or public.is_modexa_admin());
drop policy if exists "Admins manage games" on public.games;
create policy "Admins manage games" on public.games for all to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

drop policy if exists "Public read site content" on public.site_content;
create policy "Public read site content" on public.site_content for select to anon,authenticated using (true);
drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins manage site content" on public.site_content for all to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

drop policy if exists "Public read active ads" on public.ad_units;
create policy "Public read active ads" on public.ad_units for select to anon,authenticated using (status='active' or public.is_modexa_admin());
drop policy if exists "Admins manage ads" on public.ad_units;
create policy "Admins manage ads" on public.ad_units for all to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

-- ---------- Starter games (edit or delete from Admin > Games) ----------
insert into public.games(name,slug,image,platform,sort_order) values
 ('Minecraft','minecraft','https://images.unsplash.com/photo-1607513746994-51f730a44832?auto=format&fit=crop&w=900&q=85','PC',1),
 ('Cyberpunk 2077','cyberpunk-2077','https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85','PC',2),
 ('The Sims 4','the-sims-4','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85','PC',3),
 ('Skyrim','skyrim','https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85','PC',4)
on conflict (slug) do nothing;
