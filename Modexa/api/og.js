// Serves /blog/:slug, /guide/:slug, /games/:slug and /apps/:slug pages that were published AFTER the last build, so social crawlers
// (Facebook, Threads, Flipboard, X, WhatsApp, Telegram, LinkedIn …) get the page's own title, description and cover image
// instead of the generic home-page tags. Pages that exist at build time are already static files with the same tags (scripts/prerender.mjs).
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, PUBLIC_SITE_URL } from '../src/lib/publicConfig.js'

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s }
const text = s => String(s ?? '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim()
const setMeta = (html, attr, key, val) => {
  const re = new RegExp(`<meta ${attr}="${key}"[^>]*>`), tag = `<meta ${attr}="${key}" content="${esc(val)}"/>`
  return re.test(html) ? html.replace(re, () => tag) : html.replace('</head>', () => `  ${tag}\n</head>`)
}

export default async function handler(req, res) {
  const LANGS = ['id','pt','es','ar','tr','hi','vi','bn','ur','th'], HREFLANG = { hi: 'hi-Latn', pt: 'pt-BR' }, LOCALE = { id:'id_ID', pt:'pt_BR', es:'es_ES', ar:'ar_AR', tr:'tr_TR', hi:'hi_IN', vi:'vi_VN', bn:'bn_BD', ur:'ur_PK', th:'th_TH' }
  const lang = LANGS.includes(String(req.query.lang || '')) ? String(req.query.lang) : '', t = String(req.query.t || ''), slug = String(req.query.slug || '').toLowerCase()
  const site = String(process.env.SITE_URL || process.env.VITE_SITE_URL || PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0]
  const origin = host ? `https://${host}` : site
  const base = String(process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL).replace(/\/$/, '')
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_KEY
  const H = { apikey: key, Authorization: `Bearer ${key}` }
  const q = async path => { const r = await fetch(`${base}/rest/v1/${path}`, { headers: H }); if (!r.ok) throw new Error(String(r.status)); return r.json() }

  let template = ''
  try { const r = await fetch(`${origin}/index.html`); if (r.ok) template = await r.text() } catch {}
  if (!template) { res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8'); return res.send('<!doctype html><meta charset="utf-8"><title>Modexa</title><div id="root"></div>') }
  const send = html => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'); res.status(200).send(html) }

  try {
    if (!['blog', 'guide', 'games', 'apps'].includes(t) || !/^[a-z0-9-]{1,160}$/.test(slug)) return send(template)
    const isPost = t === 'blog' || t === 'guide'
    const [rows, st] = await Promise.all([
      q(isPost ? `posts?slug=eq.${slug}&status=eq.published&select=id,title,seo_title,seo_description,og_title,og_description,og_image,twitter_card,excerpt,content,cover_image,post_type,published_at,updated_at,noindex,canonical_url&limit=1`
        : `mods?slug=eq.${slug}&status=eq.published&select=id,title,seo_title,seo_description,og_title,og_description,og_image,twitter_card,excerpt,description,cover_image,listing_type,platform,updated_at,noindex,canonical_url&limit=1`),
      q('site_settings?id=eq.1&select=default_og_image,twitter_url').catch(() => []),
    ])
    const row = rows?.[0]
    if (!row) return send(template)
    // International page: overlay the saved translation. Without one the English page is served and kept out of the index.
    let trOk = false, alts = []
    if (row.id) {
      const kind = isPost ? 'post' : 'mod'
      const trs = await q(`translations?kind=eq.${kind}&item_key=eq.${row.id}&select=lang,data`).catch(() => [])
      alts = trs.map(x => x.lang).filter(l => LANGS.includes(l))
      const tr = lang && trs.find(x => x.lang === lang)
      if (tr?.data) { trOk = true; for (const k of ['title','excerpt','seo_title','seo_description','og_title','og_description','content','description']) { if (typeof tr.data[k] === 'string' && tr.data[k]) row[k] = tr.data[k]; else if (['seo_title','seo_description','og_title','og_description'].includes(k)) row[k] = '' } }
    }
    const abs = u => { u = String(u || '').trim(); return !u ? '' : /^https?:\/\//i.test(u) ? u : u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? site + u : '' }
    const path = isPost ? `/${row.post_type === 'guide' ? 'guide' : 'blog'}/${slug}` : `/${row.listing_type === 'game' ? 'games' : 'apps'}/${slug}`
    const url = lang ? (trOk ? site + '/' + lang + path : site + path) : (abs(row.canonical_url) || site + path)
    const title = row.seo_title ? `${row.seo_title} | Modexa` : isPost ? `${row.title} | Modexa` : `${row.title}: ${row.listing_type === 'game' ? 'Game' : 'App'} | Modexa`
    const desc = clip(row.seo_description || row.excerpt || (isPost ? '' : row.description) || row.title, 158)
    const image = abs(row.og_image) || abs(row.cover_image) || abs(st?.[0]?.default_og_image) || site + '/og-default.png'
    const sTitle = row.og_title || title, sDesc = row.og_description || desc, card = row.twitter_card === 'summary' ? 'summary' : 'summary_large_image'
    const handle = (String(st?.[0]?.twitter_url || '').match(/(?:twitter|x)\.com\/@?([A-Za-z0-9_]{1,15})/) || [])[1]
    let h = template
    if (trOk) h = h.replace(/<html([^>]*?)\slang="[^"]*"/, (m, a) => `<html${a} lang="${lang}"`).replace('<html', () => '<html dir="' + (['ar','ur'].includes(lang) ? 'rtl' : 'ltr') + '"')
    if (alts.length && !row.noindex) {
      const alt = (hl, href) => `  <link rel="alternate" hreflang="${hl}" href="${esc(href)}"/>\n`
      h = h.replace('</head>', () => alt('en', site + path) + alts.map(l => alt(HREFLANG[l] || l, site + '/' + l + path)).join('') + alt('x-default', site + path) + '</head>')
    }
    h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>`)
    h = setMeta(h, 'name', 'description', desc)
    h = setMeta(h, 'name', 'robots', (row.noindex || (lang && !trOk)) ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1')
    for (const [k, v] of [['og:site_name', 'Modexa'], ['og:title', sTitle], ['og:description', sDesc], ['og:url', url], ['og:type', 'article'], ['og:image', image], ['og:image:alt', sTitle], ['og:locale', trOk ? LOCALE[lang] : 'en_US'], ...(row.published_at ? [['article:published_time', row.published_at]] : []), ...(row.updated_at ? [['article:modified_time', row.updated_at]] : [])]) h = setMeta(h, 'property', k, v)
    for (const [k, v] of [['twitter:card', card], ['twitter:title', sTitle], ['twitter:description', sDesc], ['twitter:image', image], ...(handle ? [['twitter:site', '@' + handle]] : [])]) h = setMeta(h, 'name', k, v)
    h = h.replace(/<link rel="canonical"[^>]*>/, () => `<link rel="canonical" href="${esc(url)}"/>`)
    h = h.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', headline: row.title, description: desc, image: image, mainEntityOfPage: url, datePublished: row.published_at || undefined, dateModified: row.updated_at || row.published_at || undefined, author: { '@type': 'Organization', name: 'Modexa' }, publisher: { '@type': 'Organization', name: 'Modexa', logo: { '@type': 'ImageObject', url: site + '/favicon.svg' } } }] }
    h = h.replace('</head>', () => `  <script type="application/ld+json" data-modexa-ld="1">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n</head>`)
    const body = clip(text(isPost ? row.content : row.description), 4000)
    h = h.replace(/<div id="root">[\s\S]*?<\/div>\s*(<script|<noscript)/, (m, n) => `<div id="root"><div class="prerender"><main><h1>${esc(row.title)}</h1>${row.excerpt ? `<p>${esc(row.excerpt)}</p>` : ''}${body ? `<p>${esc(body)}</p>` : ''}</main></div></div>\n  ${n}`)
    return send(h)
  } catch { return send(template) }
}
