// Runs after `vite build`. For every important route it writes a real HTML file containing the page's
// title, meta tags, canonical URL, JSON-LD (schema.org) and readable text, so Google, Bing and AI crawlers
// (ChatGPT, Claude, Perplexity, Gemini) that do not run JavaScript still see complete, accurate content.
// It also generates sitemap.xml, robots.txt and llms.txt. The React app takes over in the browser as usual.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { PAGES, POLICY_SLUGS, ADS_SECTIONS } from '../src/content/legal.js'
import { mergeContent, HOME_DEFAULT, NAV_DEFAULT } from '../src/content/merge.js'
import { LISTING } from '../src/content/seo.js'
import { isHtml } from '../src/lib/formatText.js'
import { isPathHidden, hrefOfMod, hrefOfPost, homeHidden } from '../src/lib/hidden.js'
import { SITE, NAV, LEGAL_LINKS } from '../src/content/site.js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, PUBLIC_SITE_URL } from '../src/lib/publicConfig.js'

const env = { ...process.env }
if (existsSync('.env')) for (const l of readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
let SITE_URL = (env.SITE_URL || env.VITE_SITE_URL || PUBLIC_SITE_URL || '').replace(/\/$/, '')
if (!SITE_URL || SITE_URL.includes('yourdomain')) { console.warn('⚠ SITE_URL is not set, using https://modexa.online. Set SITE_URL in your hosting environment if your domain is different.'); SITE_URL = 'https://modexa.online' }
const SB = (env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL || '').replace(/\/$/, ''), KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_KEY || ''
const live = SB && KEY && !SB.includes('YOUR_PROJECT_ID')
const DIST = 'dist'
let template = readFileSync(join(DIST, 'index.html'), 'utf8')

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const slugify = v => String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const plain = s => String(s ?? '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
const inline = s => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u.startsWith('/') ? SITE_URL + u : u}"${t.startsWith('btn:') ? ' rel="sponsored nofollow"' : ''}>${t.replace(/^btn:/, '')}</a>`)
const clip = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s }

