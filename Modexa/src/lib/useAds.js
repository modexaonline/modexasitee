import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, supabaseConfigured } from './supabase'
import { useSettings } from './useSettings'
import { useConsent } from './consent'
import { useAdsControl, consentOk, isPathAdsOff } from './adsControl'
import { useAdsterra, BANNER_SIZES } from './adsterra'
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

// All direct links that may be shown as cards right now (Monetag + Adsterra, each only when its network is ON and cookie rules allow).
export function useAutoLinks() {
  const m = useMonetag(), a = useAdsterra()
  return [m.link && { network: 'monetag', url: m.link }, a.link && { network: 'adsterra', url: a.link }].filter(Boolean)
}

const bannerUnit = (k, code) => { const [w, h] = BANNER_SIZES[k]; return { id: 'auto-' + k, slot_key: 'auto-' + k, name: 'Auto banner ' + w + 'x' + h, kind: 'banner', size: 'custom', custom_width: w, custom_height: h, render_mode: 'isolated', code, label: 'Advertisement' } }
const SLOT_BANNERS = {
  top: { d: ['banner728x90'], m: [] }, bottom: { d: ['banner300x250'], m: ['banner300x250'] },
  home_middle: { d: ['banner728x90'], m: ['banner300x250'] }, mod_bottom: { d: ['banner300x250'], m: ['banner300x250'] },
  mod_sidebar: { d: ['banner160x300'], m: ['banner160x300'] }, 'article-end': { d: ['banner300x250'], m: ['banner300x250'] },
}
const KEY = { banner728x90: 'b728', banner300x250: 'b300', banner160x300: 'b160' }
// Adsterra banners for a fixed spot on a page (empty when Adsterra is OFF, the page is OFF or cookies are not accepted).
export function useAutoBanners(slot) {
  const a = useAdsterra(), off = usePageAdsOff(), desktop = useMediaQuery('(min-width: 768px)')
  if (off || !a.enabled) return []
  const want = (SLOT_BANNERS[slot] || { d: [], m: [] })[desktop ? 'd' : 'm']
  return want.filter(k => a.banners[KEY[k]]).map(k => bannerUnit(k, a.banners[KEY[k]]))
}

// Automatic in-content units (shown inside posts / mod descriptions when no unit is set up for that spot):
// Monetag card after paragraph 3, 300x250 banner after 5, Adsterra card after 7, native banner after 10.
export function useAutoUnits() {
  const links = useAutoLinks(), a = useAdsterra(), off = usePageAdsOff()
  if (off) return []
  const units = []
  links.forEach((l, i) => units.push({ id: 'auto-link-' + l.network, slot_key: 'auto-link-' + l.network, name: 'Auto direct link', kind: 'direct_link', link_url: l.url, link_style: 'card', link_label: AUTO_AD_COPY[(i * 2) % AUTO_AD_COPY.length].title, link_text: AUTO_AD_COPY[(i * 2) % AUTO_AD_COPY.length].text, position_after: i === 0 ? 3 : 7, repeat_every: 9, label: 'Advertisement' }))
  if (a.banners.b300) units.push({ ...bannerUnit('banner300x250', a.banners.b300), position_after: 5, repeat_every: 8 })
  if (a.native) units.push({ id: 'auto-native', slot_key: 'auto-native', name: 'Auto native banner', kind: 'native', size: 'responsive', custom_height: 120, render_mode: 'inline', code: a.native, position_after: 10, label: 'Advertisement' })
  return units
}
