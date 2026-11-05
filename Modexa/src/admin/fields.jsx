import { useRef, useState } from 'react'
import { Upload, Image as ImageIcon, ArrowUp, ArrowDown, Trash2, Plus, Wand2 } from 'lucide-react'
import { parseFaqs, cleanList, cleanParas } from '../lib/formatText'
import { supabase } from '../lib/supabase'
import './admin-extra.css'

export async function uploadImage(file) {
  if (!/^image\//.test(file.type)) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.')
  const path = `uploads/${Date.now()}-${(file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'image')}.${(file.name.split('.').pop() || 'png').toLowerCase()}`
  const { error } = await supabase.storage.from('modexa-media').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type })
  if (error) throw new Error(error.message)
  return supabase.storage.from('modexa-media').getPublicUrl(path).data.publicUrl
}
export const slugify = v => String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function Switch({ checked, onChange, label }) {
  return <label className="adm-switch" title={label}><input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} aria-label={label}/><span/></label>
}

// URL box + upload to the public `modexa-media` storage bucket.
export function ImageField({ label = 'Image', value, onChange, onError, hint }) {
  const file = useRef(null), [busy, setBusy] = useState(false)
  async function upload(e) {
    const f = e.target.files?.[0]; if (!f) return
    if (!/^image\//.test(f.type)) { onError?.('Please choose an image file.'); return }
    if (f.size > 5 * 1024 * 1024) { onError?.('Image must be 5 MB or smaller.'); return }
    setBusy(true)
    const path = `uploads/${Date.now()}-${slugify(f.name.replace(/\.[^.]+$/, '')) || 'image'}.${(f.name.split('.').pop() || 'png').toLowerCase()}`
    const { error } = await supabase.storage.from('modexa-media').upload(path, f, { cacheControl: '31536000', upsert: false, contentType: f.type })
    setBusy(false); e.target.value = ''
    if (error) { onError?.(error.message); return }
    onChange(supabase.storage.from('modexa-media').getPublicUrl(path).data.publicUrl)
  }
  return <div className="adm-field"><span>{label}</span>
    <div className="adm-imgfield"><div className="adm-imgrow"><input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="https://… or upload"/><button type="button" className="adm-btn" onClick={() => file.current?.click()} disabled={busy}><Upload size={15}/>{busy ? 'Uploading…' : 'Upload'}</button><input ref={file} type="file" accept="image/*" hidden onChange={upload}/></div>
      {value ? <img className="adm-thumb" src={value} alt="" style={{ width: 120, height: 72 }}/> : <span className="adm-hint"><ImageIcon size={13}/> {hint || 'No image yet.'}</span>}</div></div>
}

export function Counter({ value = '', min, max }) {
  const n = String(value).length, ok = n >= min && n <= max
  return <span className={`adm-counter ${ok ? 'ok' : n > max ? 'bad' : ''}`}>{n} characters · best {min}–{max}</span>
}

export function Move({ i, n, onMove, onRemove, label = 'item' }) {
  return <div className="adm-actions">
    <button type="button" className="adm-btn sm" disabled={i === 0} onClick={() => onMove(i, -1)} aria-label={`Move ${label} up`}><ArrowUp size={14}/></button>
    <button type="button" className="adm-btn sm" disabled={i === n - 1} onClick={() => onMove(i, 1)} aria-label={`Move ${label} down`}><ArrowDown size={14}/></button>
    <button type="button" className="adm-btn sm danger" onClick={() => onRemove(i)} aria-label={`Remove ${label}`}><Trash2 size={14}/></button>
  </div>
}
export const moveItem = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return arr; const c = [...arr]; [c[i], c[j]] = [c[j], c[i]]; return c }
export const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean)
export const paras = t => String(t || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean)

