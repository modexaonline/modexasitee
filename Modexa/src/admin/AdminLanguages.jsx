import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Languages, Play, Square, RefreshCw, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setSettingsCache } from '../lib/useSettings'
import { LANGS, withLang } from '../lib/i18n'
import { hrefOfMod, hrefOfPost } from '../lib/hidden'
import { editSitemap } from '../lib/sitemapAdmin'
import { CONTENT_KEYS, contentSource, uiSource, sourceOf, hashOf, translateAndSave } from '../lib/translate'
import { LISTING } from '../content/seo'
import { Switch } from './fields'
import './admin-extra.css'

// Admin → Languages: switch languages on, see how much is translated, translate everything with one click.
export default function AdminLanguages({ onNotice, onError }) {
  const [s, setS] = useState(null), [posts, setPosts] = useState([]), [mods, setMods] = useState([]), [rows, setRows] = useState([]), [site, setSite] = useState({})
  const [run, setRun] = useState(null), abort = useRef(null)
  const load = useCallback(async () => {
    const [a, b, c, d, e] = await Promise.all([
      supabase.from('site_settings').select('i18n_enabled,i18n_langs,i18n_auto').eq('id', 1).maybeSingle(),
      supabase.from('posts').select('id,slug,post_type,status,title,excerpt,content,seo_title,seo_description,og_title,og_description,faqs').eq('status', 'published'),
      supabase.from('mods').select('id,slug,listing_type,status,title,excerpt,content,seo_title,seo_description,og_title,og_description,faqs,features,requirements,install').eq('status', 'published'),
      supabase.from('translations').select('kind,item_key,lang,edited,src_hash').range(0, 4999),
      supabase.from('site_content').select('key,data'),
    ])
    if (a.error) return onError(/column|schema/i.test(a.error.message) ? 'Run supabase/v22_international_translations.sql in Supabase first.' : a.error.message)
    setS({ enabled: !!a.data?.i18n_enabled, auto: a.data?.i18n_auto !== false, langs: Array.isArray(a.data?.i18n_langs) ? a.data.i18n_langs : LANGS.map(l => l.code) })
    setPosts(b.data || []); setMods(c.data || []); setRows(d.data || [])
    const sc = {}; (e.data || []).forEach(r => { sc[r.key] = r.data }); setSite(sc)
  }, [onError])
  useEffect(() => { load() }, [load])

  const stats = useMemo(() => {
    const idx = new Map(rows.map(r => [`${r.kind}:${r.item_key}:${r.lang}`, r])), out = {}
    for (const l of LANGS) {
      const st = { posts: 0, postsOld: 0, mods: 0, modsOld: 0, ui: idx.has(`ui:ui:${l.code}`), content: 0 }
      for (const p of posts) { const r = idx.get(`post:${p.id}:${l.code}`); if (r) { st.posts++; if (!r.edited && r.src_hash !== hashOf(sourceOf('post', p))) st.postsOld++ } }
      for (const m of mods) { const r = idx.get(`mod:${m.id}:${l.code}`); if (r) { st.mods++; if (!r.edited && r.src_hash !== hashOf(sourceOf('mod', m))) st.modsOld++ } }
      for (const k of CONTENT_KEYS) if (idx.has(`content:${k}:${l.code}`)) st.content++
      out[l.code] = st
    }
    return out
  }, [rows, posts, mods])

  async function saveSettings(next) {
    const v = { ...s, ...next }; setS(v)
    const row = { i18n_enabled: v.enabled, i18n_auto: v.auto, i18n_langs: v.langs }
    const { error } = await supabase.from('site_settings').update(row).eq('id', 1)
    if (error) return onError(error.message)
    setSettingsCache(row); onNotice('Saved.')
  }
  const toggleLang = code => saveSettings({ langs: s.langs.includes(code) ? s.langs.filter(c => c !== code) : LANGS.map(l => l.code).filter(c => s.langs.includes(c) || c === code) })

  async function translate(langs, scope) {
    const ctl = new AbortController(); abort.current = ctl
    const steps = []
    for (const lang of langs) {
      if (scope !== 'items') { steps.push({ lang, label: 'interface words', kind: 'ui', key: 'ui', src: uiSource() }); CONTENT_KEYS.forEach(k => steps.push({ lang, label: k, kind: 'content', key: k, src: contentSource(k, site) })) }
      if (scope !== 'site') { mods.forEach(m => steps.push({ lang, label: m.title, kind: 'mod', key: m.id, src: sourceOf('mod', m), path: hrefOfMod(m) })); posts.forEach(p => steps.push({ lang, label: p.title, kind: 'post', key: p.id, src: sourceOf('post', p), path: hrefOfPost(p) })) }
    }
    const errors = [], paths = []; let done = 0, made = 0
    setRun({ total: steps.length, done: 0, label: '', errors, made: 0 })
    for (const st of steps) {
      if (ctl.signal.aborted) break
      setRun({ total: steps.length, done, label: `${LANGS.find(l => l.code === st.lang)?.name}: ${st.label}`, errors, made })
      try {
        const r = await translateAndSave(st.kind, st.key, st.lang, st.src, { signal: ctl.signal })
        if (r === 'done') made++
        if (r === 'done' || r === 'fresh' || r === 'edited') {
          if (st.path) paths.push(withLang(st.path, st.lang))
          if (st.kind === 'content') paths.push(st.key === 'home' ? withLang('/', st.lang) : withLang(LISTING[st.key.replace('listing:', '')]?.path || '/', st.lang))
        }
      } catch (e) { errors.push(`${st.lang}: ${st.label}: ${e.message}`); if (/quota|rate limit|Admins only|GEMINI_API_KEY/i.test(e.message)) break }
      done++
    }
    // every translated page goes into the sitemap by default
    try { const uniq = [...new Set(paths.filter(Boolean))]; if (uniq.length) await editSitemap({ add: uniq }) } catch (e) { errors.push('Sitemap: ' + e.message) }
    setRun({ total: steps.length, done, label: '', errors, made, finished: true, stopped: ctl.signal.aborted })
    abort.current = null; load()
    if (errors.length) onError(errors[0]); else onNotice(`Finished. ${made} new translation${made === 1 ? '' : 's'} saved.`)
  }
  const stop = () => abort.current?.abort()
  if (!s) return <div className="adm-card">Loading…</div>
  const busy = run && !run.finished, enabledList = LANGS.filter(l => s.langs.includes(l.code))

  return <div className="adm-stack" style={{ display: 'grid', gap: 16 }}>
    <section className="adm-card" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div><h3 style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}><Languages size={18}/> International SEO and languages</h3>
          <p className="adm-sub" style={{ margin: '4px 0 0' }}>Every language gets its own URLs (for example <b>modexa.online/id/blog/your-post</b>), hreflang tags, its own canonical and sitemap entries. English stays on the normal URLs.</p></div>
        <Switch checked={s.enabled} onChange={v => saveSettings({ enabled: v })} label="Languages enabled"/>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <Switch checked={s.auto} onChange={v => saveSettings({ auto: v })} label="Translate automatically when I publish or update a post"/>
      </div>
      <div className="adm-alert info"><Info size={16} style={{ flex: 'none', marginTop: 2 }}/><div>Order below is the priority for traffic and income. <b>Hinglish</b> means Hindi written in English letters. Translated pages are only indexed once they exist; a language page without a translation stays noindex and points to the English page. Translations never contain the long dash.</div></div>
    </section>

    <section className="adm-card" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Languages ({enabledList.length} on)</h3>
        <div className="adm-actions" style={{ margin: 0 }}>
          <button type="button" className="adm-btn primary" disabled={busy || !enabledList.length} onClick={() => translate(enabledList.map(l => l.code), 'all')}><Play size={15}/> Translate everything (all enabled languages)</button>
          {busy && <button type="button" className="adm-btn danger" onClick={stop}><Square size={14}/> Stop</button>}
        </div>
      </div>
      <p className="adm-sub" style={{ margin: 0 }}>Published posts: {posts.length} · Published listings: {mods.length}. Items already translated and unchanged are skipped, so running it again only does new or changed work.</p>
      <div style={{ overflowX: 'auto' }}><table className="adm-table" style={{ width: '100%', minWidth: 720 }}>
        <thead><tr><th>On</th><th>Language</th><th>Site text</th><th>Posts</th><th>Listings</th><th></th></tr></thead>
        <tbody>{LANGS.map(l => { const st = stats[l.code], on = s.langs.includes(l.code)
          return <tr key={l.code}>
            <td><Switch checked={on} onChange={() => toggleLang(l.code)} label={l.name}/></td>
            <td><b>{l.name}</b><br/><small>/{l.code}/ · {l.hreflang}{l.dir === 'rtl' ? ' · right to left' : ''}</small></td>
            <td>{st.ui && st.content >= CONTENT_KEYS.length ? <span className="adm-pill green"><CheckCircle2 size={12}/> done</span> : <span className="adm-pill">{st.ui ? 1 : 0}/1 words · {st.content}/{CONTENT_KEYS.length} pages</span>}</td>
            <td>{st.posts}/{posts.length}{st.postsOld > 0 && <span className="adm-pill amber" title="English text changed after translating"> <AlertTriangle size={11}/> {st.postsOld} outdated</span>}</td>
            <td>{st.mods}/{mods.length}{st.modsOld > 0 && <span className="adm-pill amber"> <AlertTriangle size={11}/> {st.modsOld} outdated</span>}</td>
            <td style={{ whiteSpace: 'nowrap' }}><button type="button" className="adm-btn" disabled={busy || !on} onClick={() => translate([l.code], 'site')}>Site text</button> <button type="button" className="adm-btn" disabled={busy || !on} onClick={() => translate([l.code], 'items')}><RefreshCw size={13}/> Posts + listings</button></td>
          </tr> })}</tbody></table></div>
    </section>

    {run && <section className="adm-card" style={{ display: 'grid', gap: 8 }}>
      <b>{run.finished ? (run.stopped ? 'Stopped' : 'Finished') : 'Translating…'} {run.done}/{run.total}</b>
      <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${run.total ? (run.done / run.total) * 100 : 0}%`, height: '100%', background: '#16a34a' }}/></div>
      {!run.finished && <small>{run.label}</small>}
      {run.errors.length > 0 && <div className="adm-alert error"><AlertTriangle size={16} style={{ flex: 'none' }}/><div>{run.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}{run.errors.length > 5 && <div>and {run.errors.length - 5} more</div>}</div></div>}
    </section>}
  </div>
}
