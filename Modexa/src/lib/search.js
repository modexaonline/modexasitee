// Typo-tolerant, multi-word search. Any matching word suggests posts; once every word matches, only the matching items remain.
export const tokenize = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim().split(' ').filter(Boolean)
function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) { const cur = [i]; let best = i; for (let j = 1; j <= b.length; j++) { const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); cur.push(v); if (v < best) best = v } if (best > max) return max + 1; prev = cur }
  return prev[b.length]
}
export function prepare(item) { return { ...item, _t: tokenize(item.title), _s: tokenize([item.subtitle, item.game, item.category, item.tags].filter(Boolean).join(' ')), _b: tokenize(String(item.text || '').slice(0, 2500)), _norm: tokenize(item.title).join(' ') } }
function tokenScore(q, tokens, w) {
  let best = 0
  for (const t of tokens) {
    let s = 0
    if (t === q) s = 1
    else if (q.length >= 2 && t.startsWith(q)) s = 0.88
    else if (t.length >= 3 && q.length > t.length && q.startsWith(t)) s = 0.78
    else if (q.length >= 3 && t.includes(q)) s = 0.58
    else { const max = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0; if (max && lev(q, t, max) <= max) s = 0.55 }
    if (s > best) best = s
  }
  return best * w
}
export function search(query, prepared, { limit = 8 } = {}) {
  const q = tokenize(query); if (!q.length) return []
  const phrase = q.join(' ')
  const scored = []
  for (const it of prepared) {
    let score = 0, matched = 0
    for (const t of q) { const s = Math.max(tokenScore(t, it._t, 3), tokenScore(t, it._s, 1.5), tokenScore(t, it._b, 0.6)); if (s > 0) { matched++; score += s } }
    if (!matched) continue
    if (it._norm.includes(phrase)) score += 4
    if (it._norm.startsWith(phrase)) score += 2
    scored.push({ item: it, score, matched, ratio: matched / q.length })
  }
  const full = scored.filter(r => r.matched === q.length)
  const pool = full.length ? full : scored
  pool.sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length)
  return pool.slice(0, limit).map(r => ({ ...r.item, _score: r.score, _full: r.matched === q.length }))
}
export function highlightParts(text, query) {
  const toks = tokenize(query).filter(t => t.length >= 2); if (!toks.length) return [{ t: text }]
  const re = new RegExp('(' + toks.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'ig')
  return String(text).split(re).filter(Boolean).map(p => ({ t: p, m: re.test(p) && (re.lastIndex = 0, true) }))
}
