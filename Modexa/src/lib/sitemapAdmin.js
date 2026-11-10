import { supabase } from './supabase'
import { PUBLIC_SITE_URL } from './publicConfig'
// Admin helper: add / remove ONE page in the live sitemap.xml with a single click.
// The sitemap is stored in site_settings.sitemap_xml. If no custom sitemap exists yet, we start from the
// auto-generated one of the last build (/sitemap.default.xml) so nothing already listed is lost.
const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const today = () => new Date().toISOString().slice(0, 10)
export const normPath = p => '/' + String(p || '').replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+|\/+$/g, '')
const EMPTY = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${NS}">\n</urlset>\n`
const MISSING = 'Database is missing the sitemap column. Run supabase/v12_seo_files_head.sql in Supabase first.'

async function readCurrent() {
  const { data, error } = await supabase.from('site_settings').select('sitemap_xml').eq('id', 1).maybeSingle()
  if (error) throw new Error(/column|schema/i.test(error.message) ? MISSING : error.message)
  const custom = String(data?.sitemap_xml || '').trim()
  if (custom) return { xml: custom, custom: true }
  try { const r = await fetch('/sitemap.default.xml', { cache: 'no-store' }); if (r.ok) { const t = await r.text(); if (/<urlset[\s>]/i.test(t)) return { xml: t.trim(), custom: false } } } catch {}
  return { xml: EMPTY.trim(), custom: false }
}
function parse(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('The saved sitemap is not valid XML. Fix it in Robots & Sitemap first.')
  if (doc.documentElement.nodeName !== 'urlset') throw new Error('The saved sitemap is a sitemap index. Edit it in Robots & Sitemap instead.')
  const locs = [...doc.getElementsByTagNameNS('*', 'loc')].map(n => (n.textContent || '').trim()).filter(Boolean)
  return locs
}
const originOf = locs => { for (const l of locs) { try { const u = new URL(l); if (!/yourdomain/i.test(u.host)) return u.origin } catch {} } return (PUBLIC_SITE_URL || (typeof location !== 'undefined' ? location.origin : '')).replace(/\/$/, '') }
const pathsOf = locs => new Set(locs.map(l => { try { return normPath(new URL(l).pathname) } catch { return normPath(l) } }))

export async function getSitemapState() {
  const { xml, custom } = await readCurrent(), locs = parse(xml)
  return { paths: pathsOf(locs), origin: originOf(locs), custom }
}

let chain = Promise.resolve()
// add = true → make sure the page is listed; add = false → remove it. Calls run one after another so quick double clicks never overwrite each other.
export function setInSitemap(path, add) {
  const run = async () => {
    const { xml } = await readCurrent(), locs = parse(xml), origin = originOf(locs), p = normPath(path), url = origin + (p === '/' ? '/' : p)
    const has = pathsOf(locs).has(p)
    let next = xml
    if (add && !has) {
      const i = xml.toLowerCase().lastIndexOf('</urlset>'); if (i < 0) throw new Error('Sitemap has no </urlset> tag.')
      next = xml.slice(0, i).replace(/\s*$/, '\n') + `  <url><loc>${esc(url)}</loc><lastmod>${today()}</lastmod></url>\n` + xml.slice(i)
    } else if (!add && has) {
      const variants = [url, url + '/', url.replace(/\/$/, '')].map(u => reEsc(esc(u)))
      next = xml.replace(new RegExp(`[ \\t]*<url>(?:(?!</url>)[\\s\\S])*?<loc>\\s*(?:${variants.join('|')})\\s*</loc>[\\s\\S]*?</url>[ \\t]*\\r?\\n?`, 'i'), '')
    } else return { changed: false, url, paths: pathsOf(locs) }
    const locs2 = parse(next)
    if (new Blob([next]).size > 500 * 1024) throw new Error('Sitemap is too large (max 500 KB).')
    const { error } = await supabase.from('site_settings').update({ sitemap_xml: next }).eq('id', 1)
    if (error) throw new Error(/column|schema/i.test(error.message) ? MISSING : error.message)
    return { changed: true, url, paths: pathsOf(locs2) }
  }
  const p = chain.then(run, run); chain = p.catch(() => {}); return p
}

// Batch edit used by "Hide / Unhide page": remove every URL for which removeIf(path) is true and add the given paths, in ONE save.
export function editSitemap({ add = [], removeIf = null } = {}) {
  const run = async () => {
    const { xml } = await readCurrent(), locs = parse(xml), origin = originOf(locs)
    let next = xml, removed = 0, added = 0
    if (removeIf) next = next.replace(/[ \t]*<url>[\s\S]*?<\/url>[ \t]*\r?\n?/gi, blk => {
      const m = /<loc>\s*([^<]+?)\s*<\/loc>/i.exec(blk); if (!m) return blk
      let p; try { p = normPath(new URL(m[1].replace(/&amp;/g, '&')).pathname) } catch { p = normPath(m[1]) }
      if (removeIf(p)) { removed++; return '' } return blk
    })
    const have = pathsOf(parse(next)); let ins = ''
    for (const raw of add) { const p = normPath(raw); if (have.has(p)) continue; have.add(p); added++; ins += `  <url><loc>${esc(origin + (p === '/' ? '/' : p))}</loc><lastmod>${today()}</lastmod></url>\n` }
    if (ins) { const i = next.toLowerCase().lastIndexOf('</urlset>'); if (i < 0) throw new Error('Sitemap has no </urlset> tag.'); next = next.slice(0, i).replace(/\s*$/, '\n') + ins + next.slice(i) }
    if (!removed && !added) return { changed: false, removed, added }
    parse(next)
    if (new Blob([next]).size > 500 * 1024) throw new Error('Sitemap is too large (max 500 KB).')
    const { error } = await supabase.from('site_settings').update({ sitemap_xml: next }).eq('id', 1)
    if (error) throw new Error(/column|schema/i.test(error.message) ? MISSING : error.message)
    return { changed: true, removed, added }
  }
  const p = chain.then(run, run); chain = p.catch(() => {}); return p
}

// ---- default behaviour: every published page is added automatically; pages removed by hand stay removed ----
const PREFS = 'sitemap_prefs'
async function readRemoved() {
  const { data } = await supabase.from('site_content').select('data').eq('key', PREFS).maybeSingle()
  return new Set(Array.isArray(data?.data?.removed) ? data.data.removed : [])
}
export async function markSitemapRemoved(path, removed) {
  const set = await readRemoved(), p = normPath(path)
  if (removed) set.add(p); else set.delete(p)
  await supabase.from('site_content').upsert({ key: PREFS, data: { removed: [...set] }, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}
export async function autoAddToSitemap(path) {
  const p = normPath(path); if ((await readRemoved()).has(p)) return { added: false, skipped: true }
  const r = await setInSitemap(p, true); return { added: r.changed, skipped: false }
}
