import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'

export const defaultSettings = { site_name: 'Modexa', tagline: 'Discover Android games. Play smarter.', contact_email: '', announcement: '', announcement_link: '', announcement_active: false, twitter_url: '', youtube_url: '', discord_url: '', ads_enabled: false, ads_require_consent: true, logo_url: '', default_og_image: '', footer_text: '', social_links: [], announcement_position: 'top', download_wait_seconds: 30, monetag_code: '', monetag_enabled: true, monetag_formats: [] }
let cache = null, inflight = null
const listeners = new Set()

export function useSettings() {
  const [s, setS] = useState(cache || defaultSettings)
  useEffect(() => {
    if (!supabaseConfigured) return
    let alive = true
    const fn = v => alive && setS(v); listeners.add(fn)
    if (cache) setS(cache)
    else {
      inflight = inflight || supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => { cache = { ...defaultSettings, ...(data || {}) }; listeners.forEach(f => f(cache)) })
    }
    return () => { alive = false; listeners.delete(fn) }
  }, [])
  return s
}
export function setSettingsCache(v) { cache = { ...defaultSettings, ...v }; listeners.forEach(f => f(cache)) }
