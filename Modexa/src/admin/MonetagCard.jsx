import { useEffect, useState } from 'react'
import { Save, Info, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setSettingsCache } from '../lib/useSettings'
import { Switch } from './fields'
import { MONETAG_DEFAULTS } from '../lib/monetagDefaults'
import './admin-extra.css'

// Monetag formats: pick the format, paste the code Monetag gives you for it, save. Every enabled code is loaded on every public page.
export const MONETAG_FORMATS = [
  { id: 'popunder', label: 'Popunder / OnClick', hint: 'Opens an ad in a new tab after a click. Pays well but is the most intrusive format.' },
  { id: 'push', label: 'Push notifications', hint: 'Needs the service worker file (sw.js) below as well as the code.' },
  { id: 'vignette', label: 'Vignette banner', hint: 'Small banner that appears over the page.' },
  { id: 'inpage', label: 'In-Page Push', hint: 'Notification-style ad shown while people browse.' },
  { id: 'interstitial', label: 'Interstitial', hint: 'Full-page ad after the page loads (has a skip option).' },
  { id: 'multitag', label: 'Multitag / site code', hint: 'The all-in-one tag or the site verification code.' },
  { id: 'smartlink', label: 'Direct link (SmartLink)', hint: 'Your Monetag direct link (a URL, not a script). Shown automatically as “Advertisement” cards on every page and inside posts.' },
  { id: 'other', label: 'Other Monetag script', hint: 'Any other Monetag script tag.' },
]
const fmt = id => MONETAG_FORMATS.find(f => f.id === id) || MONETAG_FORMATS[MONETAG_FORMATS.length - 1]
const blank = () => ({ id: Math.random().toString(36).slice(2, 9), format: 'popunder', code: '', on: true })
const mono = { fontFamily: 'ui-monospace,Menlo,Consolas,monospace', fontSize: 13 }

