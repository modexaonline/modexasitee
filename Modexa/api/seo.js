// Serves /robots.txt and /sitemap.xml. If an admin saved a custom file (Admin → Robots & Sitemap) it is used,
// otherwise the auto-generated default created at build time (robots.default.txt / sitemap.default.xml).
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, PUBLIC_SITE_URL } from '../src/lib/publicConfig.js'

const FILES = {
  robots: { col: 'robots_txt', def: '/robots.default.txt', type: 'text/plain; charset=utf-8', fallback: 'User-agent: *\nAllow: /\nDisallow: /admin\n' },
  sitemap: { col: 'sitemap_xml', def: '/sitemap.default.xml', type: 'application/xml; charset=utf-8', fallback: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n' }
}

export default async function handler(req, res) {
  const f = FILES[req.query.f === 'sitemap' ? 'sitemap' : 'robots']
  const base = (process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL).replace(/\/$/, '')
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_KEY
  let body = ''
  try {
    const r = await fetch(`${base}/rest/v1/site_settings?id=eq.1&select=${f.col}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (r.ok) { const rows = await r.json(); body = String(rows?.[0]?.[f.col] || '') }
  } catch {}
  if (!body.trim()) {
    try { const r = await fetch(`https://${req.headers.host}${f.def}`); if (r.ok) body = await r.text() } catch {}
  }
  if (!body.trim()) body = f.fallback
  // a saved/placeholder file may still say yourdomain.com: always point it at the real site
  const site = String(process.env.SITE_URL || process.env.VITE_SITE_URL || PUBLIC_SITE_URL || '').replace(/\/$/, '')
  if (site) body = body.replace(/https?:\/\/(?:www\.)?yourdomain\.com/gi, site)
  // Always-fresh sitemap: even with a custom file, every published and indexable page (and its saved translations)
  // is listed automatically. Only pages the admin removed by hand (sitemap_prefs) stay out.
  if (f === FILES.sitemap && /<\/urlset>/i.test(body)) {
    try {
      const H = { apikey: key, Authorization: `Bearer ${key}` }
      const q = async path => { const r = await fetch(`${base}/rest/v1/${path}`, { headers: H }); return r.ok ? r.json() : [] }
      const [posts, mods, trs, prefs, st] = await Promise.all([
        q('posts?status=eq.published&select=id,slug,post_type,noindex,updated_at,published_at&limit=1000'),
        q('mods?status=eq.published&select=id,slug,listing_type,noindex,updated_at&limit=1000'),
        q('translations?kind=in.(post,mod)&select=kind,item_key,lang&limit=1000'),
        q('site_content?key=eq.sitemap_prefs&select=data'),
        q('site_settings?id=eq.1&select=i18n_enabled,i18n_langs')
      ])
      const origin = site || `https://${req.headers.host}`
      const norm = u => { try { return new URL(u, origin).pathname.replace(/\/+$/, '') || '/' } catch { return '' } }
      const have = new Set([...body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m => norm(m[1].replace(/&amp;/g, '&'))))
      const removed = new Set((prefs?.[0]?.data?.removed || []).map(p => String(p).replace(/\/+$/, '') || '/'))
      const langOn = st?.[0]?.i18n_enabled ? new Set(st[0].i18n_langs || []) : new Set()
      const items = [], byId = {}
      for (const x of posts || []) { if (x.noindex) continue; const path = `/${x.post_type === 'guide' ? 'guide' : 'blog'}/${x.slug}`; byId['post:' + x.id] = path; items.push([path, x.updated_at || x.published_at]) }
      for (const x of mods || []) { if (x.noindex) continue; const path = `/${x.listing_type === 'game' ? 'games' : 'apps'}/${x.slug}`; byId['mod:' + x.id] = path; items.push([path, x.updated_at]) }
      for (const t of trs || []) { const base0 = byId[t.kind + ':' + t.item_key]; if (base0 && langOn.has(t.lang)) items.push([`/${t.lang}${base0}`, null]) }
      const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      const add = items.filter(([p]) => p && !have.has(p) && !removed.has(p))
      if (add.length) body = body.replace(/<\/urlset>/i, () => add.map(([p, d]) => `  <url><loc>${esc(origin + p)}</loc>${d ? `<lastmod>${String(d).slice(0, 10)}</lastmod>` : ''}</url>\n`).join('') + '</urlset>')
    } catch {}
  }
  res.setHeader('Content-Type', f.type)
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(body)
}