// FAQ list editor: add / remove / reorder question + answer pairs. Used by app, game, blog and guide editors.
export const cleanFaqs = list => (Array.isArray(list) ? list : []).map(f => ({ q: String(f?.q || '').trim(), a: String(f?.a || '').trim() })).filter(f => f.q && f.a)
// Merge parsed FAQs into the list (skips questions that already exist, drops empty placeholder rows).
const mergeFaqs = (list, found) => { const have = new Set(list.filter(f => f.q?.trim()).map(f => f.q.trim().toLowerCase())); const add = found.filter(f => !have.has(f.q.toLowerCase())); return { next: [...list.filter(f => (f.q || '').trim() || (f.a || '').trim()), ...add], added: add.length, skipped: found.length - add.length } }
export function FaqEditor({ items, onChange }) {
  const list = Array.isArray(items) ? items : []
  const [bulk, setBulk] = useState(''), [msg, setMsg] = useState('')
  const upd = (i, p) => onChange(list.map((x, k) => k === i ? { ...x, ...p } : x))
  function addBulk(text) {
    const found = parseFaqs(text)
    if (!found.length) { setMsg('Could not find any question + answer pairs. Put each question on its own line (ending with ?) and the answer under it.'); return false }
    const r = mergeFaqs(list, found); onChange(r.next); setBulk('')
    setMsg(`Added ${r.added} FAQ${r.added === 1 ? '' : 's'}${r.skipped ? `, skipped ${r.skipped} that already existed` : ''}. Check them below.`); return true
  }
  // Pasting a whole FAQ block into any Question box splits it automatically.
  function onQPaste(e, i) {
    const t = e.clipboardData?.getData('text') || ''
    if (!/\n|\?\s+\S/.test(t.trim())) return
    const found = parseFaqs(t); if (!found.length || (found.length === 1 && !/\n/.test(t.trim()))) return
    e.preventDefault()
    const blank = i < list.length && !(list[i].q || '').trim() && !(list[i].a || '').trim()
    const r = mergeFaqs(blank ? list.filter((_, k) => k !== i) : list, found)
    onChange(r.next); setMsg(`Pasted text was split into ${r.added} FAQ${r.added === 1 ? '' : 's'}.`)
  }
  return <div className="adm-repeat">
    <div className="adm-item" style={{ borderStyle: 'dashed' }}>
      <label className="adm-field"><span>Paste all FAQs here (auto-split)</span>
        <textarea rows={5} value={bulk} onChange={e => { setBulk(e.target.value); setMsg('') }} onPaste={e => { const t = e.clipboardData?.getData('text') || ''; if (t.trim().length > 20 && addBulk(t)) e.preventDefault() }} placeholder={'Is this app free?\nYes, it is free to download.\n\nIs it safe?\nYes, every file is scanned.\n\n(Q: / A:, 1. / 2. numbering and “Question? Answer” on one line also work)'}/></label>
      <div className="adm-actions" style={{ marginTop: 8 }}><button type="button" className="adm-btn" disabled={!bulk.trim()} onClick={() => addBulk(bulk)}><Wand2 size={15}/> Split into separate FAQs</button>{msg && <span className="adm-hint" role="status">{msg}</span>}</div>
    </div>
    {list.length === 0 && <p className="adm-hint">No FAQs yet. Paste them above, or click “Add FAQ” to type one.</p>}
    {list.map((f, i) => <div className="adm-item" key={i}>
      <div className="adm-item-head"><b>FAQ #{i + 1}</b><Move i={i} n={list.length} label="FAQ" onMove={(x, d) => onChange(moveItem(list, x, d))} onRemove={x => onChange(list.filter((_, k) => k !== x))}/></div>
      <label className="adm-field"><span>Question</span><input value={f.q || ''} maxLength={200} onChange={e => upd(i, { q: e.target.value })} onPaste={e => onQPaste(e, i)} placeholder="e.g. Is this app free to download?"/></label>
      <label className="adm-field"><span>Answer</span><textarea rows={3} value={f.a || ''} onChange={e => upd(i, { a: e.target.value })} placeholder="Write the answer. You can use **bold** and [links](/page)."/></label>
    </div>)}
    <button type="button" className="adm-btn" onClick={() => onChange([...list, { q: '', a: '' }])}><Plus size={15}/> Add FAQ</button>
  </div>
}

// One-item-per-line list box (features, requirements, install steps). Pasting auto-cleans: bullets, numbers,
// "Step 1:", ticks, duplicates and "a; b; c" / "a, b, c" one-liners all become tidy separate lines.
export function ListBox({ label, value, onChange, rows = 5, placeholder, suffix = ' (one per line)' }) {
  const ref = useRef(null)
  const text = Array.isArray(value) ? value.join('\n') : (value || '')
  function onPaste(e) {
    const t = e.clipboardData?.getData('text') || ''; if (!t.trim()) return
    e.preventDefault()
    const el = ref.current, a = el.selectionStart, b = el.selectionEnd, add = cleanList(t).join('\n')
    const before = text.slice(0, a), after = text.slice(b)
    onChange([before.trimEnd(), add, after.trimStart()].filter(Boolean).join('\n'))
  }
  const tidy = () => onChange(cleanList(text).join('\n'))
  const n = cleanList(text).length
  return <div className="adm-field"><span>{label}{suffix}</span>
    <textarea ref={ref} rows={rows} value={text} onChange={e => onChange(e.target.value)} onPaste={onPaste} onBlur={tidy} placeholder={placeholder || 'Paste a list or type one item per line'}/>
    <span className="adm-hint">{n} item{n === 1 ? '' : 's'} · auto-cleans when you paste or click away</span></div>
}

// Paragraph box (blank line = new paragraph). Pasting cleans broken line wraps and odd spaces and splits a giant
// wall of text into paragraphs; clicking away tidies spacing. No word is ever changed.
export function ParaBox({ label, value, onChange, rows = 4, placeholder, hint }) {
  const ref = useRef(null), text = value || ''
  function onPaste(e) {
    const t = e.clipboardData?.getData('text') || ''; if (!t.trim()) return
    e.preventDefault()
    const el = ref.current, a = el.selectionStart, b = el.selectionEnd, add = cleanParas(t, true).join('\n\n')
    onChange([text.slice(0, a).trimEnd(), add, text.slice(b).trimStart()].filter(Boolean).join('\n\n'))
  }
  return <div className="adm-field"><span>{label}</span>
    <textarea ref={ref} rows={rows} value={text} onChange={e => onChange(e.target.value)} onPaste={onPaste} onBlur={() => { const t = cleanParas(text).join('\n\n'); if (t !== text) onChange(t) }} placeholder={placeholder}/>
    {hint && <span className="adm-hint">{hint}</span>}</div>
}
