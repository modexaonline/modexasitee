import { useEffect, useState } from 'react'
import { Save, Trash2, Wand2, ClipboardCopy } from 'lucide-react'
import RichEditor from './RichEditor'
import { Counter, FaqEditor, ListBox, cleanFaqs } from './fields'
import { LANGS, withLang } from '../lib/i18n'
import { fetchRow, saveRow, deleteRow, sourceOf, hashOf, translateObject } from '../lib/translate'
import { editSitemap } from '../lib/sitemapAdmin'
import { cleanList } from '../lib/formatText'
import ShareLinkButton from './ShareLinkButton'

const noDash = s => typeof s === 'string' ? s.replace(/\s*—\s*/g, ', ') : s
const EMPTY = { title: '', excerpt: '', content: '', seo_title: '', seo_description: '', og_title: '', og_description: '', faqs: [], features: [], requirements: [], install: [] }

// Write one language by hand: same boxes as the English editor, empty at first, English shown as a hint inside each box.
export default function ManualLang({ kind, en, lang, path, ads, onNotice, onError, onSaved }) {
  const L = LANGS.find(l => l.code === lang), rtl = ['ar', 'ur'].includes(lang), dir = rtl ? 'rtl' : 'ltr'
  const [d, setD] = useState(null), [busy, setBusy] = useState(''), [had, setHad] = useState(false)
  const isMod = kind === 'mod', set = p => setD(x => ({ ...x, ...p }))
  useEffect(() => { let on = true; setD(null); fetchRow(kind, en.id, lang).then(r => { if (!on) return; setHad(!!r); setD({ ...EMPTY, ...(r?.data || {}) }) }).catch(e => onError(e.message)); return () => { on = false } }, [kind, en.id, lang])
  if (!d) return <section className="adm-card"><p>Loading…</p></section>
  const ph = k => (Array.isArray(en[k]) ? en[k].join('\n') : en[k]) || ''
  const lines = k => Array.isArray(d[k]) ? d[k].join('\n') : (d[k] || '')
  async function save() {
    setBusy('save')
    try {
      const out = {}
      for (const k of ['title', 'excerpt', 'content', 'seo_title', 'seo_description', 'og_title', 'og_description']) { const v = noDash(String(d[k] || '').trim()); if (v) out[k] = v }
      const f = cleanFaqs(d.faqs).map(x => ({ q: noDash(x.q), a: noDash(x.a) })); if (f.length) out.faqs = f
      if (isMod) for (const k of ['features', 'requirements', 'install']) { const v = cleanList(d[k]).map(noDash); if (v.length) out[k] = v }
      if (!out.title) throw new Error('Write the title in ' + L.name + ' first.')
      await saveRow(kind, en.id, lang, out, hashOf(sourceOf(kind, en)), true)
      if (en.status === 'published' && !en.noindex) await editSitemap({ add: [withLang(path, lang)] }).catch(() => {})
      setHad(true); onNotice(`${L.name} version saved. It is live at ${withLang(path, lang)}`); onSaved?.()
    } catch (e) { onError(e.message) }
    setBusy('')
  }
  async function auto() {
    setBusy('ai')
    try { const t = await translateObject(lang, sourceOf(kind, en)); setD({ ...EMPTY, ...t }); onNotice('Filled with an automatic translation. Check it, then press Save.') } catch (e) { onError(e.message) }
    setBusy('')
  }
  const copyEn = () => { setD({ ...EMPTY, ...Object.fromEntries(Object.entries(sourceOf(kind, en))) }); onNotice('English text copied into the boxes. Now replace it with ' + L.name + '.') }
  async function del() { if (!confirm(`Delete the ${L.name} version?`)) return; try { await deleteRow(kind, en.id, lang); setD({ ...EMPTY }); setHad(false); onSaved?.() } catch (e) { onError(e.message) } }
  const F = ({ k, label, area, max, min }) => <label className="adm-field" style={{ marginTop: 12 }}><span>{label}</span>
    {area ? <textarea rows={3} dir={dir} value={d[k] || ''} onChange={e => set({ [k]: e.target.value })} placeholder={ph(k)}/> : <input dir={dir} value={d[k] || ''} onChange={e => set({ [k]: e.target.value })} placeholder={ph(k)}/>}
    {max && <Counter value={d[k] || ''} min={min} max={max}/>}</label>
  return <div className="adm" lang={lang}>
    <section className="adm-card"><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <div><h3 style={{ margin: 0 }}>{L.name} ({L.native}) version</h3><p className="adm-sub" style={{ margin: '4px 0 0' }}>Boxes are empty on purpose. The grey text inside each box is the English original. Fill only what you need, anything left empty falls back to English on the page. Link: <b>modexa.online{withLang(path, lang)}</b></p></div>
      <div className="adm-actions"><button type="button" className="adm-btn" onClick={copyEn}><ClipboardCopy size={14}/> Copy English into boxes</button><button type="button" className="adm-btn" disabled={!!busy} onClick={auto}><Wand2 size={14}/> {busy === 'ai' ? 'Translating…' : 'Fill with auto translation'}</button></div></div></section>
    <section className="adm-card"><h3>Title and summary</h3>
      <F k="title" label={`Title (${L.name})`}/>
      <F k="excerpt" label="Short description" area/></section>
    <section className="adm-card"><RichEditor label={kind === 'post' ? `Post content (${L.name})` : `Full description (${L.name})`} value={d.content || ''} onChange={v => set({ content: v })} ads={ads} onNotice={onNotice} onError={onError}/>
      {en.content && !d.content && <details style={{ marginTop: 10 }}><summary>Show the English text to copy from</summary><div style={{ maxHeight: 260, overflow: 'auto', padding: 10, background: '#f9fafb', borderRadius: 8 }} dangerouslySetInnerHTML={{ __html: en.content }}/></details>}</section>
    {isMod && <section className="adm-card"><h3>Features, requirements, install steps</h3>
      <ListBox label="Features" value={lines('features')} onChange={v => set({ features: v })} rows={4} placeholder={ph('features')}/>
      <ListBox label="Requirements" value={lines('requirements')} onChange={v => set({ requirements: v })} rows={4} placeholder={ph('requirements')}/>
      <ListBox label="How to install" value={lines('install')} onChange={v => set({ install: v })} rows={4} placeholder={ph('install')}/></section>}
    <section className="adm-card"><h3>FAQs ({L.name})</h3><FaqEditor items={d.faqs} onChange={faqs => set({ faqs })}/>
      {Array.isArray(en.faqs) && en.faqs.length > 0 && !(d.faqs || []).length && <p className="adm-sub">English has {en.faqs.length} FAQs. Add the same questions here.</p>}</section>
    <section className="adm-card"><h3>Search and sharing ({L.name})</h3>
      <F k="seo_title" label="SEO title" max={60} min={30}/>
      <F k="seo_description" label="Meta description" area max={160} min={80}/>
      <F k="og_title" label="Social title"/>
      <F k="og_description" label="Social description" area/></section>
    <div className="adm-actions" style={{ position: 'sticky', bottom: 8, background: '#fff', padding: 10, borderRadius: 12, boxShadow: '0 4px 18px rgba(0,0,0,.12)' }}>
      <button type="button" className="adm-btn primary" disabled={!!busy} onClick={save}><Save size={14}/> {busy === 'save' ? 'Saving…' : `Save ${L.name} version`}</button>
      {had && <ShareLinkButton small={false} path={withLang(path, lang)} title={d.title} onNotice={onNotice}/>}
      {had && <button type="button" className="adm-btn danger" onClick={del}><Trash2 size={14}/> Delete this language</button>}</div>
  </div>
}
