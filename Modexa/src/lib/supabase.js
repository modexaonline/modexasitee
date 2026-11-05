import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from './publicConfig.js'

const url = import.meta.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_KEY
export const supabaseConfigured = Boolean(url && key && !url.includes('YOUR_PROJECT_ID') && !key.includes('YOUR_SUPABASE'))
export const supabase = supabaseConfigured ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null

// Quick connectivity check used to explain "Failed to fetch" errors.
export async function pingSupabase() {
  if (!supabaseConfigured) return false
  try { const r = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key }, cache: 'no-store' }); return r.ok } catch { return false }
}
