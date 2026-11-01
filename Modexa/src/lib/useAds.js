import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, supabaseConfigured } from './supabase'
import { useSettings } from './useSettings'
import { useConsent } from './consent'
import { useAdsControl, consentOk, isPathAdsOff } from './adsControl'
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

// Manual ad units are shown only when the master switch is ON. Cookie rules (per kind) and per-page switches are applied in useAdUnits.
export function useAdsAllowed() {
  return Boolean(useSettings().ads_enabled)
}

export function useAdUnits(placement, ctx = {}, opts = {}) {
  const allowed = useAdsAllowed(), ctl = useAdsControl(), consent = useConsent(), pageOff = usePageAdsOff()
  const [s, setS] = useState(state)
  const desktop = useMediaQuery('(min-width: 768px)')
  useEffect(() => { if (!allowed) return; listeners.add(setS); setS(state); load(); return () => { listeners.delete(setS) } }, [allowed])
  if (!allowed || !ctl.ready || (pageOff && !opts.ignorePageOff)) return []
  const okScripts = consentOk(ctl.scripts, consent), okCards = consentOk(ctl.cards, consent)
  const { postSlug = '', gameSlug = '' } = ctx
  return s.items.filter(u => {
    if (!(u.kind === 'direct_link' ? okCards : okScripts)) return false
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
  const s = useSettings(), consent = useConsent(), ctl = useAdsControl()
  const allowed = ctl.ready && s.monetag_enabled !== false
  const f = monetagFormats(s)
  return { allowed, scripts: allowed && consentOk(ctl.scripts, consent) ? f.scripts : [], link: allowed && consentOk(ctl.cards, consent) ? f.link : '' }
}

// Ads are OFF for a page when (a) Admin → Page manager has it switched off, or (b) it is a post with "Show ads on this post" unticked.
let postOff = false
const offListeners = new Set()
export function setPageAdsOff(v) { v = Boolean(v); if (postOff === v) return; postOff = v; offListeners.forEach(f => f(v)) }
export function usePageAdsOff() {
  const { pathname } = useLocation(), ctl = useAdsControl()
  const [post, setPost] = useState(postOff)
  useEffect(() => { offListeners.add(setPost); setPost(postOff); return () => { offListeners.delete(setPost) } }, [])
  return post || (ctl.ready && isPathAdsOff(ctl.pagesOff, pathname))
}
export function useSetPageAdsOff(off) { useEffect(() => { setPageAdsOff(off); return () => setPageAdsOff(false) }, [off]) }

// Automatic in-content units (shown inside posts / mod descriptions when no unit is set up for that spot).
export function useAutoUnits() {
  const { link } = useMonetag()
  const off = usePageAdsOff()
  if (!link || off) return []
  return [{ id: 'auto-direct', slot_key: 'auto-direct', name: 'Auto direct link', kind: 'direct_link', link_url: link, link_style: 'card', link_label: AUTO_AD_COPY[0].title, link_text: AUTO_AD_COPY[0].text, position_after: 3, repeat_every: 5, label: 'Advertisement' }]
}
