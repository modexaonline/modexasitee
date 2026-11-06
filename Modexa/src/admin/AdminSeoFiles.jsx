import { useEffect, useRef, useState } from 'react'
import { Save, Upload, Download, RotateCcw, ExternalLink, FileCode, Info, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSettings } from '../lib/useSettings'
import './admin-extra.css'

const MAX = 500 * 1024
const GA_DEFAULT = `<meta name="monetag" content="f77a2b6f16b1c2b0f935e7919b638d62">\n<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-D6TLV9Y2L7"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n\n  gtag('config', 'G-D6TLV9Y2L7');\n</script>`
const CFG = {
  head_code: { title: 'Header code', url: '/', def: null, accept: '.html,.txt,text/html,text/plain', ph: GA_DEFAULT },
  robots_txt: { title: 'robots.txt', url: '/robots.txt', def: '/robots.default.txt', accept: '.txt,text/plain', ph: 'User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://modexa.online/sitemap.xml' },
  sitemap_xml: { title: 'sitemap.xml', url: '/sitemap.xml', def: '/sitemap.default.xml', accept: '.xml,text/xml,application/xml', ph: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://modexa.online/</loc></url>\n</urlset>' }
}

function validate(col, text) {
  const t = text.trim()
  if (!t) return ''
  if (new Blob([text]).size > MAX) return 'File is too large (max 500 KB).'
  if (col === 'head_code') {
    if (new Blob([text]).size > 50000) return 'Header code is too long (max 50 KB).'
    if (/<\/head>|<body[\s>]|<html[\s>]/i.test(t)) return 'Paste only the tags that belong inside <head> (no <html>, <body> or </head>).'
    if (!/<(script|meta|link|style)[\s>]/i.test(t)) return 'This does not look like header code. Paste the full <script …> tag exactly as Google/Monetag shows it.'
    return ''
  }
  if (col === 'robots_txt') {
    if (/<\s*(html|body|script)/i.test(t)) return 'This looks like HTML, not a robots.txt file.'
    if (!/^\s*(user-agent|sitemap|#)/im.test(t)) return 'robots.txt should contain at least one "User-agent:" line.'
    return ''
  }
  const doc = new DOMParser().parseFromString(t, 'application/xml')
  if (doc.querySelector('parsererror')) return 'The XML is not valid. Check for missing or unclosed tags.'
  const root = doc.documentElement.nodeName
  if (root !== 'urlset' && root !== 'sitemapindex') return 'Sitemap must start with <urlset> (or <sitemapindex>).'
  return ''
}


// Read-only list of the Open Graph / Twitter tags every page already gets (set per page in Social sharing, or from these defaults).
function SocialTags() {
  const st = useSettings(), img = st.default_og_image || 'https://modexa.online/og-default.png'
  const handle = (String(st.twitter_url || '').match(/(?:twitter|x)\.com\/@?([A-Za-z0-9_]{1,15})/) || [])[1]
  const tags = `<meta property="og:site_name" content="Modexa">
<meta property="og:type" content="website  (article on posts and listings)">
<meta property="og:title" content="[page Social title, else SEO title]">
<meta property="og:description" content="[page Social description, else meta description]">
<meta property="og:url" content="https://modexa.online/[page]">
<meta property="og:image" content="[page Social image, else cover image, else ${img}]">
<meta property="og:image:alt" content="[page title]">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[same as og:title]">
<meta name="twitter:description" content="[same as og:description]">
<meta name="twitter:image" content="[same as og:image]">${handle ? `\n<meta name="twitter:site" content="@${handle}">` : ''}`
  return <details className="adm-tags" open><summary>Social tags added automatically on every page (Open Graph + Twitter)</summary>
    <p className="adm-sub" style={{ margin: '8px 0 0' }}>You do not need to paste these here. They are written into the head of every page. Change them per page in the post / listing editor under “Social sharing”, and the default image in Site &amp; brand. To check: open your page, right-click → View page source, search for “og:”.</p>
    <pre>{tags}</pre></details>
}

function Editor({ col, saved, onSaved, onNotice, onError }) {
  const c = CFG[col], [text, setText] = useState(saved || ''), [busy, setBusy] = useState(false), file = useRef(null)
  useEffect(() => setText(saved || ''), [saved])
  const custom = Boolean((saved || '').trim()), dirty = text !== (saved || '')
  async function persist(value, msg) {
    const bad = validate(col, value); if (bad) return onError(bad)
    setBusy(true)
    const { error } = await supabase.from('site_settings').update({ [col]: value }).eq('id', 1)
    setBusy(false)
    if (error) return onError(/column|schema/i.test(error.message) ? 'Database is missing the new columns. Run supabase/v12_seo_files_head.sql in Supabase first.' : error.message)
    onSaved(value)
    if (col !== 'head_code') return onNotice(msg)
    await rebuild()
  }
  // Header code is baked into the static HTML at build time, so the site has to be rebuilt once after saving.
  async function rebuild() {
    setBusy(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/redeploy', { method: 'POST', headers: { Authorization: 'Bearer ' + (session?.access_token || '') } })
      onNotice(r.ok ? 'Rebuilding the website now. The header code will be in the public <head> in about 1–2 minutes.' : 'Automatic rebuild is not set up yet. In Vercel open Deployments → … → Redeploy (or add VERCEL_DEPLOY_HOOK_URL, see README) to publish it.')
    } catch { onNotice('Could not start the rebuild. In Vercel open Deployments → … → Redeploy to publish it.') }
    setBusy(false)
  }
  function upload(e) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    if (f.size > MAX) return onError('File is too large (max 500 KB).')
    const r = new FileReader(); r.onload = () => { setText(String(r.result || '')); onNotice(`${f.name} loaded into the editor. Review it, then press Save.`) }; r.readAsText(f)
  }
  async function loadDefault() {
    if (!c.def) { setText(GA_DEFAULT); return onNotice('Built-in Google tag loaded into the editor.') }
    try { const r = await fetch(c.def, { cache: 'no-store' }); if (!r.ok) throw 0; setText(await r.text()); onNotice('Auto-generated version loaded into the editor. Edit it, then press Save.') }
    catch { onError('The auto-generated file is only available on the deployed site after a build.') }
  }
  function download() {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = c.title; a.click(); URL.revokeObjectURL(a.href)
  }
  return <section className="adm-card" style={{ display: 'grid', gap: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <div><h3 style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}><FileCode size={18}/> {c.title}</h3>
        <p className="adm-sub" style={{ margin: '4px 0 0' }}>{col === 'head_code' ? (custom ? 'Your custom code is added inside <head> of every public page.' : 'Using the built-in code (Monetag meta + Google tag G-D6TLV9Y2L7). Save code below to replace it.') : custom ? 'A custom file is live. It replaces the auto-generated one.' : 'Using the auto-generated file from the last build. Save text below to override it.'}</p></div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{custom && <span className="adm-pill green"><CheckCircle2 size={13}/> Custom</span>}<a className="adm-btn sm" href={c.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> View live</a></div>
    </div>
    <textarea rows={14} spellCheck={false} value={text} onChange={e => setText(e.target.value)} placeholder={c.ph} style={{ fontFamily: 'ui-monospace,Menlo,Consolas,monospace', fontSize: 13, width: '100%' }}/>
    {col === 'head_code' && <SocialTags/>}
    <div className="adm-actions" style={{ flexWrap: 'wrap' }}>
      <button type="button" className="adm-btn primary" disabled={busy || !dirty} onClick={() => persist(text, `${c.title} saved. It is live now (CDN may take up to 5 minutes to refresh).`)}><Save size={15}/> {busy ? 'Saving…' : `Save ${c.title}`}</button>
      {col === 'head_code' && custom && !dirty && <button type="button" className="adm-btn primary" disabled={busy} onClick={rebuild} title="Rebuild the website so the saved header code appears on the live pages"><RotateCcw size={15}/> Publish to live site (rebuild)</button>}
      <button type="button" className="adm-btn" onClick={() => file.current?.click()}><Upload size={15}/> Upload file</button>
      <input ref={file} type="file" accept={c.accept} hidden onChange={upload}/>
      <button type="button" className="adm-btn" onClick={loadDefault}>Load auto-generated</button>
      <button type="button" className="adm-btn" onClick={download} disabled={!text.trim()}><Download size={15}/> Download</button>
      {custom && <button type="button" className="adm-btn danger" disabled={busy} onClick={() => { if (confirm(`Delete the custom ${c.title} and go back to the auto-generated one?`)) persist('', `Custom ${c.title} deleted. The auto-generated file is live again.`) }}><RotateCcw size={15}/> Delete custom file</button>}
    </div>
  </section>
}

export default function AdminSeoFiles({ onNotice, onError }) {
  const [v, setV] = useState({ robots_txt: '', sitemap_xml: '', head_code: '' }), [loaded, setLoaded] = useState(false)
  useEffect(() => { supabase.from('site_settings').select('robots_txt,sitemap_xml,head_code').eq('id', 1).maybeSingle().then(({ data, error }) => { if (data) setV({ robots_txt: data.robots_txt || '', sitemap_xml: data.sitemap_xml || '', head_code: data.head_code || '' }); else if (error && !/column|schema/i.test(error.message)) onError(error.message); else if (error) onError('Run supabase/v12_seo_files_head.sql in Supabase first, then reload.'); setLoaded(true) }) }, [])
  if (!loaded) return <div className="admin-empty"><p>Loading…</p></div>
  return <div className="adm">
    <div className="adm-head"><div><h2>Robots, Sitemap & Header code</h2><p>Edit, upload or delete these files. Robots and sitemap go live at once; header code rebuilds the site automatically.</p></div></div>
    <Editor col="head_code" saved={v.head_code} onSaved={x => setV(p => ({ ...p, head_code: x }))} onNotice={onNotice} onError={onError}/>
    <Editor col="robots_txt" saved={v.robots_txt} onSaved={x => setV(p => ({ ...p, robots_txt: x }))} onNotice={onNotice} onError={onError}/>
    <Editor col="sitemap_xml" saved={v.sitemap_xml} onSaved={x => setV(p => ({ ...p, sitemap_xml: x }))} onNotice={onNotice} onError={onError}/>
    <div className="adm-alert info"><Info size={16} style={{ flex: 'none', marginTop: 2 }}/><div>Deleting a custom file switches back to the one generated automatically at every deploy. A custom sitemap does not update itself when you publish new posts, so delete it (or re-upload) to get the automatic one back. After changing the sitemap, resubmit it in Google Search Console.</div></div>
  </div>
}
