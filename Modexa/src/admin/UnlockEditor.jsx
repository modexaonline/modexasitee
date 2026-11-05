import { useState } from 'react'
import { Plus, Wand2 } from 'lucide-react'
import { Move, moveItem } from './fields'
import { STEP_TYPES, makeStep, stepType, stepsFromLinks } from '../lib/unlock'

// Easy editor for download unlock steps: paste links (types are detected), or tap a quick-add button.
export default function UnlockEditor({ steps, onChange }) {
  const list = Array.isArray(steps) ? steps : []
  const [bulk, setBulk] = useState(''), [msg, setMsg] = useState('')
  const upd = (i, p) => onChange(list.map((x, k) => k === i ? { ...x, ...p } : x))
  function addLinks(text) {
    const found = stepsFromLinks(text); if (!found.length) { setMsg('No https:// links found. Paste one link per line.'); return false }
    const have = new Set(list.map(s => s.url)), add = found.filter(s => !have.has(s.url))
    onChange([...list.filter(s => (s.url || '').trim()), ...add]); setBulk(''); setMsg(`Added ${add.length} step${add.length === 1 ? '' : 's'}${found.length - add.length ? `, skipped ${found.length - add.length} duplicate` : ''}. Check the type of each one below.`); return true
  }
  return <div className="adm-repeat">
    <div className="adm-item" style={{ borderStyle: 'dashed' }}>
      <label className="adm-field"><span>Paste links here (steps are created automatically)</span>
        <textarea rows={4} value={bulk} onChange={e => { setBulk(e.target.value); setMsg('') }} onPaste={e => { const t = e.clipboardData?.getData('text') || ''; if (/https?:\/\//i.test(t) && addLinks(t)) e.preventDefault() }} placeholder={'https://youtube.com/@yourchannel\nhttps://t.me/yourchannel\nhttps://x.com/yourhandle\nhttps://your-sponsor-link.com/offer'}/></label>
      <div className="adm-actions" style={{ marginTop: 8 }}><button type="button" className="adm-btn" disabled={!bulk.trim()} onClick={() => addLinks(bulk)}><Wand2 size={15}/> Create steps from links</button>{msg && <span className="adm-hint" role="status">{msg}</span>}</div>
    </div>
    {list.map((s, i) => <div className="adm-item" key={i}>
      <div className="adm-item-head"><b>STEP {i + 1}{stepType(s.type).sponsored ? ' · sponsored' : ''}</b><Move i={i} n={list.length} label="step" onMove={(x, d) => onChange(moveItem(list, x, d))} onRemove={x => onChange(list.filter((_, k) => k !== x))}/></div>
      <div className="adm-grid3">
        <label className="adm-field"><span>Type</span><select value={s.type} onChange={e => { const t = stepType(e.target.value); upd(i, { type: t.id, label: t.label, btn: t.btn, wait: t.wait }) }}>{STEP_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
        <label className="adm-field"><span>Title shown to visitor</span><input value={s.label || ''} maxLength={80} onChange={e => upd(i, { label: e.target.value })}/></label>
        <label className="adm-field"><span>Button text</span><input value={s.btn || ''} maxLength={30} onChange={e => upd(i, { btn: e.target.value })}/></label>
      </div>
      <div className="adm-grid2"><label className="adm-field"><span>Link (https://…)</span><input value={s.url || ''} onChange={e => upd(i, { url: e.target.value })} placeholder="https://…"/></label>
        <label className="adm-field"><span>Wait seconds before “Done, continue”</span><input type="number" min="0" max="60" value={s.wait ?? 0} onChange={e => upd(i, { wait: e.target.value })}/></label></div>
    </div>)}
    <div className="adm-actions" style={{ flexWrap: 'wrap' }}>{STEP_TYPES.map(t => <button type="button" key={t.id} className="adm-btn sm" onClick={() => onChange([...list, makeStep(t.id)])}><Plus size={13}/> {t.label}</button>)}</div>
  </div>
}
