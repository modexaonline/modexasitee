-- v22: international SEO. One row per (kind, item, language). kind: post | mod | content (site pages like home, nav, listing:apps) | ui (interface words).
create table if not exists public.translations(
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('post','mod','content','ui')),
  item_key text not null,
  lang text not null,
  data jsonb not null default '{}'::jsonb,
  edited boolean not null default false,
  src_hash text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(kind, item_key, lang)
);
create index if not exists translations_lang_idx on public.translations(lang, kind);
alter table public.translations enable row level security;
drop policy if exists "Public read translations" on public.translations;
create policy "Public read translations" on public.translations for select to anon, authenticated using (
  public.is_modexa_admin()
  or kind in ('content','ui')
  or (kind='post' and exists(select 1 from public.posts p where p.id::text = item_key and p.status='published'))
  or (kind='mod' and exists(select 1 from public.mods m where m.id::text = item_key and m.status='published'))
);
drop policy if exists "Admins manage translations" on public.translations;
create policy "Admins manage translations" on public.translations for all to authenticated using (public.is_modexa_admin()) with check (public.is_modexa_admin());
alter table public.site_settings add column if not exists i18n_enabled boolean not null default false;
alter table public.site_settings add column if not exists i18n_langs jsonb not null default '["id","pt","es","ar","tr","hi","vi","bn","ur","th"]'::jsonb;
alter table public.site_settings add column if not exists i18n_auto boolean not null default true;
notify pgrst, 'reload schema';
