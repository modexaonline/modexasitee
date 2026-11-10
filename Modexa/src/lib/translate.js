// Admin-side translation helpers: split content into safe pieces, call the ai-translate Edge Function, save to the `translations` table.
import { supabase } from './supabase'
import { LANGS } from './i18n'
import { UI_STRINGS } from './uiStrings'
import { LISTING } from '../content/seo'
import { HOME_DEFAULT, NAV_DEFAULT, mergeContent } from '../content/merge'

const SKIP_KEYS = new Set(['to', 'url', 'link', 'href', 'src', 'image', 'img', 'icon', 'slug', 'id', 'key', 'path', 'class', 'className', 'type', 'buttonLink', 'color', 'platform_url', 'canonical_url'])
const CHUNK = 5000, BATCH_ITEMS = 25, BATCH_CHARS = 12000
const URLISH = /^(https?:)?\/\/|^\/[\w\-./#?=&%]*$|^[\w.+-]+@[\w-]+\.[\w.]+$|^#[0-9a-f]{3,8}$|^[\d\s.,:%+-]*$/i
const textOK = s => typeof s === 'string' && s.trim() && /\p{L}/u.test(s) && !URLISH.test(s.trim()) && !/^\[ad:[\w-]+\]$/i.test(s.trim())

export const hashOf = obj => { const s = JSON.stringify(obj || {}); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36) }

function collect(v, path, out) {
  if (typeof v === 'string') { if (textOK(v)) out.push({ path, text: v }); return }
  if (Array.isArray(v)) { v.forEach((x, i) => collect(x, [...path, i], out)); return }
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (SKIP_KEYS.has(k) || k.startsWith('__')) continue; collect(x, [...path, k], out) }
}
function split(text) {   // long HTML or markdown is cut at paragraph boundaries so each call stays small
  if (text.length <= CHUNK) return [text]
  const parts = text.includes('<') ? text.split(/(?<=<\/(?:p|h[1-6]|ul|ol|blockquote|table|div|section)>)/i) : text.split(/(?<=\n\n)/)
  const out = []; let cur = ''
  for (const p of parts) { if (cur && cur.length + p.length > CHUNK) { out.push(cur); cur = '' } cur += p }
  if (cur) out.push(cur); return out
}
const setPath = (obj, path, val) => { let o = obj; for (let i = 0; i < path.length - 1; i++) o = o[path[i]]; o[path[path.length - 1]] = val }
const clone = v => JSON.parse(JSON.stringify(v))
const noDash = s => String(s).replace(/\s*—\s*/g, ', ')

async function callTranslate(lang, texts) {
  if (!supabase) throw new Error('Supabase is not connected.')
  const { data, error } = await supabase.functions.invoke('ai-translate', { body: { lang, texts } })
  if (error) {
    let msg = error.message
    try { const t = await error.context?.text?.(); try { const j = JSON.parse(t); if (j?.error) msg = j.error; else if (t) msg = t.slice(0, 300) } catch { if (t) msg = t.slice(0, 300) } } catch {}
    throw new Error(msg || 'Translation failed.')
  }
  if (!Array.isArray(data?.texts)) throw new Error(data?.error || 'Translation returned nothing.')
  return data.texts
}

// Translate every human-readable string inside `obj` (links, ids and slugs stay as they are). Returns a new object.
export async function translateObject(lang, obj, { signal } = {}) {
  const items = []; collect(obj, [], items)
  const pieces = []; items.forEach((it, i) => split(it.text).forEach((t, n, a) => pieces.push({ i, n, parts: a.length, text: t })))
  const res = new Array(pieces.length)
  let from = 0
  while (from < pieces.length) {
    if (signal?.aborted) throw new Error('Stopped.')
    let to = from, chars = 0
    while (to < pieces.length && to - from < BATCH_ITEMS && (to === from || chars + pieces[to].text.length <= BATCH_CHARS)) { chars += pieces[to].text.length; to++ }
    const out = await callTranslate(lang, pieces.slice(from, to).map(p => p.text))
    out.forEach((t, k) => { res[from + k] = t }); from = to
  }
  const joined = items.map(() => ''); pieces.forEach((p, k) => { joined[p.i] += res[k] })
  const copy = clone(obj); items.forEach((it, i) => setPath(copy, it.path, noDash(joined[i]))); return copy
}

// ---------- what gets translated ----------
export const POST_FIELDS = ['title', 'excerpt', 'content', 'seo_title', 'seo_description', 'og_title', 'og_description', 'faqs']
export const MOD_FIELDS = [...POST_FIELDS, 'features', 'requirements', 'install']
export function sourceOf(kind, row) {
  const o = {}; for (const k of (kind === 'mod' ? MOD_FIELDS : POST_FIELDS)) { const v = row?.[k]; if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) continue; o[k] = v }
  return o
}
export const CONTENT_KEYS = ['nav', 'home', 'listing:apps', 'listing:games', 'listing:guide', 'listing:blog']
export function contentSource(key, siteContent = {}) {
  const strip = o => { const c = { ...o }; for (const k of Object.keys(c)) if (k.startsWith('__')) delete c[k]; return c }
  if (key === 'nav') return strip(mergeContent(NAV_DEFAULT, siteContent.nav))
  if (key === 'home') return strip(mergeContent({ ...LISTING.home, ...HOME_DEFAULT }, siteContent.home))
  const k = key.replace('listing:', ''); return strip(mergeContent(LISTING[k] || {}, siteContent[key]))
}
export const uiSource = () => Object.fromEntries(UI_STRINGS.map(s => [s, s]))

// ---------- database ----------
export async function fetchRows(kind, keys) {
  let q = supabase.from('translations').select('kind,item_key,lang,edited,src_hash,updated_at').eq('kind', kind).range(0, 4999)
  if (keys?.length === 1) q = q.eq('item_key', String(keys[0]))
  const { data, error } = await q; if (error) throw new Error(error.message)
  return data || []
}
export async function fetchRow(kind, key, lang) {
  const { data, error } = await supabase.from('translations').select('*').eq('kind', kind).eq('item_key', String(key)).eq('lang', lang).maybeSingle()
  if (error) throw new Error(error.message); return data
}
export async function saveRow(kind, key, lang, data, hash, edited = false) {
  const { error } = await supabase.from('translations').upsert({ kind, item_key: String(key), lang, data, src_hash: hash, edited, updated_at: new Date().toISOString() }, { onConflict: 'kind,item_key,lang' })
  if (error) throw new Error(/relation|schema|translations/i.test(error.message) ? 'Run supabase/v22_international_translations.sql in Supabase first.' : error.message)
}
export async function deleteRow(kind, key, lang) { const { error } = await supabase.from('translations').delete().eq('kind', kind).eq('item_key', String(key)).eq('lang', lang); if (error) throw new Error(error.message) }

// Translate one thing into one language and save it. Skips hand-edited translations and ones that are already up to date, unless force.
export async function translateAndSave(kind, key, lang, source, { force = false, signal } = {}) {
  const hash = hashOf(source)
  if (!Object.keys(source).length) return 'empty'
  if (!force) { const row = await fetchRow(kind, key, lang); if (row && (row.edited || row.src_hash === hash)) return row.edited ? 'edited' : 'fresh' }
  const data = await translateObject(lang, source, { signal })
  await saveRow(kind, key, lang, data, hash, false); return 'done'
}
export const langName = code => LANGS.find(l => l.code === code)?.name || code
