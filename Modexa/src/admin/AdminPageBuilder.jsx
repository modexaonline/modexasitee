import { useEffect, useState } from 'react'
import { LayoutTemplate, Type, Image as ImageIcon, MousePointerClick, Columns3, LayoutGrid, HelpCircle, Code2, Megaphone, Sparkles, Minus, MoveVertical, ChevronDown, ChevronUp, Copy, Trash2, Plus, ArrowUp, ArrowDown, X, ArrowLeft, ExternalLink, Newspaper, Heading, PanelLeft, Star, BarChart3, ListOrdered, MessageSquare, Play, Images, Info, Quote, Table, Mail, Eye, GripVertical, ChevronsUpDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BUTTON_TEMPLATES } from '../lib/buttonTemplates'
import RichEditor from './RichEditor'
import { ImageField, Counter, slugify, moveItem, FaqEditor } from './fields'
import { ExtraBody, StyleBody } from './BlockEditors'
import { PAGE_TEMPLATES } from '../lib/pageTemplates'
import './admin-extra.css'

export const BLOCKS = [
  { type: 'hero', name: 'Hero banner', desc: 'Big heading, text and a button, great at the top', icon: LayoutTemplate, def: () => ({ title: 'Your heading', subtitle: '', buttonLabel: '', buttonUrl: '', image: '', align: 'center' }) },
  { type: 'text', name: 'Text', desc: 'Rich text with headings, images and buttons', icon: Type, def: () => ({ html: '<p>Start writing…</p>' }) },
  { type: 'image', name: 'Image', desc: 'One image with caption and optional link', icon: ImageIcon, def: () => ({ src: '', alt: '', caption: '', link: '', width: 100 }) },
  { type: 'buttons', name: 'Buttons', desc: 'Download / buy / shop buttons from templates or your own images', icon: MousePointerClick, def: () => ({ align: 'center', items: [{ tpl: 'dl-green', label: 'Download', url: '', wait: 30, img: '' }] }) },
  { type: 'columns', name: 'Columns', desc: '2–3 columns of text side by side', icon: Columns3, def: () => ({ cols: [{ html: '<p>Column one</p>' }, { html: '<p>Column two</p>' }] }) },
  { type: 'cards', name: 'Cards', desc: 'A grid of cards with image, title, text and link', icon: LayoutGrid, def: () => ({ title: '', items: [{ title: 'Card title', text: '', url: '', image: '' }] }) },
  { type: 'faq', name: 'FAQ', desc: 'Questions and answers (adds FAQ schema for Google)', icon: HelpCircle, def: () => ({ title: 'Frequently asked questions', items: [{ q: '', a: '' }] }) },
  { type: 'listing', name: 'Latest apps / games / posts', desc: 'Automatically shows your newest content', icon: Newspaper, def: () => ({ kind: 'app', count: 3, title: 'Latest apps' }) },
  { type: 'cta', name: 'Call to action', desc: 'Dark band with a heading and a button', icon: Sparkles, def: () => ({ title: 'Ready to start?', text: '', buttonLabel: 'Get started', buttonUrl: '/apps' }) },
  { type: 'code', name: 'Custom code / embed', desc: 'Paste any script, widget or ad code', icon: Code2, def: () => ({ code: '', w: 0, h: 250 }) },
  { type: 'ad', name: 'Ad slot', desc: 'Show one of your ads from the Ads manager', icon: Megaphone, def: () => ({ key: '' }) },
  { type: 'heading', name: 'Heading', desc: 'A section title with optional sub text', icon: Heading, def: () => ({ text: 'Section heading', level: 'h2', align: 'center', sub: '' }) },
  { type: 'imagetext', name: 'Image and text', desc: 'Picture on one side, text and button on the other', icon: PanelLeft, def: () => ({ image: '', title: 'Heading', text: 'Write something here.', side: 'left', buttonLabel: '', buttonUrl: '' }) },
  { type: 'features', name: 'Feature boxes', desc: 'Icon boxes in 2 to 4 columns', icon: Star, def: () => ({ title: '', cols: 3, items: [{ icon: 'zap', title: 'Feature', text: '' }, { icon: 'shield', title: 'Feature', text: '' }, { icon: 'gift', title: 'Feature', text: '' }] }) },
  { type: 'stats', name: 'Numbers', desc: 'Big numbers like 10K+ downloads', icon: BarChart3, def: () => ({ items: [{ value: '100+', label: 'Apps' }, { value: '50+', label: 'Games' }, { value: '24/7', label: 'Support' }] }) },
  { type: 'steps', name: 'Steps', desc: 'A numbered how-to list', icon: ListOrdered, def: () => ({ title: 'How it works', items: [{ title: 'Step one', text: '' }, { title: 'Step two', text: '' }] }) },
  { type: 'testimonials', name: 'Reviews', desc: 'Quotes from real users', icon: MessageSquare, def: () => ({ title: '', items: [{ quote: '', name: '', role: '', avatar: '' }] }) },
  { type: 'video', name: 'Video', desc: 'YouTube, Vimeo or a video file', icon: Play, def: () => ({ url: '', caption: '' }) },
  { type: 'gallery', name: 'Image gallery', desc: 'A grid of pictures', icon: Images, def: () => ({ title: '', cols: 3, images: [{ src: '', alt: '' }] }) },
  { type: 'notice', name: 'Notice box', desc: 'Info, success, warning or important message', icon: Info, def: () => ({ kind: 'info', title: 'Note', text: '' }) },
  { type: 'quote', name: 'Quote', desc: 'A highlighted quotation', icon: Quote, def: () => ({ text: '', author: '' }) },
  { type: 'table', name: 'Table', desc: 'Simple comparison table', icon: Table, def: () => ({ title: '', text: 'Name | Details\nRow one | Value', header: true }) },
  { type: 'contact', name: 'Contact form', desc: 'Visitors can message you', icon: Mail, def: () => ({ title: 'Contact us' }) },
  { type: 'divider', name: 'Divider', desc: 'A thin line between sections', icon: Minus, def: () => ({ size: 24 }) },
  { type: 'spacer', name: 'Spacer', desc: 'Empty vertical space', icon: MoveVertical, def: () => ({ size: 40 }) },
]
const meta = t => BLOCKS.find(b => b.type === t) || BLOCKS[1]
const uid = () => Math.random().toString(36).slice(2, 9)
const summary = b => { const d = b.data || {}; return ({ hero: d.title, text: String(d.html || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 70), image: d.caption || d.alt || d.src, buttons: (d.items || []).map(x => x.label).join(', '), columns: `${(d.cols || []).length} columns`, cards: d.title || `${(d.items || []).length} cards`, faq: `${(d.items || []).filter(x => x.q).length} questions`, listing: d.title, cta: d.title, code: String(d.code || '').slice(0, 50), ad: d.key, divider: '', spacer: `${d.size}px`, heading: d.text, imagetext: d.title, features: d.title || `${(d.items || []).length} boxes`, stats: (d.items || []).map(x => x.value).join(', '), steps: `${(d.items || []).length} steps`, testimonials: `${(d.items || []).length} reviews`, video: d.url, gallery: `${(d.images || []).filter(x => x.src).length} images`, notice: d.title || d.text, quote: d.text, table: d.title || 'Table', contact: d.title })[b.type] || '' }

