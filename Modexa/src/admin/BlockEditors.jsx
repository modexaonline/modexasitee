import { Plus } from 'lucide-react'
import { ImageField, Move, moveItem, ParaBox } from './fields'
import { ICON_NAMES } from '../lib/blockIcons'
import './admin-extra.css'

const F = ({ l, v, on, ph, type = 'text', hint }) => <label className="adm-field"><span>{l}</span><input type={type} value={v ?? ''} onChange={e => on(e.target.value)} placeholder={ph}/>{hint && <span className="adm-hint">{hint}</span>}</label>
const T = ({ l, v, on, ph, rows = 3, hint }) => <label className="adm-field"><span>{l}</span><textarea rows={rows} value={v ?? ''} onChange={e => on(e.target.value)} placeholder={ph}/>{hint && <span className="adm-hint">{hint}</span>}</label>
const S = ({ l, v, on, opts, style }) => <label className="adm-field" style={style}><span>{l}</span><select value={v ?? ''} onChange={e => on(e.target.value)}>{opts.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>

// Repeating list (features, steps, stats, ...): add, move and remove items.
function Repeat({ d, up, k, mk, render, addLabel = 'Add item', label = 'item' }) {
  const items = d[k] || [], set = arr => up({ [k]: arr })
  return <div className="adm-repeat">{items.map((it, i) => <div className="adm-item" key={i}>
    <div className="adm-item-head"><b>#{i + 1}</b><Move i={i} n={items.length} label={label} onMove={(a, dir) => set(moveItem(items, a, dir))} onRemove={a => set(items.filter((_, j) => j !== a))}/></div>
    {render(it, p => set(items.map((x, j) => j === i ? { ...x, ...p } : x)))}</div>)}
    <button type="button" className="adm-btn" onClick={() => set([...items, mk()])}><Plus size={15}/> {addLabel}</button></div>
}

// Editors for the newer section types. Returns null for types handled in AdminPageBuilder.
export function ExtraBody({ b, up, onError }) {
  const d = b.data
  switch (b.type) {
    case 'heading': return <div className="adm"><div className="adm-grid3"><F l="Heading" v={d.text} on={v => up({ text: v })}/><S l="Size" v={d.level} on={v => up({ level: v })} opts={[['h1', 'Large (H1)'], ['h2', 'Medium (H2)'], ['h3', 'Small (H3)']]}/><S l="Alignment" v={d.align} on={v => up({ align: v })} opts={[['center', 'Center'], ['left', 'Left']]}/></div><F l="Sub text (optional)" v={d.sub} on={v => up({ sub: v })}/></div>
    case 'imagetext': return <div className="adm"><ImageField label="Image" value={d.image} onChange={v => up({ image: v })} onError={onError}/><div className="adm-grid2"><F l="Heading" v={d.title} on={v => up({ title: v })}/><S l="Image side" v={d.side} on={v => up({ side: v })} opts={[['left', 'Left'], ['right', 'Right']]}/></div><ParaBox label="Text" rows={5} value={d.text} onChange={v => up({ text: v })} hint="Leave an empty line to start a new paragraph. Pasted text is cleaned automatically."/><div className="adm-grid2"><F l="Button text (optional)" v={d.buttonLabel} on={v => up({ buttonLabel: v })}/><F l="Button link" v={d.buttonUrl} on={v => up({ buttonUrl: v })} ph="https://… or /apps"/></div></div>
    case 'features': return <div className="adm"><div className="adm-grid2"><F l="Section heading (optional)" v={d.title} on={v => up({ title: v })}/><S l="Columns" v={d.cols} on={v => up({ cols: +v })} opts={[[2, '2'], [3, '3'], [4, '4']]}/></div>
      <Repeat d={d} up={up} k="items" label="feature" addLabel="Add feature" mk={() => ({ icon: 'star', title: '', text: '' })} render={(it, p) => <><div className="adm-grid2"><F l="Title" v={it.title} on={v => p({ title: v })}/><S l="Icon" v={it.icon} on={v => p({ icon: v })} opts={ICON_NAMES.map(n => [n, n])}/></div><T l="Text" rows={2} v={it.text} on={v => p({ text: v })}/></>}/></div>
    case 'stats': return <Repeat d={d} up={up} k="items" label="number" addLabel="Add number" mk={() => ({ value: '', label: '' })} render={(it, p) => <div className="adm-grid2"><F l="Number" v={it.value} on={v => p({ value: v })} ph="10K+"/><F l="Label" v={it.label} on={v => p({ label: v })} ph="Downloads"/></div>}/>
    case 'steps': return <div className="adm"><F l="Heading (optional)" v={d.title} on={v => up({ title: v })}/><Repeat d={d} up={up} k="items" label="step" addLabel="Add step" mk={() => ({ title: '', text: '' })} render={(it, p) => <><F l="Step title" v={it.title} on={v => p({ title: v })}/><T l="Details" rows={2} v={it.text} on={v => p({ text: v })}/></>}/></div>
    case 'testimonials': return <div className="adm"><F l="Heading (optional)" v={d.title} on={v => up({ title: v })}/><p className="adm-hint">Only add real feedback from real people.</p><Repeat d={d} up={up} k="items" label="review" addLabel="Add review" mk={() => ({ quote: '', name: '', role: '', avatar: '' })} render={(it, p) => <><T l="Quote" rows={3} v={it.quote} on={v => p({ quote: v })}/><div className="adm-grid2"><F l="Name" v={it.name} on={v => p({ name: v })}/><F l="Role (optional)" v={it.role} on={v => p({ role: v })}/></div><ImageField label="Photo (optional)" value={it.avatar} onChange={v => p({ avatar: v })} onError={onError}/></>}/></div>
    case 'video': return <div className="adm"><F l="Video link" v={d.url} on={v => up({ url: v })} ph="https://www.youtube.com/watch?v=… or Vimeo / .mp4" hint="YouTube, Vimeo or a direct .mp4 / .webm link (https only)."/><F l="Caption (optional)" v={d.caption} on={v => up({ caption: v })}/></div>
    case 'gallery': return <div className="adm"><div className="adm-grid2"><F l="Heading (optional)" v={d.title} on={v => up({ title: v })}/><S l="Columns" v={d.cols} on={v => up({ cols: +v })} opts={[[2, '2'], [3, '3'], [4, '4'], [5, '5']]}/></div>
      <Repeat d={d} up={up} k="images" label="image" addLabel="Add image" mk={() => ({ src: '', alt: '' })} render={(it, p) => <><ImageField label="Image" value={it.src} onChange={v => p({ src: v })} onError={onError}/><F l="Description (alt)" v={it.alt} on={v => p({ alt: v })}/></>}/></div>
    case 'notice': return <div className="adm"><div className="adm-grid2"><F l="Title" v={d.title} on={v => up({ title: v })}/><S l="Style" v={d.kind} on={v => up({ kind: v })} opts={[['info', 'Info (blue)'], ['success', 'Success (green)'], ['warning', 'Warning (yellow)'], ['danger', 'Important (red)']]}/></div><T l="Message" v={d.text} on={v => up({ text: v })}/></div>
    case 'quote': return <div className="adm"><T l="Quote" v={d.text} on={v => up({ text: v })}/><F l="Author (optional)" v={d.author} on={v => up({ author: v })}/></div>
    case 'table': return <div className="adm"><F l="Heading (optional)" v={d.title} on={v => up({ title: v })}/><T l="Table rows" rows={7} v={d.text} on={v => up({ text: v })} ph={'Feature | Free | Pro\nAds | Yes | No'} hint="One row per line. Separate columns with the | symbol."/><label className="adm-check"><input type="checkbox" checked={d.header !== false} onChange={e => up({ header: e.target.checked })}/> First row is the header</label></div>
    case 'contact': return <div className="adm"><F l="Heading (optional)" v={d.title} on={v => up({ title: v })}/><p className="adm-hint">Shows the contact form. Messages arrive in Admin, Inbox.</p></div>
    default: return null
  }
}

// WordPress-style "block settings": spacing, background, width, visibility, anchor.
export function StyleBody({ st = {}, onChange, onError }) {
  const up = p => onChange({ ...st, ...p })
  return <div className="adm" style={{ gap: 12 }}>
    <div className="adm-grid3">
      <S l="Background" v={st.bg || 'none'} on={v => up({ bg: v })} opts={[['none', 'None'], ['soft', 'Light grey'], ['green', 'Soft green'], ['dark', 'Dark'], ['custom', 'Custom color / image']]}/>
      <S l="Spacing (top and bottom)" v={st.pad || 'default'} on={v => up({ pad: v })} opts={[['default', 'Default'], ['none', 'None'], ['sm', 'Small'], ['lg', 'Large'], ['xl', 'Extra large']]}/>
      <S l="Content width" v={st.width || 'normal'} on={v => up({ width: v })} opts={[['normal', 'Normal'], ['narrow', 'Narrow'], ['wide', 'Wide'], ['full', 'Full width']]}/>
    </div>
    {st.bg === 'custom' && <div className="adm-grid2"><label className="adm-field"><span>Background color</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(st.bgColor || '') ? st.bgColor : '#ffffff'} onChange={e => up({ bgColor: e.target.value })} style={{ height: 42, padding: 4 }}/></label><ImageField label="Background image (optional)" value={st.bgImage} onChange={v => up({ bgImage: v })} onError={onError}/></div>}
    <div className="adm-grid3">
      <S l="Text alignment" v={st.align || ''} on={v => up({ align: v })} opts={[['', 'Default'], ['left', 'Left'], ['center', 'Center'], ['right', 'Right']]}/>
      <S l="Show on" v={st.hide || 'none'} on={v => up({ hide: v })} opts={[['none', 'All devices'], ['mobile', 'Desktop only (hide on phones)'], ['desktop', 'Phones only (hide on desktop)']]}/>
      <F l="Anchor ID (optional)" v={st.anchor} on={v => up({ anchor: v })} ph="downloads" hint="Link to this section with #downloads"/>
    </div>
    <F l="Extra CSS class (optional)" v={st.cls} on={v => up({ cls: v })}/>
  </div>
}
