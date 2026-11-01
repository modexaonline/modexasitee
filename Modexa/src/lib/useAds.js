import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import { useSettings } from './useSettings'
import { useConsent } from './consent'

let state = { items: [], loaded: false }
let started = false
const listeners = new Set()
function load() {
  if (started || !supabaseConfigured) return
  started = true
  supabase.from('ad_units').select('*').eq('status', 'active').order('priority', { ascending: false }).then(({ data, error }) => {
    if (error) console.error('Modexa: could not load ads', error.message)
    state = { items: error ? [] : (data || []), loaded: true }; listeners.forEach(f => f(state))
  })
}
export function refreshAds() { started = false; load() }

export function useMediaQuery(q) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => { const mq = window.matchMedia(q), on = () => setM(mq.matches); on(); mq.addEventListener?.('change', on); return () => mq.removeEventListener?.('change', on) }, [q])
  return m
}

// Ads are shown only when: master switch is ON, and (consent is not required OR the visitor accepted).
export function useAdsAllowed() {
  const s = useSettings(), consent = useConsent()
  return Boolean(s.ads_enabled) && (!s.ads_require_consent || consent === 'all')
}

export function useAdUnits(placement, ctx = {}, opts = {}) {
  const allowed = useAdsAllowed()
  const [s, setS] = useState(state)
  const desktop = useMediaQuery('(min-width: 768px)')
  useEffect(() => { if (!allowed) return; listeners.add(setS); setS(state); load(); return () => { listeners.delete(setS) } }, [allowed])
  if (!allowed) return []
  const { postSlug = '', gameSlug = '' } = ctx
  return s.items.filter(u => {
    if (placement && u.placement !== placement) return false
    if (u.devices === 'desktop' && !desktop) return false
    if (u.devices === 'mobile' && desktop) return false
    const ex = u.exclude_slugs || [], tg = u.target_slugs || []
    if ((postSlug && ex.includes(postSlug)) || (gameSlug && ex.includes(gameSlug))) return false
    if (opts.ignoreScope) return true
    if (u.scope === 'selected_posts') return Boolean(postSlug) && tg.includes(postSlug)
    if (u.scope === 'selected_games') return Boolean(gameSlug) && tg.includes(gameSlug)
    return true
  })
}

// One unit by its shortcode, e.g. [ad:top-banner] inside a blog post.
export function useAdByKey(key, ctx = {}) {
  const all = useAdUnits('', ctx)
  return all.find(u => u.slot_key === key) || null
}

// Debug only: raw list of active units (ignores consent / device / targeting) so the debug panel can explain what is happening.
export function useAdsRaw() {
  const [s, setS] = useState(state)
  useEffect(() => { listeners.add(setS); setS(state); load(); return () => { listeners.delete(setS) } }, [])
  return s.items
}