async function rest(table, select = '*', filter = '') {
  const r = await fetch(`${SB}/rest/v1/${table}?select=${select}${filter}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  if (!r.ok) throw new Error(`${table} ${r.status}`)
  return r.json()
}
let mods = [], posts = [], cpages = [], settings = {}, games = [], content = {}
if (live) {
  try { mods = await rest('mods', '*', '&status=eq.published&order=published_at.desc') } catch (e) { console.warn('mods:', e.message) }
  try { posts = await rest('posts', '*', '&status=eq.published&order=published_at.desc') } catch (e) { console.warn('posts:', e.message) }
  try { cpages = await rest('pages', '*', '&status=eq.published') } catch (e) { console.warn('pages:', e.message) }
  try { settings = (await rest('site_settings', '*', '&id=eq.1'))[0] || {} } catch {}
  try { for (const r of await rest('site_content', 'key,data')) content[r.key] = r.data } catch (e) { console.warn('site_content:', e.message) }
} else console.log('Supabase not configured: prerendering static pages only.')
// Pages hidden in Admin → Website editor are not built at all (no static file, no sitemap entry, no llms.txt line).
const HIDDEN = Array.isArray(content.visibility?.hidden) ? content.visibility.hidden : []
mods = mods.filter(m => !isPathHidden(HIDDEN, hrefOfMod(m))); posts = posts.filter(p => !isPathHidden(HIDDEN, hrefOfPost(p)))
if (HIDDEN.length) console.log('prerender: hidden pages skipped →', HIDDEN.join(', '))
// Custom <head> code saved in Admin → Robots, Sitemap & Header code replaces the built-in block of index.html.
if ((settings.head_code || '').trim()) template = template.replace(/<!--MODEXA_HEAD_START-->[\s\S]*?<!--MODEXA_HEAD_END-->/, () => `<!--MODEXA_HEAD_START-->\n${settings.head_code.trim()}\n<!--MODEXA_HEAD_END-->`)

// ---------- html building blocks ----------
const sectionsHtml = (sections = []) => sections.map(s => `<section id="${esc(s.id)}"><h2>${esc(s.h)}</h2>${(s.p || []).map(t => `<p>${inline(t)}</p>`).join('')}${s.ul ? `<ul>${s.ul.map(t => `<li>${inline(t)}</li>`).join('')}</ul>` : ''}${s.ol ? `<ol>${s.ol.map(t => `<li>${inline(t)}</li>`).join('')}</ol>` : ''}${s.table ? `<table><thead><tr>${s.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}${s.note ? `<p>${inline(s.note)}</p>` : ''}</section>`).join('')
const faqHtml = (faqs = []) => faqs.length ? `<section id="faq"><h2>Frequently asked questions</h2>${faqs.map(f => `<h3>${esc(f.q)}</h3><p>${inline(f.a)}</p>`).join('')}</section>` : ''
const answerHtml = a => a ? `<aside><strong>${esc(a.q)}</strong><p>${inline(a.a)}</p></aside>` : ''
const NAVL = mergeContent(NAV_DEFAULT, content.nav).header.filter(n => !isPathHidden(HIDDEN, n.to))
const navHtml = () => `<nav aria-label="Main">${[{ to: '/', label: 'Home' }, ...NAVL].map(n => `<a href="${SITE_URL}${n.to}">${esc(n.label)}</a>`).join(' · ')}</nav>`
const footHtml = () => `<footer><nav aria-label="Legal">${LEGAL_LINKS.filter(l => !isPathHidden(HIDDEN, l.to)).map(n => `<a href="${SITE_URL}${n.to}">${esc(n.label)}</a>`).join(' · ')}</nav><p>© ${new Date().getFullYear()} Modexa. Independent; not affiliated with game publishers.</p></footer>`
const crumbsLd = (url, items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.label, item: SITE_URL + (b.to || url) })) })
const cleanF = l => (Array.isArray(l) ? l : []).filter(f => f && f.q && f.a)
const faqLd = faqs => ({ '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })) })
const pageLd = (path, title, desc, type = 'WebPage', extra = {}) => ({ '@type': type, '@id': SITE_URL + path + '#webpage', url: SITE_URL + path, name: title, description: desc, inLanguage: 'en', isPartOf: { '@id': SITE_URL + '/#website' }, ...extra })
function md(src = '') {
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n'); let out = '', list = null, para = []
  const fp = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>`; para = [] } }, fl = () => { if (list) { out += `</${list}>`; list = null } }
  for (const raw of lines) { const l = raw.trim(); let m
    if (!l) { fp(); fl(); continue }
    if (/^\[ad:[a-z0-9-]+\]$/i.test(l)) { fp(); fl(); continue }
    if ((m = l.match(/^###\s+(.*)$/))) { fp(); fl(); out += `<h3>${inline(m[1])}</h3>` }
    else if ((m = l.match(/^##\s+(.*)$/))) { fp(); fl(); out += `<h2>${inline(m[1])}</h2>` }
    else if ((m = l.match(/^[-*•]\s+(.*)$/))) { fp(); if (list !== 'ul') { fl(); out += '<ul>'; list = 'ul' } out += `<li>${inline(m[1])}</li>` }
    else if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { fp(); if (list !== 'ol') { fl(); out += '<ol>'; list = 'ol' } out += `<li>${inline(m[1])}</li>` }
    else { fl(); para.push(l) } }
  fp(); fl(); return out
}

// Post / listing bodies are HTML (new editor) or markdown (older posts). Ads, embeds and scripts are removed from the static copy.
const staticBody = c => {
  if (!isHtml(c)) return md(c || '')
  return String(c).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<div class="mx-(?:ad|embed)"[^>]*><\/div>/gi, '').replace(/\son\w+="[^"]*"/gi, '').replace(/\sdata-code="[^"]*"/gi, '').replace(/<a class="mx-btn[^"]*"([^>]*)>/gi, '<a$1>')
}

// ---------- route table ----------
const routes = []
const add = r => isPathHidden(HIDDEN, r.path) ? null : routes.push({ type: 'website', image: '', noindex: false, ld: [], ...r })
const homeL = mergeContent({ ...LISTING.home, ...HOME_DEFAULT }, content.home)
const gameMods = mods.filter(m => m.listing_type === 'game'), hh = homeHidden(homeL), hon = k => !hh.includes(k)
add({ path: '/', title: homeL.seoTitle, description: homeL.description, h1: `${homeL.hero.line1} ${homeL.hero.line2}`,
  body: `<p>${esc(homeL.hero.description)}</p>${hon('answer') ? answerHtml(homeL.answer) : ''}${hon('games') && gameMods.length ? `<section><h2>${esc(homeL.headings.games.title)} ${esc(homeL.headings.games.accent)}</h2><ul>${gameMods.slice(0, 8).map(g => `<li><a href="${SITE_URL}/games/${g.slug}">${esc(g.title)}</a></li>`).join('')}</ul></section>` : ''}${hon('how') ? `<section><h2>${esc(homeL.headings.how.title)} ${esc(homeL.headings.how.accent)}</h2><ol>${homeL.steps.map(s => `<li><strong>${esc(s.t)}.</strong> ${esc(s.d)}</li>`).join('')}</ol></section>` : ''}${hon('why') ? `<section><h2>${esc(homeL.headings.why.title)} ${esc(homeL.headings.why.accent)}</h2><ul>${homeL.values.map(v => `<li><strong>${esc(v.t)}.</strong> ${esc(v.d)}</li>`).join('')}</ul></section>` : ''}${hon('content') ? sectionsHtml(homeL.sections) : ''}${hon('faq') ? faqHtml(homeL.faqs) : ''}`,
  ld: [pageLd('/', homeL.seoTitle, homeL.description), ...(hon('faq') ? [faqLd(homeL.faqs)] : [])] })
for (const k of ['apps', 'games', 'guide', 'blog', 'submit']) {
  const L = mergeContent(LISTING[k], content['listing:' + k])
  add({ path: L.path, title: L.seoTitle, description: L.description, h1: L.h1, body: `${answerHtml(L.answer)}${sectionsHtml(L.sections)}${faqHtml(L.faqs)}`,
    ld: [pageLd(L.path, L.seoTitle, L.description, k === 'submit' ? 'WebPage' : 'CollectionPage'), crumbsLd(L.path, [{ label: 'Home', to: '/' }, { label: L.h1, to: L.path }]), ...(L.faqs.length ? [faqLd(L.faqs)] : [])] })
}
for (const slug of POLICY_SLUGS) {
  const P0 = mergeContent(PAGES[slug], content['page:' + slug]), P = settings.ads_enabled && ADS_SECTIONS[slug] && !(P0.sections || []).some(x => x.id === 'advertising') ? { ...P0, sections: [...(P0.sections || []), ADS_SECTIONS[slug]] } : P0, path = '/' + slug
  add({ path, title: P.seoTitle, description: P.description, h1: P.h1, body: `<p>Last updated ${esc(SITE.updatedLabel)}.</p>${answerHtml(P.answer)}${sectionsHtml(P.sections)}${faqHtml(P.faqs)}`,
    ld: [pageLd(path, P.seoTitle, P.description, P.type, { dateModified: P.updated }), crumbsLd(path, [{ label: 'Home', to: '/' }, { label: P.title, to: path }]), ...(P.faqs?.length ? [faqLd(P.faqs)] : [])] })
}
// dynamic content (only when Supabase is connected)
const relGuides = m => { const g = posts.filter(p => p.game_slug === m.slug).slice(0, 4); return g.length ? `<section><h2>Guides for ${esc(m.title)}</h2><ul>${g.map(p => `<li><a href="${SITE_URL}/${p.post_type === 'guide' ? 'guide' : 'blog'}/${p.slug}">${esc(p.title)}</a></li>`).join('')}</ul></section>` : '' }
for (const m of mods) {
  const isGame = m.listing_type === 'game', base = isGame ? '/games/' : '/apps/', label = isGame ? 'Game' : 'App', path = base + m.slug
  const title = m.seo_title ? `${m.seo_title} | Modexa` : `${m.title}: ${label} | Modexa`
  const desc = clip(m.seo_description || m.excerpt || m.description || `${m.title} on Modexa.`, 158)
  const list = (a, t) => Array.isArray(a) && a.length ? `<h2>${t}</h2><ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''
  add({ path, title, description: desc, h1: m.title, image: m.cover_image, type: 'article', noindex: !!m.noindex, canonical: m.canonical_url || '',
    body: `<p>${esc(m.excerpt || '')}</p><ul>${m.platform ? `<li>Platform: ${esc(m.platform)}</li>` : ''}${m.version ? `<li>Version: ${esc(m.version)}</li>` : ''}${m.creator ? `<li>Creator: ${esc(m.creator)}</li>` : ''}${m.category ? `<li>Category: ${esc(m.category)}</li>` : ''}</ul>${staticBody(m.content || m.description || '')}${list(m.features, 'Features')}${relGuides(m)}${faqHtml(cleanF(m.faqs))}${list(m.requirements, 'Requirements')}${Array.isArray(m.install) && m.install.length ? `<h2>How to install</h2><ol>${m.install.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}`,
    lastmod: (m.updated_at || '').slice(0, 10),
    ld: [pageLd(path, title, desc, 'ItemPage', { dateModified: m.updated_at || undefined }), crumbsLd(path, [{ label: 'Home', to: '/' }, { label: isGame ? 'Games' : 'Apps', to: base.slice(0, -1) }, { label: m.title, to: path }]),
      { '@type': isGame ? ['VideoGame', 'SoftwareApplication'] : 'SoftwareApplication', name: m.title, ...(isGame ? { gamePlatform: m.platform || undefined, genre: m.category || undefined } : {}), applicationCategory: isGame ? 'GameApplication' : 'MobileApplication', operatingSystem: m.platform, description: m.excerpt || undefined, image: m.cover_image || undefined, softwareVersion: m.version || undefined, author: { '@type': 'Person', name: m.creator || 'Modexa' } },
      ...(cleanF(m.faqs).length ? [faqLd(cleanF(m.faqs))] : []),
      ...(Array.isArray(m.install) && m.install.length ? [{ '@type': 'HowTo', name: `How to install ${m.title}`, step: m.install.map((t, i) => ({ '@type': 'HowToStep', position: i + 1, text: String(t) })) }] : [])] })
}
for (const p of posts) {
  const type = p.post_type === 'guide' ? 'guide' : 'blog', path = '/' + type + '/' + p.slug, title = p.seo_title ? `${p.seo_title} | Modexa` : `${p.title} | Modexa`, desc = clip(p.seo_description || p.excerpt || p.title, 158)
  add({ path, title, description: desc, h1: p.title, image: p.cover_image, type: 'article', noindex: !!p.noindex, canonical: p.canonical_url || '', lastmod: (p.updated_at || '').slice(0, 10),
    body: `<p>${esc(p.excerpt || '')}</p>${staticBody(p.content)}${faqHtml(cleanF(p.faqs))}`,
    ld: [pageLd(path, title, desc, 'WebPage', { dateModified: p.updated_at || undefined }), crumbsLd(path, [{ label: 'Home', to: '/' }, { label: type === 'guide' ? 'Guide' : 'Blog', to: '/' + type }, { label: p.title, to: path }]),
      { '@type': 'Article', headline: p.title, description: desc, image: p.cover_image || undefined, datePublished: p.published_at || undefined, dateModified: p.updated_at || p.published_at || undefined, author: { '@type': 'Organization', name: 'Modexa' }, publisher: { '@id': SITE_URL + '/#organization' }, mainEntityOfPage: SITE_URL + path }, ...(cleanF(p.faqs).length ? [faqLd(cleanF(p.faqs))] : [])] })
}
for (const p of cpages) { if (POLICY_SLUGS.includes(p.slug)) continue
  const path = '/page/' + p.slug, title = p.seo_title ? `${p.seo_title} | Modexa` : `${p.title} | Modexa`, desc = clip(p.seo_description || p.excerpt || p.title, 158)
  add({ path, title, description: desc, h1: p.title, noindex: !!p.noindex, lastmod: (p.updated_at || '').slice(0, 10), body: `<p>${esc(p.excerpt || '')}</p>${Array.isArray(p.blocks) && p.blocks.length ? p.blocks.map(b => { const d = b.data || {}; return b.type === 'hero' ? `<h2>${esc(d.title)}</h2><p>${esc(d.subtitle)}</p>` : b.type === 'text' ? staticBody(d.html) : b.type === 'columns' ? (d.cols || []).map(c => staticBody(c.html)).join('') : b.type === 'faq' ? faqHtml((d.items || []).map(x => ({ q: x.q, a: x.a }))) : b.type === 'cards' ? `<ul>${(d.items || []).map(c => `<li><strong>${esc(c.title)}</strong> ${esc(c.text)}</li>`).join('')}</ul>` : b.type === 'cta' ? `<h2>${esc(d.title)}</h2><p>${esc(d.text)}</p>` : '' }).join('') : staticBody(p.content)}`, ld: [pageLd(path, title, desc), crumbsLd(path, [{ label: 'Home', to: '/' }, { label: p.title, to: path }])] }) }

// ---------- write html ----------
const absImg = u => { u = String(u || '').trim(); return !u ? '' : /^https?:\/\//i.test(u) ? u : u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? SITE_URL + u : '' }
// social image: the page's own cover → Admin → Site & brand “Default social-share image” → the built-in branded image
const DEFAULT_IMG = absImg(settings.default_og_image) || SITE_URL + '/og-default.png'
const setMeta = (html, attr, key, val) => { const re = new RegExp(`<meta ${attr}="${key}"[^>]*>`); const tag = `<meta ${attr}="${key}" content="${esc(val)}"/>`; return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`) }
function build(r) {
  const url = r.canonical || SITE_URL + (r.path === '/' ? '/' : r.path)
  let h = template
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`)
  h = setMeta(h, 'name', 'description', r.description)
  h = setMeta(h, 'name', 'robots', r.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1')
  for (const [k, v] of [['og:title', r.title], ['og:description', r.description], ['og:url', url], ['og:type', r.type], ['og:image', absImg(r.image) || DEFAULT_IMG], ['og:image:alt', r.h1], ['og:locale', 'en_US']]) h = setMeta(h, 'property', k, v)
  for (const [k, v] of [['twitter:card', 'summary_large_image'], ['twitter:title', r.title], ['twitter:description', r.description], ['twitter:image', absImg(r.image) || DEFAULT_IMG]]) h = setMeta(h, 'name', k, v)
  h = h.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}"/>`)
  const ld = `<script type="application/ld+json" data-modexa-ld="1">${JSON.stringify({ '@context': 'https://schema.org', '@graph': r.ld })}</script>`
  h = h.replace('</head>', `  ${ld}\n</head>`)
  const content = `<div class="prerender">${navHtml()}<main><h1>${esc(r.h1)}</h1>${r.body}</main>${footHtml()}</div>`
  h = h.replace('<div id="root"></div>', `<div id="root">${content}</div>`)
  return h.split('__SITE_URL__').join(SITE_URL)
}
const write = (path, html) => { const file = path === '/' ? join(DIST, 'index.html') : join(DIST, path.replace(/^\//, ''), 'index.html'); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, html) }
for (const r of routes) write(r.path, build(r))
// 404 (noindex) for hosts that serve /404.html
writeFileSync(join(DIST, '404.html'), build({ path: '/404', title: 'Page not found | Modexa', description: 'This page could not be found.', h1: 'Page not found', body: '<p>The page you are looking for does not exist. Try the <a href="/mods">mod library</a>.</p>', noindex: true, type: 'website', ld: [] }))

// /admin shell: no prerendered content, never indexed (otherwise the host would serve the home page HTML here)
{
  let h = template
  h = h.replace(/<title>[\s\S]*?<\/title>/, '<title>Modexa Admin</title>')
  h = setMeta(h, 'name', 'robots', 'noindex,nofollow')
  h = h.replace(/<link rel="canonical"[^>]*>\n?/, '').replace(/<meta property="og:url"[^>]*>\n?/, '')
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/, '')
  write('/admin', h.split('__SITE_URL__').join(SITE_URL))
}

// ---------- sitemap, robots, llms.txt ----------
const today = new Date().toISOString().slice(0, 10)
const indexable = routes.filter(r => !r.noindex && !r.canonical)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map(r => `  <url><loc>${SITE_URL}${r.path === '/' ? '/' : r.path}</loc><lastmod>${r.lastmod || (PAGES[r.path.slice(1)]?.updated) || today}</lastmod></url>`).join('\n')}\n</urlset>\n`
writeFileSync(join(DIST, 'sitemap.default.xml'), sitemap) // served via /api/seo (admin can override)
const bots = ['*', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended']
writeFileSync(join(DIST, 'robots.default.txt'), `# AI and search crawlers are welcome so Modexa can be cited accurately. Remove a group below to opt out.\n${bots.map(b => `User-agent: ${b}\nAllow: /\nDisallow: /admin\n`).join('\n')}\nSitemap: ${SITE_URL}/sitemap.xml\n`)
const llm = []
llm.push(`# Modexa\n\n> ${SITE.description}\n\nModexa is an Android game hub. Each game page shows the platform, version, requirements, FAQs and related guides. It never re-hosts files: every download button opens the original source page. Modexa is independent and not affiliated with game publishers.\n`)
llm.push(`## Key pages\n${[['/', 'Home'], ['/apps', 'Apps'], ['/games', 'Games'], ['/guide', 'Guides'], ['/blog', 'Blog'], ['/submit-mod', 'Submit a game']].filter(([p]) => !isPathHidden(HIDDEN, p)).map(([p, t]) => `- [${t}](${SITE_URL}${p === '/' ? '/' : p})`).join('\n')}\n`)
llm.push(`## Policies and help\n${LEGAL_LINKS.map(l => `- [${l.label}](${SITE_URL}${l.to})`).join('\n')}\n`)
if (mods.length) llm.push(`## Apps and games\n${mods.slice(0, 200).map(m => `- [${m.title}](${SITE_URL}${m.listing_type === 'game' ? '/games/' : '/apps/'}${m.slug}): ${clip(m.excerpt || '', 120)} (${m.platform})`).join('\n')}\n`)
if (posts.length) llm.push(`## Guides and blog\n${posts.slice(0, 100).map(p => `- [${p.title}](${SITE_URL}/${p.post_type === 'guide' ? 'guide' : 'blog'}/${p.slug}): ${clip(p.excerpt, 120)}`).join('\n')}\n`)
if (settings.contact_email) llm.push(`## Contact\n${settings.contact_email}, or use ${SITE_URL}/contact\n`)
writeFileSync(join(DIST, 'llms.txt'), llm.join('\n'))
console.log(`prerender: ${routes.length} pages, sitemap (${indexable.length} URLs), robots.txt, llms.txt → ${SITE_URL}`)
