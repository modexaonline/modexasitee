// Serves /blog/:slug, /guide/:slug, /games/:slug and /apps/:slug pages that were published AFTER the last build, so social crawlers
// (Facebook, Threads, Flipboard, X, WhatsApp, Telegram, LinkedIn …) get the page's own title, description and cover image
// instead of the generic home-page tags. Pages that exist at build time are already static files with the same tags (scripts/prerender.mjs).
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, PUBLIC_SITE_URL } from '../src/lib/publicConfig.js'

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s }
const text = s => String(s ?? '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim()
const setMeta = (html, attr, key, val) => {
  const re = new RegExp(`<meta\\s[^>]*?\\b${attr}=["']${key.replace(/[:.]/g, m => '\\' + m)}["'][^>]*>`, 'gi'), tag = `<meta ${attr}="${key}" content="${esc(val)}"/>`
  let n = 0; const out = html.replace(re, () => (n++ ? '' : tag))
  return n ? out : out.replace('</head>', () => `  ${tag}\n</head>`)
}

export default async function handler(req, res) {
  const t = String(req.query.t || ''), slug = String(req.query.slug || '').toLowerCase()
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
    const cols = isPost ? 'title,seo_title,seo_description,excerpt,content,cover_image,post_type,published_at,updated_at,noindex,canonical_url' : 'title,seo_title,seo_description,excerpt,description,cover_image,listing_type,platform,updated_at,noindex,canonical_url'
    const tbl = isPost ? 'posts' : 'mods', social = ',og_title,og_description,og_image,twitter_card'
    const [rows, st] = await Promise.all([
      q(`${tbl}?slug=eq.${slug}&status=eq.published&select=${cols}${social}&limit=1`).catch(() => q(`${tbl}?slug=eq.${slug}&status=eq.published&select=${cols}&limit=1`)),
      q('site_settings?id=eq.1&select=default_og_image').catch(() => []),
    ])
    const row = rows?.[0]
    if (!row) return send(template)
    const abs = u => { u = String(u || '').trim(); return !u ? '' : /^https?:\/\//i.test(u) ? u : u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? site + u : '' }
    const path = isPost ? `/${row.post_type === 'guide' ? 'guide' : 'blog'}/${slug}` : `/${row.listing_type === 'game' ? 'games' : 'apps'}/${slug}`
    const url = abs(row.canonical_url) || site + path
    const title = row.seo_title ? `${row.seo_title} | Modexa` : isPost ? `${row.title} | Modexa` : `${row.title}: ${row.listing_type === 'game' ? 'Game' : 'App'} | Modexa`
    const desc = clip(row.seo_description || row.excerpt || (isPost ? '' : row.description) || row.title, 158)
    const sTitle = String(row.og_title || '').trim() || title, sDesc = clip(String(row.og_description || '').trim() || desc, 200)
    const image = abs(row.og_image) || abs(row.cover_image) || abs(st?.[0]?.default_og_image) || site + '/og-default.png', card = row.twitter_card === 'summary' ? 'summary' : 'summary_large_image'
    let h = template
    h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>`)
    h = setMeta(h, 'name', 'description', desc)
    h = setMeta(h, 'name', 'robots', row.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1')
    for (const [k, v] of [['og:site_name', 'Modexa'], ['og:title', sTitle], ['og:description', sDesc], ['og:url', url], ['og:type', 'article'], ['og:image', image], ['og:image:alt', sTitle], ['og:locale', 'en_US'], ...(row.published_at ? [['article:published_time', row.published_at]] : []), ...(row.updated_at ? [['article:modified_time', row.updated_at]] : [])]) h = setMeta(h, 'property', k, v)
    for (const [k, v] of [['twitter:card', card], ['twitter:title', sTitle], ['twitter:description', sDesc], ['twitter:image', image]]) h = setMeta(h, 'name', k, v)
    h = h.replace(/<link rel="canonical"[^>]*>/, () => `<link rel="canonical" href="${esc(url)}"/>`)
    h = h.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', headline: row.title, description: desc, image: image, mainEntityOfPage: url, datePublished: row.published_at || undefined, dateModified: row.updated_at || row.published_at || undefined, author: { '@type': 'Organization', name: 'Modexa' }, publisher: { '@type': 'Organization', name: 'Modexa', logo: { '@type': 'ImageObject', url: site + '/favicon.svg' } } }] }
    h = h.replace('</head>', () => `  <script type="application/ld+json" data-modexa-ld="1">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n</head>`)
    const body = clip(text(isPost ? row.content : row.description), 4000)
    h = h.replace(/<div id="root">[\s\S]*?<\/div>\s*(<script|<noscript)/, (m, n) => `<div id="root"><div class="prerender"><main><h1>${esc(row.title)}</h1>${row.excerpt ? `<p>${esc(row.excerpt)}</p>` : ''}${body ? `<p>${esc(body)}</p>` : ''}</main></div></div>\n  ${n}`)
    return send(h)
  } catch { return send(template) }
}
