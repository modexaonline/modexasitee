import { useEffect, useState } from 'react'
import { Power } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setSettingsCache } from '../lib/useSettings'
import { setContentCache } from '../lib/siteContent'
import { Switch } from './fields'
import './admin-extra.css'

// One-click ON/OFF for a whole network across the entire site: cards, banners, scripts, everything it shows. Live immediately.
export default function AdNetworksCard({ master, saveMaster, onNotice, onError }) {
  const [monetag, setMonetag] = useState(true), [adsterra, setAdsterra] = useState(true), [busy, setBusy] = useState('')
  useEffect(() => {
    supabase.from('site_settings').select('monetag_enabled').eq('id', 1).maybeSingle().then(({ data }) => { if (data) setMonetag(data.monetag_enabled !== false) })
    supabase.from('site_content').select('data').eq('key', 'adsterra').maybeSingle().then(({ data }) => { if (data?.data) setAdsterra(data.data.enabled !== false) })
  }, [])
  async function toggleMonetag(v) {
    setBusy('m'); setMonetag(v)
    const { error } = await supabase.from('site_settings').update({ monetag_enabled: v }).eq('id', 1)
    setBusy('')
    if (error) { setMonetag(!v); return onError(error.message) }
    setSettingsCache({ monetag_enabled: v }); onNotice(v ? 'Monetag is ON for the whole site.' : 'Monetag is OFF on the whole site.')
  }
  async function toggleAdsterra(v) {
    setBusy('a'); setAdsterra(v)
    const cur = await supabase.from('site_content').select('data').eq('key', 'adsterra').maybeSingle()
    const data = { ...(cur.data?.data || {}), enabled: v }
    const { error } = await supabase.from('site_content').upsert({ key: 'adsterra', data }, { onConflict: 'key' })
    setBusy('')
    if (error) { setAdsterra(!v); return onError(error.message) }
    setContentCache('adsterra', data); onNotice(v ? 'Adsterra is ON for the whole site.' : 'Adsterra is OFF on the whole site.')
  }
  const rows = [
    { k: 'm', name: 'Monetag', sub: 'Popunder, push, in-page push, vignette, multitag and its direct-link cards.', on: monetag, set: toggleMonetag },
    { k: 'a', name: 'Adsterra', sub: 'Popunder, social bar, banners (728×90, 300×250, 160×300), native banner and its smartlink cards.', on: adsterra, set: toggleAdsterra },
    { k: 'x', name: 'Manual ads', sub: 'The ad units you create yourself in the “Manual ads” tab.', on: Boolean(master.ads_enabled), set: v => saveMaster({ ads_enabled: v }) },
  ]
  return <section className="adm-card" style={{ display: 'grid', gap: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}><Power size={20}/><div><h3 style={{ margin: 0 }}>Ad networks: one-click ON / OFF</h3><p className="adm-sub" style={{ margin: '2px 0 0' }}>Switch a whole network on or off for the entire website. It is live immediately and nothing you pasted is deleted.</p></div></div>
    {rows.map(r => <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 15 }}>{r.name}</b><small style={{ display: 'block', color: '#6b7280' }}>{r.sub}</small></div>
      <span style={{ fontSize: 12, fontWeight: 800, color: r.on ? '#15803d' : '#b91c1c', minWidth: 28 }}>{r.on ? 'ON' : 'OFF'}</span>
      <Switch checked={r.on} onChange={v => { if (!busy) r.set(v) }} label={`${r.name} ads`}/>
    </div>)}
    <small style={{ color: '#6b7280' }}>When a network is switched OFF its scripts stop loading. Visitors who already have the site open may still see an ad until they reload the page.</small>
  </section>
}
