// Public Supabase connection details.
// The URL and the *publishable* key are designed to be visible in the browser; your data is protected by
// Row Level Security in Supabase, not by hiding this key. NEVER put a secret / service_role key here.
//
// These are used as a fallback when VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set on the
// hosting platform (Vercel ignores the local .env file). Environment variables still win when present.
export const PUBLIC_SUPABASE_URL = 'https://sfjxlrbnvhbymxenydla.supabase.co'
export const PUBLIC_SUPABASE_KEY = 'sb_publishable_GR29RAdWYXI6rnj9JrrRbQ_xg-BycNV'
export const PUBLIC_SITE_URL = 'https://modexa.online'
