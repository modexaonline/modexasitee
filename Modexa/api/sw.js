// Serves /sw.js (Monetag push-notification service worker). Paste the file contents in Admin → Ads → Monetag.
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from '../src/lib/publicConfig.js'

export default async function handler(req, res) {
  const base = (process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL).replace(/\/$/, '')
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_KEY
  let body = ''
  try {
    const r = await fetch(`${base}/rest/v1/site_settings?id=eq.1&select=monetag_sw`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (r.ok) { const rows = await r.json(); body = String(rows?.[0]?.monetag_sw || '') }
  } catch {}
  if (!body.trim()) { res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.send('// no service worker saved') }
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
  res.setHeader('Service-Worker-Allowed', '/')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600')
  res.status(200).send(body)
}
