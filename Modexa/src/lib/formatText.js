import { isInternalHref } from './linkRel'
// Pure helpers (no DOM) used by the editor, the public renderer and tests.
// RULE: formatting may add/remove whitespace and structure (headings, paragraphs, lists) but NEVER changes a word.
const ZW = /[\u200B-\u200D\uFEFF]/g
export const escapeHtml = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const QWORD = /^(what|how|why|is|are|can|should|which|when|who|do|does|did|will|where|could|would|was|were|has|have)\b/i
const ABBR = /^(e\.g|i\.e|vs|etc|mr|mrs|ms|dr|prof|no|fig|inc|ltd|u\.s|u\.k|st|approx|a\.m|p\.m)\.$/i
const SMALL = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'vs', 'is', 'are', 'how', 'what', 'why', 'your', 'you'])

export function htmlToPlain(html = '') { return String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim() }
export const wordCount = html => { const t = htmlToPlain(html); return t ? t.split(/\s+/).length : 0 }

export function splitSentences(text) {
  const words = String(text).split(/\s+/).filter(Boolean), out = []; let cur = []
  for (let i = 0; i < words.length; i++) {
    const w = words[i]; cur.push(w)
    const end = /[.!?]+["')\]”’]*$/.test(w), next = words[i + 1]
    if (end && next && /^["“(‘'\[]?[A-Z0-9]/.test(next) && !ABBR.test(w.replace(/["')\]”’]+$/, '')) && !/^[A-Z]\.$/.test(w) && !/\d\.\d/.test(w)) { out.push(cur.join(' ')); cur = [] }
  }
  if (cur.length) out.push(cur.join(' '))
  return out
}
const wordsOf = s => s.split(/\s+/).filter(Boolean)
const isQuestionHeading = s => /\?["”’)]*$/.test(s) && wordsOf(s).length <= 14 && QWORD.test(s)
function isTitleCase(s) { const w = wordsOf(s).filter(x => /[A-Za-z]/.test(x) && !SMALL.has(x.toLowerCase())); return w.length > 0 && w.filter(x => /^[A-Z0-9"“(]/.test(x)).length / w.length >= 0.6 }
const isAllCaps = s => /[A-Z]/.test(s) && s === s.toUpperCase() && wordsOf(s).length <= 14

function paragraphs(text) {
  const t = text.trim(); if (!t) return []
  if (t.length < 320 && !/\?\s+[A-Z]/.test(t)) return [`<p>${escapeHtml(t)}</p>`]
  const sentences = splitSentences(t), res = []; let cur = [], len = 0
  const flush = () => { if (cur.length) { res.push(`<p>${escapeHtml(cur.join(' '))}</p>`); cur = []; len = 0 } }
  for (const s of sentences) {
    if (isQuestionHeading(s)) { flush(); res.push(`<h2>${escapeHtml(s)}</h2>`); continue }
    cur.push(s); len += s.length
    if (cur.length >= 3 || len > 380) flush()
  }
  flush(); return res
}
// "Title Title Title … Title Title Title is a …" (title run into the first sentence): split where the opening words repeat.
function leadingTitle(text) {
  const toks = wordsOf(text); if (toks.length < 30) return null
  const norm = t => t.toLowerCase().replace(/[^a-z0-9]/g, ''), key = toks.slice(0, 3).map(norm).join(' ')
  if (!key.replace(/ /g, '')) return null
  for (let k = 4; k < Math.min(toks.length - 3, 32); k++) if (toks.slice(k, k + 3).map(norm).join(' ') === key) return { title: toks.slice(0, k).join(' '), rest: toks.slice(k).join(' ') }
  return null
}
function headingLevel(l) { return /:$/.test(l) || /^\d+\.\d+/.test(l) ? 3 : 2 }
function isHeadingLine(l, prev, next) {
  if (l.length > 110 || wordsOf(l).length > 16 || /[.,;]$/.test(l)) return false
  if (prev !== '' && prev !== undefined) return false
  if (next !== '' && next !== undefined && next.length < l.length * 0.8 && !/[.!?]$/.test(next)) return false
  return /\?$/.test(l) || /:$/.test(l) || isAllCaps(l) || isTitleCase(l) || /^(step|part|chapter|section|faq|conclusion|introduction|overview|summary|final thoughts|pros|cons|features|requirements|installation)\b/i.test(l)
}

export function autoFormatText(raw) {
  let text = String(raw ?? '').replace(/\r\n?/g, '\n').replace(ZW, '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/```[a-z]*\n?/gi, '').replace(/^\s*[-_=*~]{3,}\s*$/gm, '')
  text = text.replace(/^\s*(#{1,6})\s*[$%#]*\s*$/gm, '')
  const lines = text.split('\n').map(l => l.trim()), out = []
  const nonEmpty = lines.filter(Boolean)
  if (nonEmpty.length <= 2 && text.replace(/\s+/g, ' ').length > 500) {           // wall of text
    const flat = text.replace(/\s+/g, ' ').trim(), lt = leadingTitle(flat)
    if (lt) { out.push(`<h2>${escapeHtml(lt.title)}</h2>`); out.push(...paragraphs(lt.rest)) } else out.push(...paragraphs(flat))
    return out.join('\n')
  }
  let para = [], list = null
  const flushPara = () => { if (para.length) { out.push(...paragraphs(para.join(' '))); para = [] } }
  const flushList = () => { if (list) { out.push(`<${list.t}>${list.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</${list.t}>`); list = null } }
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]; let m
    if (!l) { flushPara(); flushList(); continue }
    if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { flushPara(); flushList(); out.push(`<h${m[1].length <= 2 ? 2 : 3}>${escapeHtml(m[2])}</h${m[1].length <= 2 ? 2 : 3}>`); continue }
    if ((m = l.match(/^[-*•–▪●]\s+(.*)$/))) { flushPara(); if (list?.t !== 'ul') { flushList(); list = { t: 'ul', items: [] } } list.items.push(m[1]); continue }
    if ((m = l.match(/^(\d{1,3})[.)]\s+(.*)$/))) { flushPara(); if (list?.t !== 'ol') { flushList(); list = { t: 'ol', items: [] } } list.items.push(m[2]); continue }
    flushList()
    if (isHeadingLine(l, lines[i - 1], lines[i + 1])) { flushPara(); const lv = headingLevel(l); out.push(`<h${lv}>${escapeHtml(l)}</h${lv}>`); continue }
    para.push(l)
  }
  flushPara(); flushList()
  return out.join('\n')
}

// Markdown (legacy posts) -> HTML. Also understands [ad:key] and [btn:Label](url).
export function mdToHtml(md = '') {
  const inline = s => escapeHtml(s)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[btn:([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, l, u) => isInternalHref(u) ? `<a class="mx-btn mx-btn--green" href="${u}">${l}</a>` : `<a class="mx-btn mx-btn--green" href="${u}" data-wait="30" target="_blank" rel="sponsored nofollow noopener noreferrer">${l}</a>`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, l, u) => isInternalHref(u) ? `<a href="${u}">${l}</a>` : `<a href="${u}" target="_blank" rel="noopener noreferrer nofollow">${l}</a>`)
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  const out = []; let list = null, para = []
  const fp = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = [] } }, fl = () => { if (list) { out.push(`<${list.t}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null } }
  for (const raw of String(md).replace(/\r\n?/g, '\n').split('\n')) {
    const l = raw.trim(); let m
    if (!l) { fp(); fl(); continue }
    if ((m = l.match(/^\[ad:([a-z0-9-]+)\]$/i))) { fp(); fl(); out.push(`<div class="mx-ad" data-ad="${m[1].toLowerCase()}"></div>`); continue }
    if ((m = l.match(/^###\s+(.*)$/))) { fp(); fl(); out.push(`<h3>${inline(m[1])}</h3>`) }
    else if ((m = l.match(/^##\s+(.*)$/))) { fp(); fl(); out.push(`<h2>${inline(m[1])}</h2>`) }
    else if ((m = l.match(/^[-*•]\s+(.*)$/))) { fp(); if (list?.t !== 'ul') { fl(); list = { t: 'ul', items: [] } } list.items.push(m[1]) }
    else if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { fp(); if (list?.t !== 'ol') { fl(); list = { t: 'ol', items: [] } } list.items.push(m[1]) }
    else if ((m = l.match(/^>\s?(.*)$/))) { fp(); fl(); out.push(`<blockquote>${inline(m[1])}</blockquote>`) }
    else { fl(); para.push(l) }
  }
  fp(); fl(); return out.join('\n')
}
export const isHtml = s => /^\s*<(?:[a-z][a-z0-9-]*|!--)/i.test(String(s || ''))

// ───────── Bulk helpers for the admin: paste a whole block, get clean items. Words are never changed. ─────────
const BULLET = /^\s*(?:[-*•–—▪●◦►➤➜→✅✔✓☑️✔️]+|\[[ xX]?\]|\d{1,3}\s*[.):\-–]|(?:step|point)\s*\d{1,3}\s*[:.)\-–]?)\s+/i
const stripMd = s => String(s).replace(/\*\*|__/g, '').replace(/^#{1,6}\s*/, '').replace(/`/g, '').trim()

// Features / requirements / install steps. Accepts one-per-line, bulleted, numbered, "a; b; c" or "a, b, c".
export function cleanList(input) {
  let src = Array.isArray(input) ? input.join('\n') : String(input ?? '')
  src = src.replace(/\r\n?/g, '\n').replace(ZW, '').replace(/\u00a0/g, ' ')
  let rows = src.split('\n').map(l => l.trim()).filter(Boolean)
  if (rows.length === 1) {                                   // everything pasted on one line
    const one = rows[0]
    if (/\s\d{1,2}[.)]\s+\S/.test(' ' + one) && (one.match(/(?:^|\s)\d{1,2}[.)]\s/g) || []).length >= 2) rows = one.split(/\s+(?=\d{1,2}[.)]\s)/)
    else if (/[;•|]/.test(one)) rows = one.split(/\s*[;•|]\s*/)
    else if ((one.match(/,/g) || []).length >= 2 && one.split(',').every(p => p.trim().length <= 70)) rows = one.split(',')
  }
  const seen = new Set(), out = []
  for (let r of rows) {
    r = stripMd(r).replace(BULLET, '').replace(/^[\s\u2022\-–]+/, '').replace(/\s+/g, ' ').replace(/[;,]+$/, '').trim()
    if (!r) continue
    if (/:$/.test(r) && r.split(' ').length <= 4) continue  // lone label such as "Features:"
    const k = r.toLowerCase(); if (seen.has(k)) continue
    seen.add(k); out.push(r)
  }
  return out
}

// FAQs. Understands "Q: … A: …", "1. Question? answer", "Question?" on one line + answer lines below,
// "Question? Answer" on one line, and blank-line separated blocks. Returns [{q, a}].
export function parseFaqs(input) {
  const text = String(input ?? '').replace(/\r\n?/g, '\n').replace(ZW, '').replace(/\u00a0/g, ' ').replace(/^\s*[-_=*~]{3,}\s*$/gm, '')
  const QP = /^\s*(?:(?:q(?:uestion)?)\s*\d{0,3}\s*[:.)\-–]\s*|\d{1,3}\s*[.):\-–]\s+|[-*•–▪●➤►]\s+|#{1,6}\s+)/i
  const AP = /^\s*(?:a(?:ns(?:wer)?)?)\s*\d{0,3}\s*[:.)\-–]\s*/i
  const hasExplicitQ = /^\s*q(?:uestion)?\s*\d{0,3}\s*[:.)\-–]/im.test(text)
  const lines = text.split('\n').map(l => l.trim())
  const items = []; let cur = null
  const push = () => { if (cur) { const q = stripMd(cur.q).replace(/\s+/g, ' ').trim(), a = stripMd(cur.a.join(' ')).replace(/\s+/g, ' ').trim(); if (q && a) items.push({ q, a }) } cur = null }
  const isQ = l => { const t = stripMd(l.replace(QP, '')); return /\?["”’)]*$/.test(t) || (hasExplicitQ && /^\s*q(?:uestion)?\s*\d{0,3}\s*[:.)\-–]/i.test(l)) }
  for (const l of lines) {
    if (!l) { if (cur && cur.a.length) cur.gap = true; continue }
    if (AP.test(l) && cur) { cur.a.push(l.replace(AP, '')); continue }
    if (isQ(l)) { push(); cur = { q: l.replace(QP, ''), a: [] }; continue }
    // "Question? Answer on same line"
    const m = l.replace(QP, '').match(/^(.{6,200}?\?)["”’)]*\s+([A-Z0-9“"(].+)$/)
    if (m && (QP.test(l) || QWORD.test(m[1])) && (!cur || cur.gap || !cur.a.length)) { push(); cur = { q: m[1], a: [m[2]] }; continue }
    if (cur) cur.a.push(l)
    else cur = { q: l.replace(QP, ''), a: [] }               // first line without "?" = question
  }
  push()
  if (!items.length) {                                       // fallback: blocks split by blank lines, first line = question
    for (const b of text.split(/\n\s*\n/)) { const ls = b.split('\n').map(x => x.trim()).filter(Boolean); if (ls.length >= 2) items.push({ q: stripMd(ls[0].replace(QP, '')), a: stripMd(ls.slice(1).join(' ').replace(AP, '')) }) }
  }
  // everything on one line: "Q? A. Q2? A2." -> split inside the answer wherever a new question sentence starts
  const split = []
  for (const f of items) {
    let c = { q: f.q, a: [] }
    for (const sn of splitSentences(f.a)) { if (isQuestionHeading(sn)) { if (c.a.length) split.push({ q: c.q, a: c.a.join(' ') }); c = { q: sn, a: [] } } else c.a.push(sn) }
    if (c.a.length) split.push({ q: c.q, a: c.a.join(' ') })
  }
  const seen = new Set()
  return split.filter(f => { const k = f.q.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
}

// Paragraph text boxes. soft=true (used on paste) also joins hard-wrapped lines copied from PDFs/emails into one paragraph.
// Words never change; only spaces, line breaks and paragraph breaks do.
export function cleanParas(input, soft = false) {
  const text = String(input ?? '').replace(/\r\n?/g, '\n').replace(ZW, '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ')
  const blocks = text.split(/\n\s*\n/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(b => b.length)
  let out = blocks.map(b => soft ? [b.join(' ')] : [b.join('\n')]).flat()
  if (out.length === 1 && out[0].length > 700 && !/\n/.test(out[0])) {            // one huge wall of text -> paragraphs of ~3 sentences
    const res = []; let cur = [], len = 0
    for (const s of splitSentences(out[0])) { cur.push(s); len += s.length; if (cur.length >= 3 || len > 380) { res.push(cur.join(' ')); cur = []; len = 0 } }
    if (cur.length) res.push(cur.join(' ')); out = res
  }
  return out
}
