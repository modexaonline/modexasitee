import { useEffect, useMemo, useState } from 'react'
import { Pencil, ExternalLink, RotateCcw, Plus, ArrowLeft, Save, FilePlus2, Info, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import AdminPageBuilder from './AdminPageBuilder'
import { supabase } from '../lib/supabase'
import { PAGES } from '../content/legal'
import { LISTING } from '../content/seo'
import { HOME_DEFAULT, NAV_DEFAULT, mergeContent } from '../content/merge'
import { setContentCache } from '../lib/siteContent'
import { editSitemap } from '../lib/sitemapAdmin'
import { isPathHidden, SECTION_PATHS, norm, hrefOfMod, hrefOfPost, HOME_SECTIONS, homeHidden } from '../lib/hidden'
import { Counter, Move, moveItem, lines, paras, slugify, FaqEditor, ListBox, ParaBox, Switch } from './fields'
import { cleanList } from '../lib/formatText'
import './admin-extra.css'

const LISTING_NAMES = { apps: 'Apps', games: 'Games', guide: 'Guide', blog: 'Blog', submit: 'Submit a game' }
const ROWS = [
  { key: 'home', name: 'Home page', url: '/', group: 'Home', kind: 'home', defaults: { ...LISTING.home, ...HOME_DEFAULT } },
  ...Object.values(PAGES).map(p => ({ key: 'page:' + p.slug, name: p.title, url: '/' + p.slug, group: 'Information & policy pages', kind: 'page', defaults: p })),
  ...Object.entries(LISTING_NAMES).filter(([k]) => k !== 'home').map(([k, name]) => ({ key: 'listing:' + k, name, url: LISTING[k].path, group: 'Listing pages', kind: 'listing', defaults: LISTING[k] })),
]
const clone = o => JSON.parse(JSON.stringify(o))
const MD_HELP = 'Tip: **bold**, and links like [Contact](/contact) or [Site](https://example.com).'

function toEditSections(sections = []) { return sections.map(s => ({ id: s.id, h: s.h || '', paras: (s.p || []).join('\n\n'), bullets: (s.ul || []).join('\n'), steps: (s.ol || []).join('\n'), note: s.note || '', table: s.table })) }
function fromEditSections(list) {
  const used = new Set()
  return list.filter(s => s.h.trim() || s.paras.trim() || s.bullets.trim() || s.steps.trim()).map(s => {
    let id = s.id || slugify(s.h) || 'section'; let n = 2; const base = id; while (used.has(id)) id = `${base}-${n++}`; used.add(id)
    const out = { id, h: s.h.trim() }
    if (paras(s.paras).length) out.p = paras(s.paras)
    if (cleanList(s.bullets).length) out.ul = cleanList(s.bullets)
    if (cleanList(s.steps).length) out.ol = cleanList(s.steps)
    if (s.table) out.table = s.table
    if (s.note.trim()) out.note = s.note.trim()
    return out
  })
}

function Pair({ items, onChange, a = 't', b = 'd', la = 'Title', lb = 'Text', add = 'Add item', rows = 2 }) {
  return <div className="adm-repeat">{items.map((it, i) => <div className="adm-item" key={i}>
    <div className="adm-item-head"><b>#{i + 1}</b><Move i={i} n={items.length} onMove={(x, d) => onChange(moveItem(items, x, d))} onRemove={x => onChange(items.filter((_, k) => k !== x))}/></div>
    <label className="adm-field"><span>{la}</span><input value={it[a] || ''} onChange={e => onChange(items.map((x, k) => k === i ? { ...x, [a]: e.target.value } : x))}/></label>
    <label className="adm-field"><span>{lb}</span><textarea rows={rows} value={it[b] || ''} onChange={e => onChange(items.map((x, k) => k === i ? { ...x, [b]: e.target.value } : x))}/></label>
  </div>)}<button type="button" className="adm-btn" onClick={() => onChange([...items, { [a]: '', [b]: '' }])}><Plus size={15}/> {add}</button></div>
}

function ContentEditor({ row, saved, onBack, onSaved, onNotice, onError }) {
  const start = useMemo(() => { const m = clone(mergeContent(row.defaults, saved)); return m }, [row.key])
  const [d, setD] = useState(() => ({ ...start, sections: toEditSections(start.sections), steps: start.steps || [], values: start.values || [], faqs: start.faqs || [], answer: start.answer || { q: '', a: '' }, hero: start.hero, headings: start.headings, cta: start.cta, hiddenSections: homeHidden(start) }))
  const [busy, setBusy] = useState(false)
  const set = p => setD(x => ({ ...x, ...p }))
  const setIn = (k, p) => setD(x => ({ ...x, [k]: { ...x[k], ...p } }))
  const secSet = (i, p) => set({ sections: d.sections.map((s, k) => k === i ? { ...s, ...p } : s) })

  async function save() {
    const data = { seoTitle: d.seoTitle, description: d.description, h1: d.h1, answer: d.answer, sections: fromEditSections(d.sections), faqs: d.faqs.filter(f => f.q.trim() && f.a.trim()) }
    if (row.kind === 'page') data.eyebrow = d.eyebrow
    if (row.kind === 'home') Object.assign(data, { hero: d.hero, headings: d.headings, steps: d.steps.filter(s => s.t.trim()), values: d.values.filter(s => s.t.trim()), cta: d.cta, hiddenSections: d.hiddenSections })
    if (!data.seoTitle.trim() || !data.description.trim()) return onError('SEO title and meta description are required.')
    setBusy(true)
    const { error } = await supabase.from('site_content').upsert({ key: row.key, data }, { onConflict: 'key' })
    setBusy(false)
    if (error) return onError(error.message)
    setContentCache(row.key, data); onSaved(row.key, data); onNotice('Saved. The live site shows it immediately; redeploy to refresh the static (SEO) copy.')
  }
  async function reset() {
    if (!confirm('Reset this page to the built-in default text? Your edits will be removed.')) return
    const { error } = await supabase.from('site_content').delete().eq('key', row.key)
    if (error) return onError(error.message)
    setContentCache(row.key, null); onSaved(row.key, null); onNotice('Reset to default.'); onBack()
  }
  return <div className="adm">
    <div className="adm-head"><div><button type="button" className="adm-btn sm" onClick={onBack}><ArrowLeft size={14}/> All pages</button><h2 style={{ marginTop: 12 }}>Edit: {row.name}</h2><p>{row.url} · {saved ? <span className="adm-pill green">Customized</span> : <span className="adm-pill">Default text</span>}</p></div>
      <div className="adm-actions"><a className="adm-btn" href={row.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> View page</a>{saved && <button type="button" className="adm-btn danger" onClick={reset}><RotateCcw size={15}/> Reset to default</button>}<button type="button" className="adm-btn primary" onClick={save} disabled={busy}><Save size={15}/> {busy ? 'Saving…' : 'Save page'}</button></div></div>

    <section className="adm-card"><h3>Search & sharing (SEO)</h3><p className="adm-sub">What Google, AI assistants and social apps show for this page.</p>
      <label className="adm-field"><span>SEO title</span><input value={d.seoTitle || ''} onChange={e => set({ seoTitle: e.target.value })}/><Counter value={d.seoTitle} min={30} max={60}/></label>
      <label className="adm-field" style={{ marginTop: 14 }}><span>Meta description</span><textarea rows={3} value={d.description || ''} onChange={e => set({ description: e.target.value })}/><Counter value={d.description} min={110} max={160}/></label></section>

    {row.kind === 'home' && <>
      <section className="adm-card"><h3>Show / hide home page sections</h3><p className="adm-sub">Switch a block off to remove it from the home page. Click Save to apply. Turn it on again any time. Apps / Games / Submit blocks also disappear by themselves while that page is hidden.</p>
        <div className="adm-repeat">{HOME_SECTIONS.map(x => <div className="adm-item" key={x.k} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginLeft: x.part ? 22 : 0, padding: '10px 14px' }}><span style={{ fontWeight: x.part ? 500 : 700 }}>{x.label}</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><small style={{ color: '#6b7280' }}>{d.hiddenSections.includes(x.k) ? 'Hidden' : 'Visible'}</small><Switch checked={!d.hiddenSections.includes(x.k)} label={x.label} onChange={v => set({ hiddenSections: v ? d.hiddenSections.filter(k => k !== x.k) : [...d.hiddenSections, x.k] })}/></span></div>)}</div></section>
      <section className="adm-card"><h3>Hero (top of home page)</h3>
        <div className="adm-grid2"><label className="adm-field"><span>Small label above heading</span><input value={d.hero.eyebrow} onChange={e => setIn('hero', { eyebrow: e.target.value })}/></label><label className="adm-field"><span>Search box placeholder</span><input value={d.hero.searchPlaceholder} onChange={e => setIn('hero', { searchPlaceholder: e.target.value })}/></label></div>
        <div className="adm-grid2" style={{ marginTop: 14 }}><label className="adm-field"><span>Heading, line 1 (black)</span><input value={d.hero.line1} onChange={e => setIn('hero', { line1: e.target.value })}/></label><label className="adm-field"><span>Heading, line 2 (green)</span><input value={d.hero.line2} onChange={e => setIn('hero', { line2: e.target.value })}/></label></div>
        <label className="adm-field" style={{ marginTop: 14 }}><span>Intro paragraph</span><textarea rows={3} value={d.hero.description} onChange={e => setIn('hero', { description: e.target.value })}/></label></section>
      <section className="adm-card"><h3>Section headings</h3><p className="adm-sub">Title + green accent word + short text for each home section.</p><div className="adm-repeat">{Object.entries({ featured: 'Featured mods', games: 'Browse by game', categories: 'Categories', how: 'How it works', why: 'Why Modexa' }).map(([k, label]) => <div className="adm-item" key={k}><b style={{ fontSize: 13, color: '#4b5563' }}>{label.toUpperCase()}</b><div className="adm-grid2"><label className="adm-field"><span>Title</span><input value={d.headings[k].title} onChange={e => setIn('headings', { [k]: { ...d.headings[k], title: e.target.value } })}/></label><label className="adm-field"><span>Green accent word(s)</span><input value={d.headings[k].accent} onChange={e => setIn('headings', { [k]: { ...d.headings[k], accent: e.target.value } })}/></label></div><label className="adm-field"><span>Sub text</span><input value={d.headings[k].text} onChange={e => setIn('headings', { [k]: { ...d.headings[k], text: e.target.value } })}/></label></div>)}</div></section>
      <section className="adm-card"><h3>“How it works” steps</h3><Pair items={d.steps} onChange={steps => set({ steps })} add="Add step"/></section>
      <section className="adm-card"><h3>“Why Modexa” cards</h3><Pair items={d.values} onChange={values => set({ values })} add="Add card"/></section>
      <section className="adm-card"><h3>Call-to-action band</h3><div className="adm-grid2"><label className="adm-field"><span>Title</span><input value={d.cta.title} onChange={e => setIn('cta', { title: e.target.value })}/></label><label className="adm-field"><span>Button text</span><input value={d.cta.buttonText} onChange={e => setIn('cta', { buttonText: e.target.value })}/></label></div><div className="adm-grid2" style={{ marginTop: 14 }}><label className="adm-field"><span>Text</span><input value={d.cta.text} onChange={e => setIn('cta', { text: e.target.value })}/></label><label className="adm-field"><span>Button link</span><input value={d.cta.buttonLink} onChange={e => setIn('cta', { buttonLink: e.target.value })}/></label></div></section>
    </>}

    <section className="adm-card"><h3>Page heading</h3>
      <div className="adm-grid2"><label className="adm-field"><span>Main heading (H1)</span><input value={d.h1 || ''} onChange={e => set({ h1: e.target.value })}/><span className="adm-hint">Only one per page. Keep it clear and descriptive.</span></label>{row.kind === 'page' && <label className="adm-field"><span>Small label above heading</span><input value={d.eyebrow || ''} onChange={e => set({ eyebrow: e.target.value })}/></label>}</div></section>

    <section className="adm-card"><h3>Quick answer box</h3><p className="adm-sub">A short, direct answer at the top. Search engines and AI assistants love quoting it.</p>
      <label className="adm-field"><span>Question</span><input value={d.answer.q || ''} onChange={e => setIn('answer', { q: e.target.value })}/></label>
      <label className="adm-field" style={{ marginTop: 14 }}><span>Answer (about 40–60 words)</span><textarea rows={3} value={d.answer.a || ''} onChange={e => setIn('answer', { a: e.target.value })}/><span className="adm-hint">{MD_HELP}</span></label></section>

    <section className="adm-card"><h3>Content sections</h3><p className="adm-sub">Each section has a heading plus paragraphs, bullet points or numbered steps. {MD_HELP}</p>
      <div className="adm-repeat">{d.sections.map((s, i) => <div className="adm-item" key={i}>
        <div className="adm-item-head"><b>SECTION {i + 1}</b><Move i={i} n={d.sections.length} label="section" onMove={(x, dd) => set({ sections: moveItem(d.sections, x, dd) })} onRemove={x => set({ sections: d.sections.filter((_, k) => k !== x) })}/></div>
        <label className="adm-field"><span>Heading</span><input value={s.h} onChange={e => secSet(i, { h: e.target.value })}/></label>
        <ParaBox label={<>Paragraphs <small style={{ fontWeight: 400 }}>(blank line between paragraphs, auto-formats when you paste)</small></>} value={s.paras} onChange={v => secSet(i, { paras: v })}/>
        <div className="adm-grid2"><ListBox rows={3} suffix="" label={<>Bullet points <small style={{ fontWeight: 400 }}>(one per line, auto-cleans)</small></>} value={s.bullets} onChange={v => secSet(i, { bullets: v })}/><ListBox rows={3} suffix="" label={<>Numbered steps <small style={{ fontWeight: 400 }}>(one per line, auto-cleans)</small></>} value={s.steps} onChange={v => secSet(i, { steps: v })}/></div>
        <label className="adm-field"><span>Highlighted note (optional)</span><textarea rows={2} value={s.note} onChange={e => secSet(i, { note: e.target.value })}/></label>
        {s.table && <p className="adm-hint"><Info size={12}/> This section contains a table, which is kept as-is.</p>}
      </div>)}<button type="button" className="adm-btn" onClick={() => set({ sections: [...d.sections, { id: '', h: '', paras: '', bullets: '', steps: '', note: '' }] })}><Plus size={15}/> Add section</button></div></section>

    <section className="adm-card"><h3>FAQs</h3><p className="adm-sub">Shown as an accordion and sent to search engines as FAQ schema. Paste your whole FAQ list in the top box and it splits into separate FAQs automatically.</p><FaqEditor items={d.faqs} onChange={faqs => set({ faqs })}/></section>
    <div className="adm-actions"><button type="button" className="adm-btn primary" onClick={save} disabled={busy}><Save size={15}/> {busy ? 'Saving…' : 'Save page'}</button><button type="button" className="adm-btn" onClick={onBack}>Back</button></div>
  </div>
}

