import { useEffect, useState } from 'react'
import { Save, Info, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setContentCache } from '../lib/siteContent'
import { Switch } from './fields'
import { ADSTERRA_DEFAULTS, ADSTERRA_FORMATS } from '../lib/adsterra'
import './admin-extra.css'

// Adsterra formats: pick the format, paste the code Adsterra gives you, save. Saved in site_content('adsterra'). The ON/OFF switch for the
// whole network is in the “Ad networks” card at the top of the Ads manager.
const fmt = id => ADSTERRA_FORMATS.find(f => f.id === id) || ADSTERRA_FORMATS[ADSTERRA_FORMATS.length - 1]
const blank = () => ({ id: Math.random().toString(36).slice(2, 9), format: 'popunder', code: '', on: true })
const mono = { fontFamily: 'ui-monospace,Menlo,Consolas,monospace', fontSize: 13 }

export default function AdsterraCard({ onNotice, onError }) {
  const [list, setList] = useState([]), [prefilled, setPrefilled] = useState(false), [savedN, setSavedN] = useState(0), [busy, setBusy] = useState(false)
  useEffect(() => {
    supabase.from('site_content').select('data').eq('key', 'adsterra').maybeSingle().then(({ data }) => {
      const items = Array.isArray(data?.data?.items) ? data.data.items.filter(x => x && String(x.code || '').trim()) : []
      if (!items.length) { setList(ADSTERRA_DEFAULTS.map(x => ({ ...x }))); setPrefilled(true) } else { setList(items.map((x, i) => ({ id: x.id || 'a' + i, format: x.format || 'other', code: x.code || '', on: x.on !== false }))); setSavedN(items.length) }
    })
  }, [])
  const patch = (id, p) => setList(l => l.map(x => x.id === id ? { ...x, ...p } : x))
  async function save() {
    const items = list.map(x => ({ id: x.id, format: x.format, code: x.code.trim(), on: x.on !== false })).filter(x => x.code)
    for (const x of items) {
      if (x.code.length > 20000) return onError('One code is too long (max 20,000 characters).')
      if (x.format === 'smartlink') { if (!/^https?:\/\/\S+$/i.test(x.code)) return onError('Direct link: paste the full link starting with https://'); continue }
      if (!/<script[\s>]/i.test(x.code)) return onError(`“${fmt(x.format).label}”: this does not look like Adsterra code. Paste the full <script …> tag exactly as Adsterra shows it.`)
    }
    setBusy(true)
    const cur = await supabase.from('site_content').select('data').eq('key', 'adsterra').maybeSingle()   // keep the network ON/OFF switch exactly as it is now
    const data = { enabled: cur.data?.data?.enabled !== false, items }
    const { error } = await supabase.from('site_content').upsert({ key: 'adsterra', data }, { onConflict: 'key' })
    setBusy(false)
    if (error) return onError(error.message)
    setContentCache('adsterra', data); setPrefilled(false); setList(items); setSavedN(items.length)
    onNotice(items.length ? `Saved. ${items.length} Adsterra ${items.length === 1 ? 'code is' : 'codes are'} now live.` : 'Adsterra codes removed (the built-in ones are used again).')
  }
  return <section className="adm-card" style={{ display: 'grid', gap: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <div><h3 style={{ margin: 0 }}>Adsterra ad formats</h3><p className="adm-sub" style={{ margin: '4px 0 0' }}>Choose a format, paste the code Adsterra gives you, save. Banners and the native widget are placed automatically; popunder and social bar load site-wide; the Smartlink becomes “Advertisement” cards.</p></div>
      {savedN > 0 && <span className="adm-pill green"><CheckCircle2 size={13}/> Saved ({savedN})</span>}
    </div>
    {prefilled && <div className="adm-alert info"><Info size={16} style={{ flex: 'none', marginTop: 2 }}/><div>Your Adsterra codes (popunder, social bar, smartlink, banners 728×90 / 300×250 / 160×300 and the native banner) are already <b>live on the site</b>. Press <b>Save Adsterra</b> once to store them here so you can edit or switch each one off.</div></div>}
    {list.map(x => <div key={x.id} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid var(--adm-line,#e5e7eb)', borderRadius: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={x.format} onChange={e => patch(x.id, { format: e.target.value })} aria-label="Ad format" style={{ flex: '1 1 220px' }}>{ADSTERRA_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
        <Switch checked={x.on} onChange={v => patch(x.id, { on: v })} label="This code enabled"/>
        <button type="button" className="adm-btn danger" onClick={() => setList(l => l.filter(y => y.id !== x.id))} aria-label="Remove this code"><Trash2 size={14}/></button>
      </div>
      <p style={{ margin: 0, color: '#6b7280', fontSize: 12.5 }}>{fmt(x.format).hint}</p>
      <textarea rows={x.format === 'smartlink' ? 1 : 5} spellCheck={false} value={x.code} onChange={e => patch(x.id, { code: e.target.value })} placeholder={x.format === 'smartlink' ? 'https://…' : '<script src="https://…"></script>'} style={mono}/>
    </div>)}
    <div className="adm-actions"><button type="button" className="adm-btn" onClick={() => setList(l => [...l, blank()])}><Plus size={15}/> Add a format</button><button type="button" className="adm-btn primary" disabled={busy} onClick={save}><Save size={15}/> {busy ? 'Saving…' : 'Save Adsterra'}</button></div>
  </section>
}
