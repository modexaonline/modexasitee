import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import { useSettings } from './useSettings'
import { useConsent } from './consent'
import { MONETAG_DEFAULTS, MONETAG_DIRECT_LINK, AUTO_AD_COPY } from './monetagDefaults'

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

export function useAdsLoaded() {
  const [s, setS] = useState(state)
  useEffect(() => { listeners.add(setS); setS(state); load(); return () => { listeners.delete(setS) } }, [])
  return s.loaded
}

// ---- Monetag: scripts + automatic direct-link cards -------------------------------------------------------
// Uses what is saved in Admin → Ads → Monetag; if nothing is saved yet, the built-in Monetag codes are used.
export function monetagFormats(s) {
  const saved = Array.isArray(s.monetag_formats) ? s.monetag_formats.filter(f => f && String(f.code || '').trim()) : []
  const old = String(s.monetag_code || '').trim()
  const custom = saved.length > 0 || Boolean(old)
  const list = custom ? [...(old ? [{ id: 'old', format: 'multitag', code: old, on: true }] : []), ...saved] : MONETAG_DEFAULTS
  const on = list.filter(f => f.on !== false)
  const link = list.find(f => f.format === 'smartlink')
  const url = link ? (link.on !== false ? String(link.code).trim() : '') : MONETAG_DIRECT_LINK
  return { scripts: on.filter(f => f.format !== 'smartlink').map(f => String(f.code).trim()), link: /^https?:\/\/\S+$/i.test(url) ? url : '' }
}
export function useMonetag() {
  const s = useSettings(), consent = useConsent()
  const allowed = Boolean(s.__loaded) && s.monetag_enabled !== false && (!s.ads_require_consent || consent === 'all')
  const f = monetagFormats(s)
  return { allowed, scripts: allowed ? f.scripts : [], link: allowed ? f.link : '' }
}

// A page (for example a blog post with "Show ads" switched off) can turn the automatic ads off for itself.
let pageOff = false
const offListeners = new Set()
export function setPageAdsOff(v) { v = Boolean(v); if (pageOff === v) return; pageOff = v; offListeners.forEach(f => f(v)) }
export function usePageAdsOff() {
  const [v, setV] = useState(pageOff)
  useEffect(() => { offListeners.add(setV); setV(pageOff); return () => { offListeners.delete(setV) } }, [])
  return v
}
export function useSetPageAdsOff(off) { useEffect(() => { setPageAdsOff(off); return () => setPageAdsOff(false) }, [off]) }

// Automatic in-content units (shown inside posts / mod descriptions when no unit is set up for that spot).
export function useAutoUnits() {
  const { link } = useMonetag()
  const off = usePageAdsOff()
  if (!link || off) return []
  return [{ id: 'auto-direct', slot_key: 'auto-direct', name: 'Auto direct link', kind: 'direct_link', link_url: link, link_style: 'card', link_label: AUTO_AD_COPY[0].title, link_text: AUTO_AD_COPY[0].text, position_after: 3, repeat_every: 5, label: 'Advertisement' }]
}