function NavEditor({ saved, onSaved, onNotice, onError }) {
  const [nav, setNav] = useState(() => clone(mergeContent(NAV_DEFAULT, saved))), [busy, setBusy] = useState(false)
  const hdr = nav.header, ftr = nav.footer
  const setH = header => setNav({ ...nav, header }), setF = footer => setNav({ ...nav, footer })
  const okTo = t => /^\/|^https?:\/\//.test(String(t).trim())
  async function save() {
    const bad = [...hdr, ...ftr.flatMap(g => g.links)].find(l => !l.label.trim() || !okTo(l.to))
    if (bad) return onError(`Every link needs a label and a URL starting with / or https:// (check “${bad.label || 'empty'}”).`)
    setBusy(true)
    const data = { header: hdr.map(l => ({ label: l.label.trim(), to: l.to.trim() })), footer: ftr.map(g => ({ title: g.title.trim(), links: g.links.map(l => ({ label: l.label.trim(), to: l.to.trim() })) })) }
    const { error } = await supabase.from('site_content').upsert({ key: 'nav', data }, { onConflict: 'key' }); setBusy(false)
    if (error) return onError(error.message)
    setContentCache('nav', data); onSaved('nav', data); onNotice('Navigation saved.')
  }
  async function reset() { if (!confirm('Reset menus to default?')) return; const { error } = await supabase.from('site_content').delete().eq('key', 'nav'); if (error) return onError(error.message); setContentCache('nav', null); onSaved('nav', null); setNav(clone(NAV_DEFAULT)); onNotice('Menus reset.') }
  const linkRow = (l, i, arr, setArr) => <div className="adm-grid2" key={i} style={{ gridTemplateColumns: '1fr 1.3fr auto', alignItems: 'end' }}>
    <label className="adm-field"><span>Label</span><input value={l.label} onChange={e => setArr(arr.map((x, k) => k === i ? { ...x, label: e.target.value } : x))}/></label>
    <label className="adm-field"><span>URL</span><input value={l.to} onChange={e => setArr(arr.map((x, k) => k === i ? { ...x, to: e.target.value } : x))} placeholder="/page or https://…"/></label>
    <Move i={i} n={arr.length} onMove={(x, d) => setArr(moveItem(arr, x, d))} onRemove={x => setArr(arr.filter((_, k) => k !== x))}/></div>
  return <div className="adm">
    <div className="adm-head"><div><h2>Navigation & footer menus</h2><p>Reorder, rename, add or remove links. Custom pages that you tick “show in menu / footer” are added automatically.</p></div><div className="adm-actions"><button className="adm-btn danger" onClick={reset}><RotateCcw size={15}/> Reset</button><button className="adm-btn primary" onClick={save} disabled={busy}><Save size={15}/> {busy ? 'Saving…' : 'Save menus'}</button></div></div>
    <section className="adm-card"><h3>Header menu</h3><p className="adm-sub">Shown at the top of every page. Keep it to 5–7 links.</p><div className="adm-repeat">{hdr.map((l, i) => linkRow(l, i, hdr, setH))}<button type="button" className="adm-btn" onClick={() => setH([...hdr, { label: '', to: '/' }])}><Plus size={15}/> Add link</button></div></section>
    <section className="adm-card"><h3>Footer columns</h3><div className="adm-repeat">{ftr.map((g, gi) => <div className="adm-item" key={gi}>
      <div className="adm-item-head"><label className="adm-field" style={{ flex: 1 }}><span>Column title</span><input value={g.title} onChange={e => setF(ftr.map((x, k) => k === gi ? { ...x, title: e.target.value } : x))}/></label><Move i={gi} n={ftr.length} label="column" onMove={(x, d) => setF(moveItem(ftr, x, d))} onRemove={x => setF(ftr.filter((_, k) => k !== x))}/></div>
      {g.links.map((l, i) => linkRow(l, i, g.links, links => setF(ftr.map((x, k) => k === gi ? { ...x, links } : x))))}
      <button type="button" className="adm-btn sm" onClick={() => setF(ftr.map((x, k) => k === gi ? { ...x, links: [...x.links, { label: '', to: '/' }] } : x))}><Plus size={14}/> Add link</button>
    </div>)}<button type="button" className="adm-btn" onClick={() => setF([...ftr, { title: 'New column', links: [{ label: '', to: '/' }] }])}><Plus size={15}/> Add column</button></div></section>
  </div>
}

