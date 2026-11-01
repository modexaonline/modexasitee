-- Modexa v13 — FAQs (question + answer list) for app listings, game listings, blog posts and guides (already applied to project modexa)
alter table public.mods add column if not exists faqs jsonb not null default '[]'::jsonb;
alter table public.posts add column if not exists faqs jsonb not null default '[]'::jsonb;
