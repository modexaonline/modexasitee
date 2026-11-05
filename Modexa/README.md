# Modexa v4 — White · Black · Green (React + Supabase)

Public website + secure admin studio. Frontend: React/Vite. Backend: Supabase (Auth, Postgres, Storage).

## Run locally
```bash
npm install
npm run dev          # http://localhost:5173  (admin: /admin)
```
`.env` already contains the Supabase URL + publishable key of project `modexa`. **Set `SITE_URL` to your real domain** (already set to `https://modexa.online`).

## Deploy (Vercel / Netlify / Cloudflare Pages)
- Build command: `npm run build`   Output: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, **`SITE_URL`**
- `npm run build` = `vite build` + `scripts/prerender.mjs`. The prerender step writes a real HTML file for every important page (title, meta, canonical, JSON-LD, readable text) and generates `sitemap.xml`, `robots.txt` and `llms.txt`. It also pulls your published mods, guides and custom pages from Supabase. **Re-deploy after publishing new content** (or add a Supabase webhook → deploy hook) so new pages get their own static HTML + sitemap entry.

## New in v6
- **Site structure:** Apps · Games · Guide · Blog (Categories / Trending / Latest pages removed; old URLs 301-redirect to /apps). App and Game listings are the same type of page with the same features; Posts are either *Blog* or *Guide*.
- **Blogger-style editor** (Posts, App listings, Game listings, page sections): **Compose** and **HTML** views, find & replace, undo/redo, headings, align, lists, quote, links, **images from link or upload from device**, **buttons** (13 templates, or your own button image, or a plain blue text link), custom code blocks, ad blocks. Ads and scripts show as labelled blocks in Compose — never as `[ad:…]` text. Raw `<script>` pasted into HTML becomes a *CODE* block automatically.
- **Auto-clean:** pasted text (plain, Word, Docs, ChatGPT…) is turned into headings, sub-headings and paragraphs without changing a single word. Also the **Auto-format** button.
- **Download buttons:** every button (and the listing’s Download button) opens a countdown screen (default 30 s, per button or in Site & brand) with a “Download wait screen” ad slot, then redirects automatically.
- **Smart search:** header, home, Apps/Games and the search page suggest matches across apps, games, guides and blog posts as you type; one matching word is enough, typos are tolerated, and results narrow to the exact page as the spelling completes.
- **Ads engine:** *Auto* render mode (real same-site frame first, then automatically runs on the page if the network shows nothing), `document.write` ad tags supported everywhere, `?adsdebug=1` diagnostics. **Site & brand → Ads:** load ads *after cookie accept* or *always*.
- **Website editor:** all pages are listed with Edit / Reset, **Delete** for custom pages, and a **WordPress-style page builder** (Hero, Text, Image, Buttons, Columns, Cards, FAQ, Latest apps/games/posts, CTA, Custom code, Ad slot, Divider, Spacer — add, reorder, duplicate, delete).
- **Site & brand:** announcement position (top / below header / bottom), unlimited social links with built-in or **uploaded icons**, download countdown default.
- Removed all notice boxes (demo/verification/source/safety notes), footer disclaimer, trust strip and hero claims.

SQL for v6: `supabase/v6_listings_guides_builder.sql` (already applied to project `modexa`).

## v5 — Ads, Website editor (earlier)
All of this lives in **Admin** (sidebar):
- **Ads manager** — add banners (every standard size: 300×250, 728×90, 320×50, 970×250, 300×600, 160×600, responsive, custom…), native/script ads, pop-under and social-bar scripts, custom HTML (AdSense etc.) and **direct links** (button / card / text). Pick the placement once and it runs on every matching blog automatically: top of article, inside content (after paragraph N, optionally repeated), end of article, mod pages, home, sticky footer bar, or site-wide scripts. Target all blogs, selected posts or selected games; exclude posts; desktop-only or mobile-only. Use `[ad:shortcode]` inside a post for an exact spot. Banners render in a sandboxed iframe (cannot read your site data); switch a unit to *Inline* for AdSense-style code.
- **Blog editor toolbar** — headings, bold, links, images, **Direct link button** (`[btn:Label](https://…)`, rel=sponsored) and an **Insert ad** dropdown. Each post has a *Game* selector and a *Show ads on this post* switch.
- **Consent** — with “Load ads only after the visitor accepts cookies” ON (default), nothing loads until *Accept all*; Privacy and Cookie policies automatically gain an Advertising section while ads are enabled.
- **Games** — controls the home page “Browse by game” container. Clicking a game opens its chosen blog (or its newest linked guide); if it has none it opens the game hub page.
- **Website editor** — edit text, SEO title/description, quick-answer box, sections, FAQs of **every page** (About, Contact, Privacy, Terms, Cookies, Copyright, Guidelines, FAQ, Mods, Games, Categories, Trending, Latest, Blog, Submit…), the **Home page** (hero, section headings, steps, cards, CTA) and the **header/footer menus**. “Reset to default” restores the built-in text.
- **Site & brand** — name, logo, default share image, footer text, social links, announcement bar, ads master switches.