export default function MonetagCard({ onNotice, onError }) {
  const [list, setList] = useState([]), [prefilled, setPrefilled] = useState(false), [sw, setSw] = useState(''), [on, setOn] = useState(true), [savedN, setSavedN] = useState(0), [busy, setBusy] = useState(false)
  useEffect(() => {
    supabase.from('site_settings').select('monetag_code,monetag_enabled,monetag_formats,monetag_sw').eq('id', 1).maybeSingle().then(({ data }) => {
      if (!data) { setList(MONETAG_DEFAULTS.map(x => ({ ...x }))); setPrefilled(true); return }
      const f = Array.isArray(data.monetag_formats) ? data.monetag_formats : []
      const old = (data.monetag_code || '').trim()
      const all = [...(old ? [{ id: 'old', format: 'multitag', code: old, on: true }] : []), ...f.map((x, i) => ({ id: x.id || 'f' + i, format: x.format || 'other', code: x.code || '', on: x.on !== false }))]
      if (!all.length) { setList(MONETAG_DEFAULTS.map(x => ({ ...x }))); setPrefilled(true) } else setList(all)
      setSw(data.monetag_sw || ''); setOn(data.monetag_enabled !== false); setSavedN(all.filter(x => x.code.trim()).length)
    })
  }, [])
  const patch = (id, p) => setList(l => l.map(x => x.id === id ? { ...x, ...p } : x))
  async function save(next = {}) {
    const items = (next.list || list).map(x => ({ id: x.id, format: x.format, code: x.code.trim(), on: x.on !== false })).filter(x => x.code)
    const enabled = next.on ?? on, worker = (next.sw ?? sw).trim()
    for (const x of items) {
      if (x.code.length > 20000) return onError('One code is too long (max 20,000 characters).')
      if (x.format === 'smartlink') { if (!/^https?:\/\/\S+$/i.test(x.code)) return onError('Direct link: paste the full link starting with https://'); continue }
      if (!/<script[\s>]|<meta[\s>]/i.test(x.code)) return onError(`“${fmt(x.format).label}”: this does not look like Monetag code. Paste the full <script …> tag exactly as Monetag shows it.`)
    }
    if (worker.length > 20000) return onError('Service worker code is too long.')
    if (/<\/?script/i.test(worker)) return onError('The service worker box takes the contents of the sw.js file (plain JavaScript), not a <script> tag.')
    setBusy(true)
    const row = { monetag_code: '', monetag_formats: items, monetag_sw: worker, monetag_enabled: enabled }
    const { error } = await supabase.from('site_settings').update(row).eq('id', 1)
    setBusy(false)
    if (error) return onError(error.message)
    setPrefilled(false); setList(items.length ? items : []); setSw(worker); setOn(enabled); setSavedN(items.length); setSettingsCache(row)
    onNotice(items.length ? `Saved. ${items.length} Monetag ${items.length === 1 ? 'code is' : 'codes are'} now live on every page.` : 'Monetag codes removed.')
  }
  const live = savedN > 0 && on
  return <section className="adm-card" style={{ display: 'grid', gap: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <div><h3 style={{ margin: 0 }}>Monetag ad formats</h3><p className="adm-sub" style={{ margin: '4px 0 0' }}>Choose a format, paste the code Monetag gives you, save. Add as many formats as you like; each one is loaded on your whole site automatically.</p></div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{live && <span className="adm-pill green"><CheckCircle2 size={13}/> Live ({savedN})</span>}<Switch checked={on} onChange={v => { setOn(v); if (savedN) save({ on: v }) }} label="Monetag enabled"/></div>
    </div>
    {prefilled && <div className="adm-alert info"><Info size={16} style={{ flex: 'none', marginTop: 2 }}/><div>Your Monetag codes (push, in-page push, vignette, popunder, multitag and the direct link) are already <b>live on the site</b>. Press <b>Save Monetag</b> once to store them here so you can edit or switch each one off.</div></div>}
    {list.map(x => <div key={x.id} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid var(--adm-line,#e5e7eb)', borderRadius: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={x.format} onChange={e => patch(x.id, { format: e.target.value })} aria-label="Ad format" style={{ flex: '1 1 220px' }}>{MONETAG_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
        <Switch checked={x.on} onChange={v => patch(x.id, { on: v })} label="This code enabled"/>
        <button type="button" className="adm-btn danger" onClick={() => setList(l => l.filter(y => y.id !== x.id))} aria-label="Remove this code"><Trash2 size={14}/></button>
      </div>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 12.5 }}>{fmt(x.format).hint}</p>
      <textarea rows={x.format === 'smartlink' ? 1 : 4} spellCheck={false} value={x.code} onChange={e => patch(x.id, { code: e.target.value })} placeholder={x.format === 'smartlink' ? 'https://…' : '<script src="https://…" data-zone="…" async></script>'} style={mono}/>
    </div>)}
    <div className="adm-actions"><button type="button" className="adm-btn" onClick={() => setList(l => [...l, blank()])}><Plus size={15}/> Add a format</button><button type="button" className="adm-btn primary" disabled={busy} onClick={() => save()}><Save size={15}/> {busy ? 'Saving…' : 'Save Monetag'}</button></div>
    <label className="adm-field"><span>Push notifications: service worker file (optional)</span>
      <textarea rows={3} spellCheck={false} value={sw} onChange={e => setSw(e.target.value)} placeholder="Paste the contents of the sw.js file Monetag gives you for push. It is then served at /sw.js on your site." style={mono}/>
    </label>
    <div className="adm-alert info"><Info size={16} style={{ flex: 'none', marginTop: 2 }}/><div>If “Load ads only after the visitor accepts cookies” is ON (Site &amp; brand settings), codes load after the visitor accepts. Turn that off if Monetag needs to verify your site. SmartLink and banner/native zones are added in the ad units below (kind “Direct link” or “Banner”). Test in a private window with ad-blockers off.</div></div>
  </section>
}
