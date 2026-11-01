import { useState } from 'react'
import { Heading2, Heading3, Bold, Italic, Link2, List, Quote, Image as ImageIcon, MousePointerClick, Megaphone } from 'lucide-react'
import './admin-extra.css'

// Toolbar above the blog body editor: formatting, links, direct-link button and "insert ad" (shortcodes).
export default function EditorTools({ value, onChange, ads = [] }) {
  const [pop, setPop] = useState(null), [label, setLabel] = useState(''), [url, setUrl] = useState('')
  const ta = () => document.querySelector('textarea.body-editor')
  function insert(text, { wrap = false, block = false } = {}) {
    const el = ta(); const cur = value || ''
    const s = el ? el.selectionStart : cur.length, e = el ? el.selectionEnd : cur.length
    const sel = cur.slice(s, e)
    let ins = wrap ? text.replace('$', sel || 'text') : text
    if (block) { const before = cur.slice(0, s), after = cur.slice(e); ins = (before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '') + ins + (after && !after.startsWith('\n') ? '\n\n' : '') }
    const next = cur.slice(0, s) + ins + cur.slice(e)
    onChange(next)
    setTimeout(() => { const t = ta(); if (t) { t.focus(); const pos = s + ins.length; t.setSelectionRange(pos, pos) } }, 0)
  }
  const open = t => { setPop(t); setLabel(t === 'button' ? 'Download now' : ''); setUrl('') }
  const confirm = () => {
    if (!/^https?:\/\//i.test(url.trim())) { alert('Link must start with https://'); return }
    if (pop === 'link') insert(`[${label.trim() || 'link'}](${url.trim()})`)
    if (pop === 'button') insert(`[btn:${label.trim() || 'Open link'}](${url.trim()})`, { block: true })
    if (pop === 'image') insert(`![${label.trim()}](${url.trim()})`, { block: true })
    setPop(null)
  }
  return <>
    <div className="adm-toolbar" role="toolbar" aria-label="Formatting">
      <button type="button" onClick={() => insert('## $', { wrap: true, block: true })} title="Heading"><Heading2 size={15}/></button>
      <button type="button" onClick={() => insert('### $', { wrap: true, block: true })} title="Subheading"><Heading3 size={15}/></button>
      <button type="button" onClick={() => insert('**$**', { wrap: true })} title="Bold"><Bold size={15}/></button>
      <button type="button" onClick={() => insert('*$*', { wrap: true })} title="Italic"><Italic size={15}/></button>
      <button type="button" onClick={() => insert('- $', { wrap: true, block: true })} title="Bullet"><List size={15}/></button>
      <button type="button" onClick={() => insert('> $', { wrap: true, block: true })} title="Quote"><Quote size={15}/></button>
      <span className="sep"/>
      <button type="button" onClick={() => open('link')}><Link2 size={15}/> Link</button>
      <button type="button" onClick={() => open('image')}><ImageIcon size={15}/> Image</button>
      <button type="button" onClick={() => open('button')} title="Sponsored direct-link button (opens in a new tab, rel=sponsored)"><MousePointerClick size={15}/> Direct link button</button>
      <span className="sep"/>
      <select aria-label="Insert ad" value="" onChange={e => { if (e.target.value) insert(`[ad:${e.target.value}]`, { block: true }); e.target.value = '' }}>
        <option value="">＋ Insert ad…</option>
        {ads.length === 0 ? <option disabled>No ads yet, create one in Ads manager</option> : ads.map(a => <option key={a.slot_key} value={a.slot_key}>{a.name} · {a.kind === 'direct_link' ? 'direct link' : a.size}</option>)}
      </select>
      <span style={{ fontSize: 12, color: '#6b7280', display: 'inline-flex', gap: 4, alignItems: 'center' }}><Megaphone size={13}/> Ads also appear automatically, see Ads manager.</span>
    </div>
    {pop && <div className="adm-pop"><b style={{ fontSize: 13 }}>{pop === 'button' ? 'Insert direct-link button' : pop === 'image' ? 'Insert image' : 'Insert link'}</b>
      <div className="row"><label className="adm-field"><span>{pop === 'image' ? 'Alt text' : 'Button / link text'}</span><input value={label} onChange={e => setLabel(e.target.value)} placeholder={pop === 'button' ? 'Download now' : ''}/></label><label className="adm-field"><span>URL (https://…)</span><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://"/></label><div className="adm-actions"><button type="button" className="adm-btn primary" onClick={confirm}>Insert</button><button type="button" className="adm-btn" onClick={() => setPop(null)}>Cancel</button></div></div></div>}
  </>
}
