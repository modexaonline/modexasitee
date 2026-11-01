// Modexa AI formatter (Supabase Edge Function). Admin only.
// Takes plain text, asks Gemini to add headings / sub-headings / bullets / paragraphs WITHOUT changing the words,
// then verifies the words are unchanged before returning clean HTML. Secret: GEMINI_API_KEY (falls back to the key below).
// v4: tries several Gemini models in order, retries without the "thinking" setting if a model rejects it, tries the
// secret key and then the fallback key, and always answers HTTP 200 with {error} so the admin sees the real reason.
const FALLBACK_KEY = ''   // optional: leave empty and set the GEMINI_API_KEY secret in Supabase instead
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
const MODELS = [...new Set([Deno.env.get('GEMINI_MODEL'), 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'].filter(Boolean) as string[])]
const MAX_TOTAL = 60000, CHUNK = 9000
let goodModel = ''   // the model that worked last time (kept while this instance stays warm)

const PROMPT = `You are a layout formatter for a website CMS. You receive raw text (a blog post, guide, app or game description).
Your ONLY job is to restructure it into clean semantic HTML. You must NOT rewrite it.

STRICT RULES
1. Keep EVERY word, number, name and sentence exactly as given, in the same order. Do not add, remove, translate, reword, summarize, fix grammar or add new sentences.
2. You may only add structure: <h2> for main section headings, <h3> for sub-headings, <p> for paragraphs, <ul><li> for bullet lists, <ol><li> for numbered steps, <strong> for a few key terms already in the text, <blockquote> for quotes/notes.
3. If the text already contains a title/heading-like line (short line, question, or "Something:" label), turn it into a heading. Detect lists (lines starting with -, *, •, numbers, or clear enumerations) and turn them into <ul>/<ol>. Break long walls of text into paragraphs of 2-4 sentences.
4. Do not invent headings that are not in the text. If a heading is missing, leave that part as paragraphs.
5. Heading text must be the original words from the text, not new words. Do not use <h1>.
6. No markdown, no code fences, no attributes, no links, no images, no explanations. Output ONLY the HTML.
7. Keep the original language (it may be Urdu, Hindi, Roman Urdu, English, etc.).`

const ALLOWED = new Set(['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'br'])
function sanitize(html: string) {
  return html.replace(/```[a-z]*\n?/gi, '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (m, tag: string) => { const t = tag.toLowerCase(); if (!ALLOWED.has(t)) return ''; return m.startsWith('</') ? `</${t}>` : `<${t}>` }).trim()
}
const plain = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
const words = (s: string) => plain(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
function sameWords(a: string, b: string) {
  const x = words(a), y = words(b); if (!x.length) return true
  if (Math.abs(x.length - y.length) / x.length > 0.03) return false
  const m = new Map<string, number>(); for (const w of x) m.set(w, (m.get(w) || 0) + 1)
  let hit = 0; for (const w of y) { const c = m.get(w) || 0; if (c > 0) { hit++; m.set(w, c - 1) } }
  return hit / x.length >= 0.98
}
function chunks(text: string) {
  if (text.length <= CHUNK) return [text]
  const parts = text.split(/(?<=\n)|(?<=[.!?۔])\s+/), out: string[] = []; let cur = ''
  for (const p of parts) { if (cur.length + p.length > CHUNK && cur) { out.push(cur); cur = '' } cur += (cur && !cur.endsWith('\n') ? ' ' : '') + p }
  if (cur.trim()) out.push(cur); return out
}

async function callGemini(model: string, text: string, key: string, thinking: boolean) {
  const gen: Record<string, unknown> = { temperature: 0.1, maxOutputTokens: 32768 }
  if (thinking) gen.thinkingConfig = model.startsWith('gemini-2.5') ? { thinkingBudget: 0 } : { thinkingLevel: 'low' }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: PROMPT }] }, contents: [{ role: 'user', parts: [{ text: 'Format this text:\n\n' + text }] }], generationConfig: gen }),
  })
  const d = await r.json().catch(() => ({}))
  const out = d?.candidates?.[0]?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text || '').join('') || ''
  return { ok: r.ok, status: r.status, msg: String(d?.error?.message || `HTTP ${r.status}`), out }
}

async function gemini(text: string, keys: string[]) {
  const errs: string[] = [], order = goodModel ? [goodModel, ...MODELS.filter(m => m !== goodModel)] : MODELS
  for (const model of order) {
    let modelMissing = false
    for (const key of keys) {
      if (modelMissing) break
      for (const thinking of [true, false]) {
        const r = await callGemini(model, text, key, thinking)
        if (r.ok && r.out.trim()) { goodModel = model; return r.out }
        errs.push(`${model}: ${r.ok ? 'returned nothing' : r.msg}`)
        if (r.status === 429) throw new Error('Gemini quota/rate limit reached. Wait a minute and try again. (' + r.msg + ')')
        if (!r.ok && r.status === 400 && /think/i.test(r.msg) && thinking) continue   // retry same model without the thinking setting
        if (r.status === 404) modelMissing = true                                    // this model name is not available: next model
        break                                                                        // otherwise: next key
      }
    }
  }
  throw new Error('Gemini failed. ' + errs.slice(-4).join(' | '))
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'POST only' })
  try {
    // admin check: runs is_modexa_admin() with the caller's own login token
    const url = Deno.env.get('SUPABASE_URL')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!, auth = req.headers.get('Authorization') || ''
    const chk = await fetch(`${url}/rest/v1/rpc/is_modexa_admin`, { method: 'POST', headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' }, body: '{}' })
    if (!chk.ok || (await chk.json()) !== true) return json({ error: 'Admins only. Log in to the admin panel first.' })
    const keys = [...new Set([Deno.env.get('GEMINI_API_KEY'), FALLBACK_KEY].filter(Boolean) as string[])]
    if (!keys.length) return json({ error: 'GEMINI_API_KEY is not set in Supabase (Edge Functions → Secrets).' })
    const body = await req.json().catch(() => ({})), text = String(body?.text || '').replace(/\r\n?/g, '\n').trim()
    if (text.length < 20) return json({ error: 'Text is too short.' })
    if (text.length > MAX_TOTAL) return json({ error: `Text is too long (max ${MAX_TOTAL} characters at once). Format it in parts.` })
    let html = ''
    for (const c of chunks(text)) {
      let out = sanitize(await gemini(c, keys))
      if (!sameWords(c, out)) { out = sanitize(await gemini(c, keys)) }               // one retry
      if (!sameWords(c, out)) return json({ error: 'AI changed some words, so the result was rejected. Using normal formatting instead.', fallback: true })
      html += out
    }
    return json({ html })
  } catch (e) { return json({ error: (e as Error).message || 'Unexpected error' }) }
})
