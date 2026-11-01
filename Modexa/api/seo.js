// Serves /robots.txt and /sitemap.xml. If an admin saved a custom file (Admin → Robots & Sitemap) it is used,
// otherwise the auto-generated default created at build time (robots.default.txt / sitemap.default.xml).
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from '../src/lib/publicConfig.js'

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
  res.setHeader('Content-Type', f.type)
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(body)
}