export default function AdminWebsite({ onNotice, onError }) {
  const [tab, setTab] = useState('pages'), [store, setStore] = useState({}), [loading, setLoading] = useState(true), [edit, setEdit] = useState(null), [custom, setCustom] = useState([]), [builder, setBuilder] = useState(null)
  async function load() {
    setLoading(true)
    const [c, p] = await Promise.all([supabase.from('site_content').select('key,data,updated_at'), supabase.from('pages').select('*').order('created_at', { ascending: false })])
    setLoading(false)
    if (c.error) return onError(c.error.message)
    const m = {}; (c.data || []).forEach(r => { m[r.key] = { data: r.data, updated_at: r.updated_at } }); setStore(m); setCustom(p.data || [])
  }
  useEffect(() => { load() }, [])
  const hiddenList = Array.isArray(store.visibility?.data?.hidden) ? store.visibility.data.hidden : []
  // Hide / unhide a built-in page: saved in site_content('visibility'), live instantly, and removed from / added back to the live sitemap.xml automatically.
  async function setHidden(row, hide) {
    const path = norm(row.url)
    if (hide && !confirm(`Hide “${row.name}” (${path}) from the website?\n\nVisitors will see “page not found”, it disappears from menus, search and the sitemap. You can unhide it any time.${SECTION_PATHS.includes(path) ? '\n\nAll pages inside it are hidden too.' : ''}`)) return
    const next = hide ? [...new Set([...hiddenList, path])] : hiddenList.filter(h => norm(h) !== path)
    const data = { hidden: next }
    const { error } = await supabase.from('site_content').upsert({ key: 'visibility', data }, { onConflict: 'key' })
    if (error) return onError(error.message)
    setContentCache('visibility', data); onSaved('visibility', data)
    try {
      if (hide) { const r = await editSitemap({ removeIf: p => isPathHidden([path], p) }); onNotice(`Hidden. ${r.removed ? `${r.removed} URL${r.removed > 1 ? 's' : ''} removed from the sitemap.` : 'It was not in the sitemap.'}`) }
      else {
        const add = [path]
        if (SECTION_PATHS.includes(path)) {
          if (path === '/apps' || path === '/games') { const r = await supabase.from('mods').select('slug,listing_type').eq('status', 'published').eq('listing_type', path === '/games' ? 'game' : 'app').eq('noindex', false); (r.data || []).forEach(m => add.push(hrefOfMod(m))) }
          else { const r = await supabase.from('posts').select('slug,post_type').eq('status', 'published').eq('noindex', false).eq('post_type', path === '/guide' ? 'guide' : 'blog'); (r.data || []).forEach(p => add.push(hrefOfPost(p))) }
        }
        const r = await editSitemap({ add }); onNotice(`Visible again. ${r.added} URL${r.added === 1 ? '' : 's'} added back to the sitemap.`)
      }
    } catch (e) { onError(`Page ${hide ? 'hidden' : 'unhidden'}, but the sitemap could not be updated: ${e.message}`) }
  }
  const onSaved = (key, data) => setStore(s => { const n = { ...s }; if (data) n[key] = { data, updated_at: new Date().toISOString() }; else delete n[key]; return n })
  async function dupPage(pg) { const { id, created_at, updated_at, ...rest } = pg; const { error } = await supabase.from('pages').insert({ ...rest, title: pg.title + ' (copy)', slug: pg.slug + '-copy-' + Math.random().toString(36).slice(2, 5), status: 'draft', show_in_menu: false }); if (error) return onError(error.message); onNotice('Page duplicated as a draft.'); load() }
  async function togglePage(pg) { const next = pg.status === 'published' ? 'draft' : 'published'; const { error } = await supabase.from('pages').update({ status: next }).eq('id', pg.id); if (error) return onError(error.message); load()
    try { await editSitemap(next === 'published' ? { add: ['/page/' + pg.slug] } : { removeIf: p => p === '/page/' + pg.slug }); onNotice(next === 'published' ? 'Page is live and added to the sitemap.' : 'Page hidden (draft) and removed from the sitemap.') } catch { onNotice(next === 'published' ? 'Page is live.' : 'Page moved to draft.') } }
  async function delPage(pg) { if (!confirm(`Delete the page “${pg.title}” permanently? This cannot be undone.`)) return; const { error } = await supabase.from('pages').delete().eq('id', pg.id); if (error) return onError(error.message); onNotice('Page deleted.'); load() }
  async function resetRow(r) { if (!confirm(`Reset “${r.name}” to its default text?`)) return; const { error } = await supabase.from('site_content').delete().eq('key', r.key); if (error) return onError(error.message); setContentCache(r.key, null); onSaved(r.key, null); onNotice('Reset to default.') }
  if (builder !== null) return <AdminPageBuilder page={builder.id ? builder : null} onBack={() => { setBuilder(null); load() }} onSaved={() => load()} onNotice={onNotice} onError={onError}/>
  if (edit) return <ContentEditor row={edit} saved={store[edit.key]?.data} onBack={() => setEdit(null)} onSaved={onSaved} onNotice={onNotice} onError={onError}/>
  const groups = ['Home', 'Information & policy pages', 'Listing pages']
  return <div className="adm">
    <div className="adm-head"><div><h2>Website editor</h2><p>Edit every page of the site, text, SEO, FAQs, menus, and build new pages with sections. Changes show on the live site immediately.</p></div><button className="adm-btn primary" onClick={() => setBuilder({})}><FilePlus2 size={15}/> Add new page</button></div>
    <div className="adm-tabs" role="tablist">{[['pages', 'Pages'], ['nav', 'Navigation & footer']].map(([k, l]) => <button key={k} role="tab" className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'nav' ? <NavEditor saved={store.nav?.data} onSaved={onSaved} onNotice={onNotice} onError={onError}/> : loading ? <p style={{ color: '#6b7280' }}>Loading…</p> : <>
      <section className="adm-card" style={{ padding: 0 }}><h3 style={{ padding: '16px 20px 0' }}>Your pages</h3><p className="adm-sub" style={{ padding: '0 20px' }}>Pages you created with the page builder.</p>
        {custom.length === 0 ? <p style={{ padding: '4px 20px 22px', color: '#6b7280' }}>No custom pages yet. Click “Add new page”.</p> : <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Page</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead><tbody>{custom.map(pg => <tr key={pg.id}>
          <td><div className="adm-name"><b>{pg.title}</b><small>{(pg.blocks || []).length} sections{pg.show_in_menu ? ' · in menu' : ''}{pg.show_in_footer ? ' · in footer' : ''}</small></div></td><td><code className="adm-code-chip">/page/{pg.slug}</code></td>
          <td><span className={`adm-pill ${pg.status === 'published' ? 'green' : 'amber'}`}>{pg.status === 'published' ? 'Published' : 'Draft'}</span></td>
          <td><div className="adm-actions"><button className="adm-btn sm primary" onClick={() => setBuilder(pg)}><Pencil size={14}/> Edit</button><a className="adm-btn sm" href={`/page/${pg.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> View</a><button className="adm-btn sm" onClick={() => togglePage(pg)} title={pg.status === 'published' ? 'Unpublish' : 'Publish'}>{pg.status === 'published' ? <EyeOff size={14}/> : <Eye size={14}/>}</button><button className="adm-btn sm" onClick={() => dupPage(pg)} title="Duplicate"><Copy size={14}/></button><button className="adm-btn sm danger" onClick={() => delPage(pg)}><Trash2 size={14}/> Delete</button></div></td></tr>)}</tbody></table></div>}</section>
      {groups.map(g => <section className="adm-card" style={{ padding: 0 }} key={g}>
        <h3 style={{ padding: '16px 20px 0' }}>{g}</h3>
        <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Page</th><th>Address</th><th>Status</th><th>Last edited</th><th>Actions</th></tr></thead><tbody>{ROWS.filter(r => r.group === g).map(r => { const s = store[r.key]; return <tr key={r.key}>
          <td><div className="adm-name"><b>{r.name}</b></div></td><td><code className="adm-code-chip">{r.url}</code></td>
          <td>{isPathHidden(hiddenList, r.url) && <span className="adm-pill amber" style={{ marginRight: 6 }}>Hidden</span>}{s ? <span className="adm-pill green">Customized</span> : <span className="adm-pill">Default</span>}</td>
          <td style={{ color: '#6b7280' }}>{s ? new Date(s.updated_at).toLocaleDateString() : ', '}</td>
          <td><div className="adm-actions"><button className="adm-btn sm primary" onClick={() => setEdit(r)}><Pencil size={14}/> Edit</button><a className="adm-btn sm" href={r.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> View</a>{r.kind !== 'home' && (isPathHidden(hiddenList, r.url) ? <button className="adm-btn sm primary" onClick={() => setHidden(r, false)} title="Show this page on the website again"><Eye size={14}/> Unhide</button> : <button className="adm-btn sm" onClick={() => setHidden(r, true)} title="Temporarily hide this page from the website, menus, search and sitemap"><EyeOff size={14}/> Hide</button>)}{s && <button className="adm-btn sm danger" onClick={() => resetRow(r)} title="Remove your edits and restore the default text"><RotateCcw size={14}/> Reset</button>}</div></td>
        </tr> })}</tbody></table></div></section>)}
    </>}
  </div>
}