**Ad not showing? (blank banner / no pop-under)** Open any page with `?adsdebug=1` (e.g. `https://modexa.online/?adsdebug=1`). A panel shows whether the master switch is ON, whether the visitor accepted cookies, whether an ad blocker is active, which ads were loaded, and — per slot — whether the network actually returned content. Render modes: **Frame** (default; real same-site frame, works with Adsterra/Monetag/Propeller/ExoClick-style `document.write` code), **Inline** (AdSense/loader scripts), **Strict** (sandboxed; many networks stay blank). Real ads can still be blank until the network approves your domain, when there is no ad to serve, or with an ad blocker; pop-unders fire only after a click and are limited to once per visitor per day.

Database: `supabase/v5_ads_games_cms.sql` (already applied to project `modexa`).

## Supabase
Schema (`supabase/schema.sql`) is already applied to project `modexa`. Admin login: username `admin` (maps to `admin@modexa.local`). Change the password in Supabase → Authentication → Users and keep public sign-ups OFF.

## SEO · AEO · GEO — what is built in
| Layer | What it does |
|---|---|
| **SEO** | Unique title + meta description per page, canonical URLs, OpenGraph/Twitter cards, single H1 per page, semantic headings, breadcrumbs (visual + `BreadcrumbList`), sitemap, robots, noindex on search/saved/404, fast self-hosted fonts, code-split routes. |
| **AEO** (answer engines, featured snippets, voice) | Every page opens with an answer-first “Quick answer” box, question-style headings and FAQ accordions with `FAQPage` schema; mods get `SoftwareApplication` + `HowTo` schema; guides get `Article`. |
| **GEO** (ChatGPT, Claude, Perplexity, Gemini…) | Prerendered HTML so AI crawlers that do not run JavaScript still read full content; `llms.txt` site summary; `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended; clear entity info (Organization/WebSite schema, About page, last-updated dates, creator attribution). |

Content lives in `src/content/` (`legal.js` = About, Contact, Privacy, Terms, Cookies, Copyright/DMCA, Guidelines, FAQ; `seo.js` = listing pages + home). Edit text there. Prefer not to touch code? Use **Admin → Website editor** (it overrides the built-in text; “Custom pages” is for brand-new pages).

## Legal pages — please review
The policy pages describe how this site actually works today (no accounts, no tracking cookies, Supabase + hosting providers as processors, forms for contact/submissions). They are solid starting templates, **not legal advice**. Before launch: confirm governing law/jurisdiction wording, add your business/contact details, and update the Privacy and Cookie policies if you add analytics, ads or newsletters (and then add a consent choice).

## Theme
White background, black text/UI, green accent. Tokens are at the top of `src/theme.css` (`--green-700`, `--black`, …).

---

## Vercel deploy: Supabase connection

Vercel does not upload your local `.env` file. This project now ships `src/lib/publicConfig.js` with the
Supabase URL and **publishable** key, so the admin login works even if you set nothing in Vercel.
(The publishable key is meant to be public. Security comes from Row Level Security. Never paste a
`secret` or `service_role` key into any file in this project.)

To override from Vercel instead: Project > Settings > Environment Variables, add
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `SITE_URL` (your real domain), then redeploy.
Variables set there take priority over `publicConfig.js`.

## Header code, robots.txt and sitemap (v12)
Run `supabase/v12_seo_files_head.sql` once. Admin → "Header, Robots & Sitemap" edits the Google tag / any `<head>` code,
robots.txt and sitemap.xml. Header code is baked into the public HTML at build time; to rebuild automatically after Save,
create a Vercel Deploy Hook (Project → Settings → Git → Deploy Hooks) and add its URL as env var `VERCEL_DEPLOY_HOOK_URL`.

## v16 additions
- **Dark / light mode**: moon/sun button in the header. The choice is saved in the visitor's browser (default: light). Styles: `src/dark.generated.css` (auto-mapped from the light CSS) + `src/dark.css` (manual tweaks). The admin panel is always light.
- **Add to sitemap**: Admin → Posts / App listings / Game listings now have an "Add to sitemap" button on every row. One click adds that page's URL to the live sitemap.xml (click again to remove). The first click copies the auto-generated sitemap into the custom sitemap, then adds the URL. Drafts and noindex pages cannot be added. Needs `supabase/v12_seo_files_head.sql` to have been run once.
- **Submit page**: black input boxes and the black "submission received" box fixed.
