// International SEO core: language list, URL helpers (/id/blog/slug), and the translations store used by the public site.
// English stays at the normal URL (no prefix). Every other language lives under its own prefix.
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, supabaseConfigured } from './supabase'
import { useSettings } from './useSettings'

export const DEFAULT_LANG = 'en'
export const EN = { code: 'en', name: 'English', native: 'English', hreflang: 'en', locale: 'en_US', dir: 'ltr' }
// Order = priority for traffic and revenue. "hi" is Hindi written in the Roman alphabet (Hinglish).
export const LANGS = [
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', hreflang: 'id', locale: 'id_ID', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese (Brazil)', native: 'Português (Brasil)', hreflang: 'pt-BR', locale: 'pt_BR', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', hreflang: 'es', locale: 'es_ES', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', hreflang: 'ar', locale: 'ar_AR', dir: 'rtl' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', hreflang: 'tr', locale: 'tr_TR', dir: 'ltr' },
  { code: 'hi', name: 'Hindi (Hinglish)', native: 'Hinglish (Roman Hindi)', hreflang: 'hi-Latn', locale: 'hi_IN', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', hreflang: 'vi', locale: 'vi_VN', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', hreflang: 'bn', locale: 'bn_IN', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', native: 'اردو', hreflang: 'ur', locale: 'ur_PK', dir: 'rtl' },
  { code: 'th', name: 'Thai', native: 'ไทย', hreflang: 'th', locale: 'th_TH', dir: 'ltr' },
]
export const ALL_LANG_CODES = LANGS.map(l => l.code)
export const langInfo = code => LANGS.find(l => l.code === code) || EN

// '/id/blog/x?y#z' → { lang: 'id', path: '/blog/x' }.  '/blog/x' → { lang: 'en', path: '/blog/x' }
export function splitPath(pathname = '/') {
  const m = /^\/([a-z]{2})(\/.*)?$/.exec(pathname)
  if (m && ALL_LANG_CODES.includes(m[1])) return { lang: m[1], path: m[2] || '/' }
  return { lang: DEFAULT_LANG, path: pathname || '/' }
}
export function withLang(path, lang) {
  if (!lang || lang === DEFAULT_LANG) return path || '/'
  const m = /^([^?#]*)(.*)$/.exec(path || '/'), p = m[1] || '/'
  return '/' + lang + (p === '/' ? '' : p) + m[2]
}
// the language of the page being viewed (uses the real URL)
export function useLang() { return splitPath(useLocation().pathname).lang }
// languages switched on in Admin → Languages
export function useEnabledLangs() {
  const s = useSettings()
  return useMemo(() => {
    if (!s.i18n_enabled) return []
    const on = Array.isArray(s.i18n_langs) ? s.i18n_langs : []
    return LANGS.filter(l => on.includes(l.code))
  }, [s.i18n_enabled, s.i18n_langs])
}

// ---------- translations store (one request per language, shared by the whole app) ----------
const cache = {}, subs = new Set(), notify = () => subs.forEach(f => f())
function loadLang(lang) {
  if (!supabaseConfigured || cache[lang]) return
  cache[lang] = { map: null }
  supabase.from('translations').select('kind,item_key,data').eq('lang', lang).range(0, 4999).then(({ data, error }) => {
    if (error) console.error('Modexa: could not load translations', error.message)
    const map = {}; (data || []).forEach(r => { map[r.kind + ':' + r.item_key] = r.data || {} })
    cache[lang] = { map }; notify()
  })
}
export function clearTrCache(lang) { if (lang) delete cache[lang]; else for (const k of Object.keys(cache)) delete cache[k]; itemCache.clear(); notify() }
function useTick() { const [, set] = useState(0); useEffect(() => { const f = () => set(n => n + 1); subs.add(f); return () => { subs.delete(f) } }, []) }
// { 'post:<id>': {...}, 'mod:<id>': {...}, 'content:home': {...}, 'ui:ui': {...} } for one language, or null (English / still loading)
export function useTrMap(lang) {
  useTick()
  useEffect(() => { if (lang !== DEFAULT_LANG) loadLang(lang) }, [lang])
  return lang === DEFAULT_LANG ? null : (cache[lang]?.map || null)
}
// interface words: t('Apps') → 'Aplikasi'
export function useT() {
  const lang = useLang(), map = useTrMap(lang), ui = map?.['ui:ui']
  return useMemo(() => s => (ui && typeof ui[s] === 'string' && ui[s].trim()) ? ui[s] : s, [ui])
}
// translated site pages (home, listings, nav): the translation replaces the English fields it has
export function overlayContent(content, tr) {
  if (!tr || typeof tr !== 'object') return content
  const out = { ...content }
  for (const [k, v] of Object.entries(tr)) if (v !== undefined && v !== null && v !== '') out[k] = v
  return out
}

const s = v => (typeof v === 'string' && v.trim() ? v : undefined), arr = v => (Array.isArray(v) && v.length ? v : undefined)
export function overlayMod(m, d) {
  if (!d) return { ...m, _tr: false }
  return { ...m, _tr: true, title: s(d.title) || m.title, short: s(d.excerpt) || m.short, description: s(d.content) || m.description, content: s(d.content) || m.content,
    features: arr(d.features) || m.features, requirements: arr(d.requirements) || m.requirements, install: arr(d.install) || m.install, faqs: arr(d.faqs) || m.faqs,
    seo_title: s(d.seo_title) || '', seo_description: s(d.seo_description) || '', og_title: s(d.og_title) || '', og_description: s(d.og_description) || '' }
}
export function overlayPost(p, d) {
  if (!d) return { ...p, _tr: false }
  return { ...p, _tr: true, title: s(d.title) || p.title, excerpt: s(d.excerpt) || p.excerpt, content: s(d.content) || p.content, faqs: arr(d.faqs) || p.faqs,
    seo_title: s(d.seo_title) || '', seo_description: s(d.seo_description) || '', og_title: s(d.og_title) || '', og_description: s(d.og_description) || '' }
}

// which languages exist for one item (used for hreflang links)
const itemCache = new Map()
export function useItemLangs(kind, key) {
  const [langs, setLangs] = useState(() => itemCache.get(kind + ':' + key) || [])
  useEffect(() => {
    if (!kind || !key || !supabaseConfigured) { setLangs([]); return }
    const id = kind + ':' + key; if (itemCache.has(id)) { setLangs(itemCache.get(id)); return }
    let alive = true
    supabase.from('translations').select('lang').eq('kind', kind).eq('item_key', String(key)).then(({ data }) => { const l = (data || []).map(r => r.lang); itemCache.set(id, l); if (alive) setLangs(l) })
    return () => { alive = false }
  }, [kind, key])
  return langs
}
