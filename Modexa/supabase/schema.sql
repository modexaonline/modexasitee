-- =====================================================================
-- MODEXA schema v2  —  Supabase SQL Editor mein poora paste karke RUN karo.
-- Safe to re-run (idempotent). Existing data delete nahi hota.
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- Admin allow-list ----------
create table if not exists public.admin_users(
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create or replace function public.is_modexa_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;
revoke all on function public.is_modexa_admin() from public;
grant execute on function public.is_modexa_admin() to anon,authenticated;

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- Content tables ----------
create table if not exists public.posts(
  id uuid primary key default gen_random_uuid(),
  title text not null, slug text not null unique,
  excerpt text default '', content text default '',
  category text default 'Guides', cover_image text default '',
  status text not null default 'draft' check(status in ('draft','published')),
  seo_title text default '', seo_description text default '', canonical_url text default '',
  noindex boolean not null default false,
  published_at date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.pages(
  id uuid primary key default gen_random_uuid(),
  title text not null, slug text not null unique,
  excerpt text default '', content text default '',
  category text default 'Page', cover_image text default '',
  status text not null default 'draft' check(status in ('draft','published')),
  seo_title text default '', seo_description text default '', canonical_url text default '',
  noindex boolean not null default false,
  show_in_menu boolean not null default false, show_in_footer boolean not null default true,
  published_at date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.mods(
  id uuid primary key default gen_random_uuid(),
  title text not null, slug text not null unique,
  excerpt text default '', content text default '',
  category text default 'Gameplay', kind text default 'Game mod',
  game text default '', platform text default 'PC', creator text default '',
  description text default '',
  features jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  install jsonb not null default '[]'::jsonb,
  featured boolean not null default false, badge text default '',
  downloads bigint not null default 0 check(downloads >= 0),
  cover_image text default '', download_url text default '', version text default '',
  status text not null default 'draft' check(status in ('draft','published')),
  seo_title text default '', seo_description text default '', canonical_url text default '',
  noindex boolean not null default false,
  published_at date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Upgrade older projects safely
alter table public.pages add column if not exists show_in_menu boolean not null default false;
alter table public.pages add column if not exists show_in_footer boolean not null default true;
alter table public.mods  add column if not exists kind text default 'Game mod';
alter table public.mods  add column if not exists platform text default 'PC';
alter table public.mods  add column if not exists creator text default '';
alter table public.mods  add column if not exists description text default '';
alter table public.mods  add column if not exists features jsonb not null default '[]'::jsonb;
alter table public.mods  add column if not exists requirements jsonb not null default '[]'::jsonb;
alter table public.mods  add column if not exists install jsonb not null default '[]'::jsonb;
alter table public.mods  add column if not exists featured boolean not null default false;
alter table public.mods  add column if not exists badge text default '';
alter table public.mods  add column if not exists downloads bigint not null default 0;

-- ---------- NEW: mod submissions (public form -> admin inbox) ----------
create table if not exists public.submissions(
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(title) between 2 and 120),
  game text not null check(char_length(game) between 1 and 120),
  category text not null check(char_length(category) between 1 and 80),
  platform text not null default 'PC' check(char_length(platform) <= 40),
  creator text not null check(char_length(creator) between 1 and 80),
  source_url text not null check(source_url ~* '^https?://' and char_length(source_url) <= 500),
  description text not null check(char_length(description) between 10 and 1500),
  status text not null default 'new' check(status in ('new','reviewing','approved','rejected')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- NEW: contact / copyright messages ----------
create table if not exists public.contact_messages(
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'general' check(kind in ('general','listing','copyright','business')),
  name text not null check(char_length(name) between 1 and 80),
  email text not null check(email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 160),
  subject text not null default '' check(char_length(subject) <= 140),
  message text not null check(char_length(message) between 10 and 3000),
  listing_url text not null default '' check(char_length(listing_url) <= 500),
  status text not null default 'new' check(status in ('new','read','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- NEW: single-row site settings ----------
create table if not exists public.site_settings(
  id int primary key default 1 check(id = 1),
  site_name text not null default 'Modexa',
  tagline text not null default 'Discover mods. Redefine your game.',
  contact_email text not null default '',
  announcement text not null default '',
  announcement_link text not null default '',
  announcement_active boolean not null default false,
  twitter_url text not null default '',
  youtube_url text not null default '',
  discord_url text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.site_settings(id) values (1) on conflict (id) do nothing;

-- ---------- Triggers ----------
do $$ declare t text; begin
  foreach t in array array['posts','pages','mods','submissions','contact_messages','site_settings'] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- Download counter (lightweight, public) ----------
create or replace function public.increment_mod_downloads(p_slug text) returns void
language sql security definer set search_path=public as $$
  update public.mods set downloads = downloads + 1 where slug = p_slug and status = 'published';
$$;
revoke all on function public.increment_mod_downloads(text) from public;
grant execute on function public.increment_mod_downloads(text) to anon,authenticated;

-- ---------- Indexes ----------
create index if not exists posts_published_idx on public.posts(status,published_at desc);
create index if not exists pages_published_idx on public.pages(status,title);
create index if not exists mods_published_idx  on public.mods(status,published_at desc);
create index if not exists mods_game_idx       on public.mods(game);
create index if not exists mods_category_idx   on public.mods(category);
create index if not exists submissions_status_idx on public.submissions(status,created_at desc);
create index if not exists messages_status_idx    on public.contact_messages(status,created_at desc);

-- ---------- Row Level Security ----------
alter table public.admin_users enable row level security;
alter table public.posts enable row level security;
alter table public.pages enable row level security;
alter table public.mods enable row level security;
alter table public.submissions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;

grant select on public.admin_users to authenticated;
grant select on public.posts,public.pages,public.mods,public.site_settings to anon,authenticated;
grant insert,update,delete on public.posts,public.pages,public.mods to authenticated;
grant update on public.site_settings to authenticated;
grant insert on public.submissions,public.contact_messages to anon,authenticated;
grant select,update,delete on public.submissions,public.contact_messages to authenticated;

drop policy if exists "Admins can read admin allow-list" on public.admin_users;
create policy "Admins can read admin allow-list" on public.admin_users for select to authenticated using(public.is_modexa_admin());

drop policy if exists "Public read published posts" on public.posts;
create policy "Public read published posts" on public.posts for select to anon,authenticated using (status='published' or public.is_modexa_admin());
drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts" on public.posts for all to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

drop policy if exists "Public read published pages" on public.pages;
create policy "Public read published pages" on public.pages for select to anon,authenticated using (status='published' or public.is_modexa_admin());
drop policy if exists "Admins manage pages" on public.pages;
create policy "Admins manage pages" on public.pages for all to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

drop policy if exists "Public read published mods" on public.mods;
create policy "Public read published mods" on public.mods for select to anon,authenticated using (status='published' or public.is_modexa_admin());
drop policy if exists "Admins manage mods" on public.mods;
create policy "Admins manage mods" on public.mods for all to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

drop policy if exists "Anyone can submit a mod" on public.submissions;
create policy "Anyone can submit a mod" on public.submissions for insert to anon,authenticated with check (status='new' and admin_note='');
drop policy if exists "Admins manage submissions" on public.submissions;
create policy "Admins manage submissions" on public.submissions for all to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

drop policy if exists "Anyone can send a message" on public.contact_messages;
create policy "Anyone can send a message" on public.contact_messages for insert to anon,authenticated with check (status='new');
drop policy if exists "Admins manage messages" on public.contact_messages;
create policy "Admins manage messages" on public.contact_messages for all to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings" on public.site_settings for select to anon,authenticated using (true);
drop policy if exists "Admins update site settings" on public.site_settings;
create policy "Admins update site settings" on public.site_settings for update to authenticated using(public.is_modexa_admin()) with check(public.is_modexa_admin());

-- ---------- Storage bucket (public read, admin-only write, images <= 5 MB) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('modexa-media','modexa-media',true,5242880,array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Public can view Modexa media" on storage.objects;
create policy "Public can view Modexa media" on storage.objects for select to anon,authenticated using(bucket_id='modexa-media');
drop policy if exists "Admins upload Modexa media" on storage.objects;
create policy "Admins upload Modexa media" on storage.objects for insert to authenticated with check(bucket_id='modexa-media' and public.is_modexa_admin());
drop policy if exists "Admins update Modexa media" on storage.objects;
create policy "Admins update Modexa media" on storage.objects for update to authenticated using(bucket_id='modexa-media' and public.is_modexa_admin()) with check(bucket_id='modexa-media' and public.is_modexa_admin());
drop policy if exists "Admins delete Modexa media" on storage.objects;
create policy "Admins delete Modexa media" on storage.objects for delete to authenticated using(bucket_id='modexa-media' and public.is_modexa_admin());

-- =====================================================================
-- LAST STEP (schema run hone ke baad):
-- 1) Authentication > Users mein apna admin user banao
-- 2) Uski UUID copy karke ye chalao:
--    insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
-- =====================================================================
