import { useCallback, useEffect, useState } from 'react'
import { Languages, Pencil, Trash2, RefreshCw, X, Save } from 'lucide-react'
import { LANGS, withLang } from '../lib/i18n'
import { fetchRows, fetchRow, saveRow, deleteRow, translateAndSave, sourceOf, hashOf } from '../lib/translate'
import { editSitemap } from '../lib/sitemapAdmin'
import ShareLinkButton from './ShareLinkButton'

// Translations of one post or listing: status per language, translate, edit by hand, delete, copy the language link.
export default function TranslationsCard({ kind, row, path, settings, onNotice, onError }) {
  const [rows, setRows] = useState(null), [busy, setBusy] = useState(''), [edit, setEdit] = useState(null)
  const langs = LANGS.filter(l => Array.isArray(settings.i18n_langs) && settings.i18n_langs.includes(l.code))
  const load = useCallback(() => fetchRows(kind, [row.id]).then(setRows).catch(e => onError(e.message)), [kind, row.id, onError])
  useEffect(() => { load() }, [load])
  const hash = hashOf(sourceOf(kind, row)), byLang = Object.fromEntries((rows || []).map(r => [r.lang, r]))
  const status = l => { const r = byLang[l]; return !r ? 'missing' : r.edited ? 'edited' : r.src_hash !== hash ? 'outdated' : 'ready' }
  async function run(codes, force) {
    setBusy(codes.length > 1 ? 'all' : codes[0])
    const added = []
    try {
      for (const c of codes) { const r = await translateAndSave(kind, row.id, c, sourceOf(kind, row), { force }); if (r === 'done') added.push(withLang(path, c)) }
      if (added.length) await editSitemap({ add: added }).catch(() => {})
      onNotice(added.length ? `Translated. ${added.length} language page${added.length === 1 ? '' : 's'} added to the sitemap.` : 'Everything is already up to date.')
    } catch (e) { onError(e.message) }
    setBusy(''); load()
  }
  async function openEdit(code) { try { const r = await fetchRow(kind, row.id, code); setEdit({ code, data: { title: '', excerpt: '', seo_title: '', seo_description: '', og_title: '', og_description: '', content: '', ...(r?.data || {}) } }) } catch (e) { onError(e.message) } }
  async function saveEdit() {
    try { const d = { ...edit.data }; for (const k of Object.keys(d)) if (typeof d[k] === 'string') d[k] = d[k].replace(/—/g, ',')
      const old = await fetchRow(kind, row.id, edit.code); await saveRow(kind, row.id, edit.code, { ...(old?.data || {}), ...d }, hash, true); onNotice('Translation saved. It will not be overwritten by automatic translation.'); setEdit(null); load() } catch (e) { onError(e.message) }
  }
  async function remove(code) { if (!confirm('Delete this translation? The page in that language will stop being indexed.')) return; try { await deleteRow(kind, row.id, code); load() } catch (e) { onError(e.message) } }
  if (!settings.i18n_enabled) return null
  const pill = s => <span className={`adm-pill ${s === 'ready' ? 'green' : s === 'missing' ? '' : 'amber'}`}>{s === 'ready' ? 'translated' : s}</span>
  return <section className="adm-card"><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
    <h3 style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}><Languages size={17}/> Translations</h3>
    <button type="button" className="adm-btn sm primary" disabled={!!busy || !langs.length} onClick={() => run(langs.map(l => l.code), false)}><RefreshCw size={13}/> {busy === 'all' ? 'Translating…' : 'Translate all languages'}</button></div>
    <p className="adm-sub">Save the {kind === 'mod' ? 'listing' : 'post'} first, then translate. Each language gets its own page and link. Missing or outdated translations are filled in here, and on every publish when automatic translation is on.</p>
    {rows === null ? <p>Loading…</p> : langs.map(l => { const s = status(l.code); return <div className="adm-tr-row" key={l.code}>
      <div><b>{l.name}</b> {pill(s)}<br/><small>{withLang(path, l.code)}</small></div>
      <div className="adm-actions" style={{ margin: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" className="adm-btn sm" disabled={!!busy} onClick={() => run([l.code], s !== 'missing' && s !== 'outdated')}>{busy === l.code ? '…' : s === 'missing' ? 'Translate' : 'Re-translate'}</button>
        {s !== 'missing' && <><button type="button" className="adm-btn sm" onClick={() => openEdit(l.code)}><Pencil size={13}/> Edit</button><ShareLinkButton path={withLang(path, l.code)} title={row.title} onNotice={onNotice}/><button type="button" className="adm-btn sm danger" onClick={() => remove(l.code)} aria-label="Delete translation"><Trash2 size={13}/></button></>}
      </div></div> })}
    {edit && <div className="adm-card" style={{ marginTop: 12, display: 'grid', gap: 10, border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Edit {LANGS.find(l => l.code === edit.code)?.name}</b><button type="button" className="adm-btn sm" onClick={() => setEdit(null)}><X size={13}/></button></div>
      {[['title', 'Title'], ['excerpt', 'Short description'], ['seo_title', 'SEO title'], ['seo_description', 'Meta description'], ['og_title', 'Social title'], ['og_description', 'Social description']].map(([k, label]) =>
        <label className="adm-field" key={k}><span>{label}</span><input value={edit.data[k] || ''} onChange={e => setEdit(x => ({ ...x, data: { ...x.data, [k]: e.target.value } }))} dir={['ar', 'ur'].includes(edit.code) ? 'rtl' : 'ltr'}/></label>)}
      <label className="adm-field"><span>Content (HTML)</span><textarea rows={12} value={edit.data.content || ''} onChange={e => setEdit(x => ({ ...x, data: { ...x.data, content: e.target.value } }))} style={{ fontFamily: 'ui-monospace,Menlo,Consolas,monospace', fontSize: 13 }} dir={['ar', 'ur'].includes(edit.code) ? 'rtl' : 'ltr'}/></label>
      <div className="adm-actions"><button type="button" className="adm-btn primary" onClick={saveEdit}><Save size={14}/> Save translation</button></div></div>}
  </section>
}
