import { PUBLIC_SITE_URL } from './publicConfig'
// Links that point to our own site are normal followed links: no sponsored, no nofollow, no countdown, same tab.
const hostOf = u => { try { return new URL(u).host.toLowerCase() } catch { return '' } }
const SITE = hostOf(PUBLIC_SITE_URL)
const OWN = new Set([SITE, SITE.replace(/^www\./, ''), 'www.' + SITE.replace(/^www\./, '')].filter(Boolean))
export function isInternalHref(h) {
  h = String(h || '').trim(); if (!h) return false
  if (h.startsWith('#')) return true
  if (/^\/(?!\/)/.test(h)) return true
  if (!/^https?:\/\//i.test(h)) return false
  const host = hostOf(h); if (OWN.has(host)) return true
  try { return typeof location !== 'undefined' && !!location.host && host === location.host.toLowerCase() } catch { return false }
}
export function fixAnchors(root) {
  root.querySelectorAll?.('a[href]').forEach(a => {
    if (!isInternalHref(a.getAttribute('href'))) return
    a.removeAttribute('rel'); a.removeAttribute('target'); a.removeAttribute('data-wait')
  })
  return root
}
// string -> string, used when a post is saved (and by the editor). Only re-serialises when an internal link needs fixing.
export function fixInternalLinksHtml(html) {
  const s = String(html || '')
  if (!/<a\s[^>]*href=/i.test(s) || typeof DOMParser === 'undefined') return s
  const doc = new DOMParser().parseFromString('<body>' + s + '</body>', 'text/html'), before = doc.body.innerHTML
  let touched = false
  doc.body.querySelectorAll('a[href]').forEach(a => { if (isInternalHref(a.getAttribute('href')) && (a.hasAttribute('rel') || a.hasAttribute('target') || a.hasAttribute('data-wait'))) touched = true })
  if (!touched) return s
  fixAnchors(doc.body); return doc.body.innerHTML
}