function BlockBody({ b, set, ads, onNotice, onError }) {
  const d = b.data, up = p => set({ ...d, ...p })
  const list = (k, mk, render, add) => <div className="adm-repeat">{(d[k] || []).map((it, i) => <div className="adm-item" key={i}><div className="adm-item-head"><b>#{i + 1}</b><div className="adm-actions"><button type="button" className="adm-btn sm" disabled={i === 0} onClick={() => up({ [k]: moveItem(d[k], i, -1) })}><ArrowUp size={14}/></button><button type="button" className="adm-btn sm" disabled={i === d[k].length - 1} onClick={() => up({ [k]: moveItem(d[k], i, 1) })}><ArrowDown size={14}/></button><button type="button" className="adm-btn sm danger" onClick={() => up({ [k]: d[k].filter((_, j) => j !== i) })}><Trash2 size={14}/></button></div></div>{render(it, p => up({ [k]: d[k].map((x, j) => j === i ? { ...x, ...p } : x) }))}</div>)}<button type="button" className="adm-btn" onClick={() => up({ [k]: [...(d[k] || []), mk()] })}><Plus size={15}/> {add}</button></div>
  const F = ({ l, v, on, ph, type = 'text' }) => <label className="adm-field"><span>{l}</span><input type={type} value={v ?? ''} onChange={e => on(e.target.value)} placeholder={ph}/></label>
  switch (b.type) {
    case 'hero': return <div className="adm"><div className="adm-grid2"><F l="Heading" v={d.title} on={v => up({ title: v })}/><label className="adm-field"><span>Alignment</span><select value={d.align} onChange={e => up({ align: e.target.value })}><option value="center">Center</option><option value="left">Left</option></select></label></div><F l="Sub text" v={d.subtitle} on={v => up({ subtitle: v })}/><div className="adm-grid2"><F l="Button text" v={d.buttonLabel} on={v => up({ buttonLabel: v })}/><F l="Button link" v={d.buttonUrl} on={v => up({ buttonUrl: v })} ph="/apps or https://…"/></div><ImageField label="Background image (optional)" value={d.image} onChange={v => up({ image: v })} onError={onError}/></div>
    case 'text': return <RichEditor label="Text" value={d.html} onChange={v => up({ html: v })} ads={ads} onNotice={onNotice} onError={onError} minHeight={220}/>
    case 'image': return <div className="adm"><ImageField label="Image" value={d.src} onChange={v => up({ src: v })} onError={onError}/><div className="adm-grid2"><F l="Description (alt)" v={d.alt} on={v => up({ alt: v })}/><F l="Caption" v={d.caption} on={v => up({ caption: v })}/></div><div className="adm-grid2"><F l="Link (optional)" v={d.link} on={v => up({ link: v })} ph="https://…"/><label className="adm-field"><span>Width</span><select value={d.width} onChange={e => up({ width: +e.target.value })}>{[25, 50, 75, 100].map(w => <option key={w} value={w}>{w}%</option>)}</select></label></div></div>
    case 'buttons': return <div className="adm"><label className="adm-field" style={{ maxWidth: 220 }}><span>Alignment</span><select value={d.align} onChange={e => up({ align: e.target.value })}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label>{list('items', () => ({ tpl: 'dl-green', label: 'Download', url: '', wait: 30, img: '' }), (it, p) => <><div className="adm-grid2"><label className="adm-field"><span>Template</span><select value={it.tpl} onChange={e => p({ tpl: e.target.value })}>{BUTTON_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><F l="Text" v={it.label} on={v => p({ label: v })}/></div><div className="adm-grid2"><F l="Link (https://…)" v={it.url} on={v => p({ url: v })}/><F l="Wait seconds before redirect" v={it.wait} on={v => p({ wait: v })} type="number"/></div><ImageField label="…or use your own button image" value={it.img} onChange={v => p({ img: v })} onError={onError}/></>, 'Add button')}</div>
    case 'columns': return <div className="adm"><label className="adm-field" style={{ maxWidth: 200 }}><span>Columns</span><select value={d.cols.length} onChange={e => { const n = +e.target.value; up({ cols: Array.from({ length: n }, (_, i) => d.cols[i] || { html: '<p></p>' }) }) }}>{[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}</select></label>{d.cols.map((c, i) => <RichEditor key={i} label={`Column ${i + 1}`} value={c.html} onChange={v => up({ cols: d.cols.map((x, j) => j === i ? { html: v } : x) })} ads={ads} onNotice={onNotice} onError={onError} minHeight={140}/>)}</div>
    case 'cards': return <div className="adm"><F l="Section heading (optional)" v={d.title} on={v => up({ title: v })}/>{list('items', () => ({ title: '', text: '', url: '', image: '' }), (it, p) => <><div className="adm-grid2"><F l="Title" v={it.title} on={v => p({ title: v })}/><F l="Link" v={it.url} on={v => p({ url: v })} ph="/apps or https://…"/></div><label className="adm-field"><span>Text</span><textarea rows={2} value={it.text} onChange={e => p({ text: e.target.value })}/></label><ImageField label="Image (optional)" value={it.image} onChange={v => p({ image: v })} onError={onError}/></>, 'Add card')}</div>
    case 'faq': return <div className="adm"><F l="Heading" v={d.title} on={v => up({ title: v })}/><FaqEditor items={d.items} onChange={items => up({ items })}/></div>
    case 'listing': return <div className="adm-grid3"><label className="adm-field"><span>Show</span><select value={d.kind} onChange={e => up({ kind: e.target.value })}><option value="app">Apps</option><option value="game">Games</option><option value="guide">Guides</option><option value="blog">Blog posts</option></select></label><F l="How many (1–12)" v={d.count} on={v => up({ count: v })} type="number"/><F l="Heading" v={d.title} on={v => up({ title: v })}/></div>
    case 'cta': return <div className="adm"><F l="Heading" v={d.title} on={v => up({ title: v })}/><F l="Text" v={d.text} on={v => up({ text: v })}/><div className="adm-grid2"><F l="Button text" v={d.buttonLabel} on={v => up({ buttonLabel: v })}/><F l="Button link" v={d.buttonUrl} on={v => up({ buttonUrl: v })}/></div></div>
    case 'code': return <div className="adm"><label className="adm-field"><span>Code</span><textarea className="adm-code" spellCheck={false} value={d.code} onChange={e => up({ code: e.target.value })} placeholder="<script …></script>"/></label><div className="adm-grid2"><F l="Width px (0 = full width)" v={d.w} on={v => up({ w: +v || 0 })} type="number"/><F l="Height px" v={d.h} on={v => up({ h: +v || 250 })} type="number"/></div></div>
    case 'ad': return <label className="adm-field" style={{ maxWidth: 420 }}><span>Choose an ad</span><select value={d.key} onChange={e => up({ key: e.target.value })}><option value="">Select</option>{ads.map(a => <option key={a.slot_key} value={a.slot_key}>{a.name} · {a.kind === 'direct_link' ? 'direct link' : a.size}</option>)}</select></label>
    case 'divider': case 'spacer': return <label className="adm-field" style={{ maxWidth: 220 }}><span>Size (px)</span><input type="number" min="4" max="300" value={d.size} onChange={e => up({ size: +e.target.value || 24 })}/></label>
    default: return <ExtraBody b={b} up={up} onError={onError}/>
  }
}

const BLANK = { title: '', slug: '', excerpt: '', status: 'draft', show_in_menu: false, show_in_footer: false, seo_title: '', seo_description: '', canonical_url: '', noindex: false, cover_image: '', settings: { show_title: false, layout: 'default' }, blocks: [] }
export default function AdminPageBuilder({ page, onBack, onSaved, onNotice, onError }) {
  const [p, setP] = useState(() => { const base = { ...BLANK, ...(page || {}) }; if (!Array.isArray(base.blocks) || !base.blocks.length) base.blocks = page?.content ? [{ id: uid(), type: 'text', data: { html: page.content } }] : []; base.blocks = base.blocks.map(b => ({ ...b, id: b.id || uid() })); base.settings = { show_title: false, layout: 'default', ...(base.settings || {}) }; return base })
  const sig = x => JSON.stringify({ t: x.title, b: x.blocks.map(({ id, type, data, style }) => ({ id, type, data, style })) })
  const [snap, setSnap] = useState(null), [drag, setDrag] = useState(null), [pickTpl, setPickTpl] = useState(false)
  useEffect(() => { setSnap(sig(p)) }, [])
  const dirty = snap !== null && sig(p) !== snap
  useEffect(() => { if (!dirty) return; const h = e => { e.preventDefault(); e.returnValue = '' }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h) }, [dirty])
  const [open, setOpen] = useState(() => new Set()), [gallery, setGallery] = useState(null), [ads, setAds] = useState([]), [busy, setBusy] = useState(false)
  useEffect(() => { supabase.from('ad_units').select('slot_key,name,kind,size').then(({ data }) => setAds(data || [])) }, [])
  const set = patch => setP(x => ({ ...x, ...patch })), setBlocks = blocks => set({ blocks })
  const toggle = id => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const addBlock = (type, at) => { const m = meta(type), nb = { id: uid(), type, data: m.def() }, arr = [...p.blocks]; arr.splice(at ?? arr.length, 0, nb); setBlocks(arr); setOpen(s => new Set(s).add(nb.id)); setGallery(null) }
  const updBlock = (id, data) => setBlocks(p.blocks.map(b => b.id === id ? { ...b, data } : b))
  const dup = i => { const b = p.blocks[i], c = { ...b, id: uid(), data: JSON.parse(JSON.stringify(b.data)) }, arr = [...p.blocks]; arr.splice(i + 1, 0, c); setBlocks(arr) }
  async function save() {
    if (!p.title.trim()) return onError('Page title is required.')
    const { id, created_at, updated_at, ...rest } = p
    const payload = { ...rest, title: p.title.trim(), slug: slugify(p.slug || p.title), content: '', category: 'Page', published_at: new Date().toISOString().slice(0, 10), blocks: p.blocks.map(({ type, data, id, style }) => ({ id, type, data, ...(style ? { style } : {}) })) }
    if (!payload.slug) return onError('Slug is required.')
    setBusy(true)
    const { data, error } = id ? await supabase.from('pages').update(payload).eq('id', id).select().maybeSingle() : await supabase.from('pages').insert(payload).select().maybeSingle()
    setBusy(false)
    if (error) return onError(/duplicate key/i.test(error.message) ? 'This URL is already used. Change the slug.' : error.message)
    onNotice('Page saved.'); onSaved?.(data || { ...payload, id })
    if (data?.id) setP(x => ({ ...x, id: data.id }))
    setSnap(sig({ title: payload.title, blocks: payload.blocks })); return data?.id || id
  }
  async function preview() { const pid = await save(); if (pid) window.open(`/page/${slugify(p.slug || p.title)}?preview=1`, '_blank', 'noopener') }
  const move = (from, to) => { if (from == null || from === to || to < 0 || to >= p.blocks.length) return; const arr = [...p.blocks], [it] = arr.splice(from, 1); arr.splice(to, 0, it); setBlocks(arr) }
  const applyTemplate = t => { const arr = t.make(); setBlocks(arr); setOpen(new Set(arr.map(b => b.id))); setPickTpl(false) }
  const updStyle = (id, style) => setBlocks(p.blocks.map(b => b.id === id ? { ...b, style } : b))
  const Plus1 = ({ at }) => <div className="pb-add"><button type="button" onClick={() => setGallery(at)} aria-label="Add section here"><Plus size={16}/></button></div>
  return <div className="adm">
    <div className="adm-head"><div><button type="button" className="adm-btn sm" onClick={() => { if (!dirty || confirm('You have unsaved changes. Leave without saving?')) onBack() }}><ArrowLeft size={14}/> All pages</button><h2 style={{ marginTop: 12 }}>{p.id ? 'Edit page' : 'New page'}</h2><p>Build the page from sections, like WordPress. Add, reorder, duplicate and delete sections.</p></div>
      <div className="adm-actions">{p.id && <a className="adm-btn" href={`/page/${p.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> View</a>}<button className="adm-btn" onClick={preview} disabled={busy}><Eye size={15}/> Save and preview</button><button className="adm-btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save page'}</button></div></div>
    {dirty && <div className="adm-alert warn" style={{ marginBottom: 12 }}>You have unsaved changes.</div>}
    <div className="adm-split">
      <div className="adm">
        <section className="adm-card"><label className="adm-field"><span>Page title *</span><input value={p.title} onChange={e => set({ title: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) })} placeholder="e.g. Download Center"/></label></section>
        {p.blocks.length === 0 && <section className="adm-card" style={{ textAlign: 'center', padding: 40 }}><h3>This page is empty</h3><p className="adm-sub">Start from a ready-made layout or add sections one by one.</p><div className="adm-actions" style={{ justifyContent: 'center' }}><button className="adm-btn primary" onClick={() => setPickTpl(true)}>Choose a template</button><button className="adm-btn" onClick={() => setGallery(0)}><Plus size={16}/> Add section</button></div></section>}
        {p.blocks.length > 0 && <div className="adm-actions" style={{ justifyContent: 'flex-end' }}><button type="button" className="adm-btn sm" onClick={() => setOpen(new Set(p.blocks.map(b => b.id)))}><ChevronsUpDown size={14}/> Expand all</button><button type="button" className="adm-btn sm" onClick={() => setOpen(new Set())}>Collapse all</button></div>}
        {p.blocks.map((b, i) => { const m = meta(b.type), I = m.icon, isOpen = open.has(b.id); return <div key={b.id}>{i === 0 && <Plus1 at={0}/>}
          <section className={`adm-card pb-card ${isOpen ? 'open' : ''} ${drag === i ? 'dragging' : ''}`} onDragOver={e => { if (drag != null) e.preventDefault() }} onDrop={e => { e.preventDefault(); move(drag, i); setDrag(null) }}>
            <div className="pb-head"><span className="pb-grip" draggable onDragStart={e => { setDrag(i); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)) } catch {} }} onDragEnd={() => setDrag(null)} title="Drag to reorder" aria-hidden="true"><GripVertical size={16}/></span><button type="button" className="pb-title" onClick={() => toggle(b.id)} aria-expanded={isOpen}><span className="pb-ico"><I size={16}/></span><span><b>{m.name}</b><small>{summary(b) || 'Empty'}</small></span>{isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
              <div className="adm-actions"><button type="button" className="adm-btn sm" disabled={i === 0} onClick={() => setBlocks(moveItem(p.blocks, i, -1))} title="Move up"><ArrowUp size={14}/></button><button type="button" className="adm-btn sm" disabled={i === p.blocks.length - 1} onClick={() => setBlocks(moveItem(p.blocks, i, 1))} title="Move down"><ArrowDown size={14}/></button><button type="button" className="adm-btn sm" onClick={() => dup(i)} title="Duplicate"><Copy size={14}/></button><button type="button" className="adm-btn sm danger" onClick={() => { if (confirm('Delete this section?')) setBlocks(p.blocks.filter(x => x.id !== b.id)) }} title="Delete"><Trash2 size={14}/></button></div></div>
            {isOpen && <div className="pb-body"><BlockBody b={b} set={d => updBlock(b.id, d)} ads={ads} onNotice={onNotice} onError={onError}/>{!['divider', 'spacer'].includes(b.type) && <details className="pb-style"><summary>Section style: background, spacing, width, visibility</summary><StyleBody st={b.style} onChange={st => updStyle(b.id, st)} onError={onError}/></details>}</div>}
          </section><Plus1 at={i + 1}/></div> })}
      </div>
      <aside className="adm-sticky">
        <section className="adm-card"><h3>Publish</h3><label className="adm-field"><span>Status</span><select value={p.status} onChange={e => set({ status: e.target.value })}><option value="draft">Draft (hidden)</option><option value="published">Published (live)</option></select></label>
          <label className="adm-field" style={{ marginTop: 12 }}><span>URL</span><input value={p.slug} onChange={e => set({ slug: slugify(e.target.value) })}/><span className="adm-hint">/page/{p.slug || 'your-page'}</span></label>
          <label className="adm-check" style={{ marginTop: 14 }}><input type="checkbox" checked={!!p.show_in_menu} onChange={e => set({ show_in_menu: e.target.checked })}/> Show in header menu</label>
          <label className="adm-check" style={{ marginTop: 8 }}><input type="checkbox" checked={!!p.show_in_footer} onChange={e => set({ show_in_footer: e.target.checked })}/> Show in footer</label>
          <div className="adm-actions" style={{ marginTop: 16 }}><button className="adm-btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save page'}</button></div></section>
        <section className="adm-card"><h3>Page settings</h3>
          <label className="adm-check"><input type="checkbox" checked={!!p.settings?.show_title} onChange={e => set({ settings: { ...p.settings, show_title: e.target.checked } })}/> Show the page title at the top</label>
          <label className="adm-field" style={{ marginTop: 12 }}><span>Page width</span><select value={p.settings?.layout || 'default'} onChange={e => set({ settings: { ...p.settings, layout: e.target.value } })}><option value="default">Default</option><option value="wide">Wide</option><option value="full">Full width</option></select></label>
          <label className="adm-field" style={{ marginTop: 12 }}><span>Short description</span><textarea rows={2} value={p.excerpt || ''} maxLength={300} onChange={e => set({ excerpt: e.target.value })} placeholder="Shown under the title and in search results"/></label>
          <div style={{ marginTop: 12 }}><ImageField label="Featured image (share preview)" value={p.cover_image} onChange={v => set({ cover_image: v })} onError={onError} hint="Used when the page is shared. 1200x630 is ideal."/></div>
          <div className="adm-actions" style={{ marginTop: 12 }}><button type="button" className="adm-btn sm" onClick={() => setPickTpl(true)}>Replace with a template</button></div></section>
        <section className="adm-card"><h3>SEO</h3><label className="adm-field"><span>SEO title</span><input value={p.seo_title || ''} onChange={e => set({ seo_title: e.target.value })} placeholder={p.title}/><Counter value={p.seo_title || p.title} min={30} max={60}/></label>
          <label className="adm-field" style={{ marginTop: 12 }}><span>Meta description</span><textarea rows={3} value={p.seo_description || ''} onChange={e => set({ seo_description: e.target.value })}/><Counter value={p.seo_description || ''} min={110} max={160}/></label>
          <label className="adm-check" style={{ marginTop: 12 }}><input type="checkbox" checked={!!p.noindex} onChange={e => set({ noindex: e.target.checked })}/> Hide from search engines</label></section>
      </aside>
    </div>
    {pickTpl && <div className="adm-modal" role="dialog" aria-modal="true"><div className="adm-modal-card" style={{ width: 'min(760px,100%)' }}><div className="adm-modal-head"><b>Choose a starting layout</b><button type="button" className="adm-btn sm" onClick={() => setPickTpl(false)}><X size={15}/></button></div>{p.blocks.length > 0 && <div className="adm-alert warn" style={{ marginBottom: 12 }}>This replaces the sections on this page.</div>}<div className="pb-gallery">{PAGE_TEMPLATES.map(t => <button type="button" key={t.id} onClick={() => { if (!p.blocks.length || confirm('Replace all current sections with this template?')) applyTemplate(t) }}><b>{t.name}</b><small>{t.desc}</small></button>)}</div></div></div>}
    {gallery !== null && <div className="adm-modal" role="dialog" aria-modal="true"><div className="adm-modal-card" style={{ width: 'min(760px,100%)' }}><div className="adm-modal-head"><b>Add a section</b><button type="button" className="adm-btn sm" onClick={() => setGallery(null)}><X size={15}/></button></div>
      <div className="pb-gallery">{BLOCKS.map(m => { const I = m.icon; return <button type="button" key={m.type} onClick={() => addBlock(m.type, gallery)}><span className="pb-ico"><I size={20}/></span><b>{m.name}</b><small>{m.desc}</small></button> })}</div></div></div>}
  </div>
}
