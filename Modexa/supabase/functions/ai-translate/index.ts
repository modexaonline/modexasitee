// Modexa translator (Supabase Edge Function). Admin only.
// Input: { lang: 'id', texts: ['...', '<p>html</p>'] }  Output: { texts: [...] } in the same order and count.
// HTML tags, attributes, links, shortcodes like [ad:name], brand/app/game names, numbers and versions are kept as they are.
// Secret: GEMINI_API_KEY (the key below is only a fallback). Always answers HTTP 200 with {error} on failure so the admin sees the reason.
const FALLBACK_KEY = ''
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
const MODELS = [...new Set([Deno.env.get('GEMINI_MODEL'), 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash'].filter(Boolean) as string[])]
let goodModel = ''

const LANGS: Record<string, string> = {
  id: 'Indonesian (Bahasa Indonesia), natural everyday wording as used by Indonesian mobile gamers',
  pt: 'Brazilian Portuguese (pt-BR), natural everyday wording as used in Brazil',
  es: 'neutral Latin American Spanish that also reads naturally in Mexico and Spain',
  ar: 'Modern Standard Arabic, clear and simple wording that Egyptian, Saudi and Gulf readers all understand',
  tr: 'Turkish, natural everyday wording',
  hi: 'Hinglish: Hindi written in the Roman (Latin) alphabet, exactly how Indian gamers type and speak it online. Do NOT use Devanagari script',
  vi: 'Vietnamese, natural everyday wording',
  bn: 'Bengali (Bangla) in Bengali script, natural everyday wording',
  ur: 'Urdu in Urdu (Nastaliq) script, natural everyday wording',
  th: 'Thai, natural everyday wording',
}
const PROMPT = (lang: string) => `You are a professional website translator for Modexa, a site about Android apps, games, guides and blog posts.
Translate every string of the given JSON array into ${LANGS[lang]}.

RULES
1. Output a JSON array with EXACTLY the same number of strings, in the same order. Nothing else.
2. Some strings are HTML. Keep every HTML tag, attribute, class name, id, link (href/src) and the tag order exactly the same. Translate only the human-readable text between tags. Never add or remove tags.
3. Keep unchanged: brand names (Modexa), app and game names, mod names, version numbers, numbers, URLs, email addresses, file names, code, emoji, and shortcodes such as [ad:name] or {{name}}.
4. Do not summarize, shorten, add or explain. Keep the meaning, tone, paragraphs, lists and headings. Keep markdown symbols (##, -, *, **) as they are.
5. Never use the long dash character (the em dash). Use a comma, a colon or a normal hyphen instead.
6. SEO titles and meta descriptions: keep them natural and about the same length as the original, and keep the main keyword meaning.`

const stripDash = (s: string) => s.replace(/\s*—\s*/g, ', ').replace(/—/g, '-')
const tagCount = (s: string) => (s.match(/<\/?[a-z][a-z0-9]*[\s>/]/gi) || []).length

async function callGemini(model: string, lang: string, texts: string[], key: string) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: PROMPT(lang) }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(texts) }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 32768, responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'STRING' } } },
    }),
  })
  const d = await r.json().catch(() => ({}))
  const out = d?.candidates?.[0]?.content?.parts?.filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text || '').join('') || ''
  return { ok: r.ok, status: r.status, msg: String(d?.error?.message || `HTTP ${r.status}`), out }
}
function parse(out: string, texts: string[]) {
  try {
    const a = JSON.parse(out)
    if (!Array.isArray(a) || a.length !== texts.length || a.some(x => typeof x !== 'string')) return null
    const res = a.map(stripDash)
    for (let i = 0; i < texts.length; i++) if (texts[i].includes('<') && Math.abs(tagCount(texts[i]) - tagCount(res[i])) > 0) return null   // HTML structure must be unchanged
    return res
  } catch { return null }
}
async function translate(lang: string, texts: string[], keys: string[]) {
  const errs: string[] = [], order = goodModel ? [goodModel, ...MODELS.filter(m => m !== goodModel)] : MODELS
  for (const model of order) {
    let missing = false
    for (const key of keys) {
      if (missing) break
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await callGemini(model, lang, texts, key)
        if (r.status === 429) throw new Error('Gemini quota or rate limit reached. Wait a minute and try again. (' + r.msg + ')')
        if (r.ok) { const res = parse(r.out, texts); if (res) { goodModel = model; return res } errs.push(`${model}: answer did not match the original structure`); continue }
        errs.push(`${model}: ${r.msg}`)
        if (r.status === 404) missing = true
        break
      }
    }
  }
  throw new Error('Translation failed. ' + errs.slice(-3).join(' | '))
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'POST only' })
  try {
    const url = Deno.env.get('SUPABASE_URL')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!, auth = req.headers.get('Authorization') || ''
    const chk = await fetch(`${url}/rest/v1/rpc/is_modexa_admin`, { method: 'POST', headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' }, body: '{}' })
    if (!chk.ok || (await chk.json()) !== true) return json({ error: 'Admins only. Log in to the admin panel first.' })
    const keys = [...new Set([Deno.env.get('GEMINI_API_KEY'), FALLBACK_KEY].filter(Boolean) as string[])]
    if (!keys.length) return json({ error: 'GEMINI_API_KEY is not set in Supabase (Edge Functions → Secrets).' })
    const body = await req.json().catch(() => ({})), lang = String(body?.lang || ''), texts: unknown = body?.texts
    if (!LANGS[lang]) return json({ error: 'Unknown language: ' + lang })
    if (!Array.isArray(texts) || !texts.length || texts.some(t => typeof t !== 'string')) return json({ error: 'texts must be a list of strings.' })
    const total = (texts as string[]).reduce((n, t) => n + t.length, 0)
    if (texts.length > 60 || total > 30000) return json({ error: 'Too much text in one call. Send it in smaller batches.' })
    return json({ texts: await translate(lang, texts as string[], keys) })
  } catch (e) { return json({ error: (e as Error).message || 'Unexpected error' }) }
})
