// Admin-only: triggers a Vercel rebuild so saved <head> code is baked into the public HTML.
// Needs the env var VERCEL_DEPLOY_HOOK_URL (Vercel → Settings → Git → Deploy Hooks).
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from '../src/lib/publicConfig.js'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hook) return res.status(501).json({ error: 'not_configured' })
  const base = (process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL).replace(/\/$/, '')
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_KEY
  const token = String(req.headers.authorization || '').replace(/^Bearer /, '')
  if (!token) return res.status(401).json({ error: 'auth' })
  const h = { apikey: key, Authorization: 'Bearer ' + token }
  try {
    const u = await fetch(base + '/auth/v1/user', { headers: h })
    if (!u.ok) return res.status(401).json({ error: 'auth' })
    const user = await u.json()
    const a = await fetch(`${base}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`, { headers: h })
    const rows = a.ok ? await a.json() : []
    if (!rows.length) return res.status(403).json({ error: 'forbidden' })
    const r = await fetch(hook, { method: 'POST' })
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok })
  } catch { return res.status(502).json({ error: 'failed' }) }
}
