import DOMPurify from 'dompurify'
import { isHtml, mdToHtml } from './formatText'
import { slugify } from './format'

export const toHtml = content => isHtml(content) ? String(content) : mdToHtml(content)
const EMBED = new Set(['SCRIPT', 'INS', 'NOSCRIPT', 'IFRAME'])
const isEmptyHook = n => n.nodeType === 1 && n.tagName === 'DIV' && n.id && !n.children.length && !n.textContent.trim()
const isEmbedNode = n => n.nodeType === 1 && (EMBED.has(n.tagName) || isEmptyHook(n))
const isBlankText = n => n.nodeType === 3 && !n.textContent.trim()
export function guessSize(code) {
  const w = /['"]?width['"]?\s*[:=]\s*['"]?(\d{2,4})/i.exec(code), h = /['"]?height['"]?\s*[:=]\s*['"]?(\d{2,4})/i.exec(code)
  const W = w && +w[1] >= 40 && +w[1] <= 1200 ? +w[1] : 0, H = h && +h[1] >= 30 && +h[1] <= 1200 ? +h[1] : 0
  return { w: W, h: H || 250 }
}
export const encodeCode = c => encodeURIComponent(c)
export const decodeCode = c => { try { return decodeURIComponent(c || '') } catch { return c || '' } }
export function embedHtml(code, w, h) { const g = guessSize(code); return `<div class="mx-embed" data-w="${w ?? g.w}" data-h="${h ?? g.h}" data-code="${encodeCode(code)}"></div>` }

// Raw <script>/<ins>/<iframe> runs pasted into the HTML view become one "embed" block (shown as a chip in Compose, executed on the site).
export function wrapEmbeds(html) {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html'), body = doc.body
  body.querySelectorAll('p').forEach(p => { const kids = [...p.childNodes].filter(n => !isBlankText(n)); if (kids.length && kids.every(isEmbedNode) && kids.some(n => EMBED.has(n.tagName))) p.replaceWith(...kids) })
  const out = []; let run = []
  const flush = () => {
    if (!run.length) return
    if (run.some(n => EMBED.has(n.tagName))) { const code = run.map(n => n.outerHTML).join(''); out.push(embedHtml(code)) } else run.forEach(n => out.push(n.outerHTML))
    run = []
  }
  for (const n of [...body.childNodes]) {
    if (isEmbedNode(n) || (run.length && isBlankText(n))) { run.push(n); continue }
    flush()
    if (n.nodeType === 1) out.push(n.classList?.contains('mx-embed') ? n.outerHTML : (n.querySelector && n.querySelector('script') && !n.classList.contains('mx-embed') ? scriptsToEmbeds(n) : n.outerHTML))
    else if (n.nodeType === 3 && n.textContent.trim()) out.push(`<p>${n.textContent}</p>`)
  }
  flush(); return out.join('\n')
}
function scriptsToEmbeds(el) { // <div> that wraps ad code: keep the wrapper's code together as one embed
  const code = el.outerHTML; return embedHtml(code)
}
export function contentHeadings(content) { return [...toHtml(content).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean) }
export const headingSlug = t => 'h-' + slugify(t)

// -> parts: { html } | { ad: key } | { embed: {code,w,h} } | { units: [...] } (auto in-content ads)
export function buildParts(content, { inContent = [] } = {}) {
  const html = wrapEmbeds(toHtml(content))
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html')
  const total = [...doc.body.children].filter(n => n.tagName === 'P' && n.textContent.trim()).length
  const points = new Map()
  inContent.forEach(u => { let n = u.position_after || 3, reps = 0; while (n < total && reps < 12) { points.set(n, [...(points.get(n) || []), u]); if (!u.repeat_every) break; n += u.repeat_every; reps++ } })
  const parts = []; let buf = '', p = 0
  const flush = () => { if (buf) { parts.push({ html: buf }); buf = '' } }
  for (const n of [...doc.body.childNodes]) {
    if (n.nodeType === 3) { if (n.textContent.trim()) buf += `<p>${n.textContent}</p>`; continue }
    if (n.nodeType !== 1) continue
    if (n.classList.contains('mx-ad')) { flush(); parts.push({ ad: (n.getAttribute('data-ad') || '').toLowerCase() }); continue }
    if (n.classList.contains('mx-embed')) { flush(); parts.push({ embed: { code: decodeCode(n.getAttribute('data-code')), w: +n.getAttribute('data-w') || 0, h: +n.getAttribute('data-h') || 250 } }); continue }
    if (n.tagName === 'H2' && !n.id) n.id = headingSlug(n.textContent)
    buf += DOMPurify.sanitize(n.outerHTML, { ADD_ATTR: ['target', 'rel', 'data-wait', 'loading'], ADD_TAGS: ['figure', 'figcaption'] })
    if (n.tagName === 'P' && n.textContent.trim()) { p++; if (points.has(p)) { flush(); parts.push({ units: points.get(p) }) } }
  }
  flush(); return parts
}
