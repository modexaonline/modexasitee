import { useEffect, useState } from 'react'
import { Save, Plus, Trash2, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { defaultSettings, setSettingsCache } from '../lib/useSettings'
import { SOCIAL_PRESETS, legacySocials } from '../lib/social'
import SocialIcon from '../components/SocialIcon'
import UnlockEditor from './UnlockEditor'
import { cleanSteps, hasBadStep } from '../lib/unlock'
import { ImageField, uploadImage } from './fields'
import './admin-extra.css'

export default function AdminSite({ onNotice, onError }) {
  const [f, setF] = useState(defaultSettings), [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false)
  useEffect(() => { supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error }) => { if (error) onError(error.message); else { const d = { ...defaultSettings, ...(data || {}) }; if (!Array.isArray(d.social_links) || !d.social_links.length) d.social_links = legacySocials(d); setF(d) } setLoaded(true) }) }, [])
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const soc = f.social_links || [], setSoc = social_links => setF({ ...f, social_links })
  const upd = (i, p) => setSoc(soc.map((x, j) => j === i ? { ...x, ...p } : x))
  async function icon(i, e) { const file = e.target.files?.[0]; if (!file) return; try { upd(i, { icon_url: await uploadImage(file) }) } catch (er) { onError(er.message) } e.target.value = '' }
  async function save(e) {
    e.preventDefault()
    const bad = soc.find(x => !x.url?.trim()); if (bad) return onError('Every social link needs a URL (or remove it).')
    const { id, updated_at, ...payload } = f
    payload.social_links = soc.map(x => ({ platform: x.platform || 'website', label: x.label || SOCIAL_PRESETS.find(p => p.id === x.platform)?.label || 'Link', url: x.url.trim(), icon_url: x.icon_url || '' }))
    payload.download_wait_seconds = Math.max(0, Math.min(300, Number(payload.download_wait_seconds) || 0))
    if ('password_scratch_wait' in payload) payload.password_scratch_wait = Math.max(0, Math.min(60, Number(payload.password_scratch_wait) || 0))
    if ('password_reveal' in payload && !['scratch', 'page', 'none'].includes(payload.password_reveal)) payload.password_reveal = 'scratch'
    if ('password_hint' in payload) payload.password_hint = String(payload.password_hint || '').trim().slice(0, 200)
    if ('unlock_steps' in payload || 'unlock_enabled' in payload) { if (hasBadStep(payload.unlock_steps)) return onError('Every unlock step link must start with https://'); payload.unlock_steps = cleanSteps(payload.unlock_steps); if (payload.unlock_enabled && !payload.unlock_steps.length) return onError('Add at least one unlock step or turn the unlock steps off.') }
    setBusy(true)
    const { error } = await supabase.from('site_settings').update(payload).eq('id', 1)
    setBusy(false)
    if (error) { onError(error.message); return }
    setSettingsCache({ ...payload }); onNotice('Saved. The live site updates immediately.')
  }
  if (!loaded) return <div className="admin-empty"><p>Loading…</p></div>
  return <form className="adm" onSubmit={save}>
    <div className="adm-head"><div><h2>Site & brand</h2><p>Name, logo, social icons, announcement bar, ads and download settings.</p></div><button className="adm-btn primary" disabled={busy}><Save size={15}/> {busy ? 'Saving…' : 'Save settings'}</button></div>
    <section className="adm-card"><h3>Brand</h3>
      <div className="adm-grid2"><label className="adm-field"><span>Site name</span><input value={f.site_name} onChange={set('site_name')} maxLength={60}/></label><label className="adm-field"><span>Contact email</span><input type="email" value={f.contact_email} onChange={set('contact_email')} placeholder="hello@modexa.online"/></label></div>
      <label className="adm-field" style={{ marginTop: 14 }}><span>Footer tagline</span><input value={f.tagline} onChange={set('tagline')} maxLength={160}/></label>
      <label className="adm-field" style={{ marginTop: 14 }}><span>Extra footer text (optional)</span><input value={f.footer_text} onChange={set('footer_text')} maxLength={240}/></label>
      <div className="adm-grid2" style={{ marginTop: 14 }}><ImageField label="Logo image (optional)" value={f.logo_url} onChange={v => setF({ ...f, logo_url: v })} onError={onError} hint="Square PNG/SVG works best."/><ImageField label="Default social-share image" value={f.default_og_image} onChange={v => setF({ ...f, default_og_image: v })} onError={onError} hint="1200×630 recommended. Used on the home page and on any page without its own social image or cover. Built-in fallback: modexa.online/og-default.png."/></div></section>
    <section className="adm-card"><h3>Announcement bar</h3>
      <label className="adm-check"><input type="checkbox" checked={!!f.announcement_active} onChange={set('announcement_active')}/> Show the announcement bar</label>
      <div className="adm-grid3" style={{ marginTop: 14 }}><label className="adm-field"><span>Text</span><input value={f.announcement} onChange={set('announcement')} maxLength={160} placeholder="New guide is live!"/></label><label className="adm-field"><span>Link (optional)</span><input value={f.announcement_link} onChange={set('announcement_link')} placeholder="/guide or https://…"/></label>
        <label className="adm-field"><span>Position</span><select value={f.announcement_position} onChange={set('announcement_position')}><option value="top">Top of the page (above header)</option><option value="below_header">Just below the header</option><option value="bottom">Bottom of the screen (fixed)</option></select></label></div></section>
    <section className="adm-card"><h3>Social links & icons</h3><p className="adm-sub">Shown in the footer. Pick a built-in icon or upload your own icon image.</p>
      <div className="adm-repeat">{soc.map((x, i) => <div className="adm-item" key={i}>
        <div className="adm-item-head"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><span className="pb-ico"><SocialIcon item={x} size={17}/></span><b>{x.label || SOCIAL_PRESETS.find(p => p.id === x.platform)?.label || 'Link'}</b></span><button type="button" className="adm-btn sm danger" onClick={() => setSoc(soc.filter((_, j) => j !== i))}><Trash2 size={14}/> Remove</button></div>
        <div className="adm-grid3"><label className="adm-field"><span>Platform</span><select value={x.platform || 'website'} onChange={e => upd(i, { platform: e.target.value, label: SOCIAL_PRESETS.find(p => p.id === e.target.value)?.label || x.label })}>{SOCIAL_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label><label className="adm-field"><span>Label</span><input value={x.label || ''} onChange={e => upd(i, { label: e.target.value })}/></label><label className="adm-field"><span>URL</span><input value={x.url || ''} onChange={e => upd(i, { url: e.target.value })} placeholder="https://…"/></label></div>
        <div className="adm-actions"><label className="adm-btn sm" style={{ cursor: 'pointer' }}><Upload size={14}/> Upload icon image<input type="file" accept="image/*" hidden onChange={e => icon(i, e)}/></label>{x.icon_url && <><img className="adm-thumb" style={{ width: 36, height: 36 }} src={x.icon_url} alt=""/><button type="button" className="adm-btn sm" onClick={() => upd(i, { icon_url: '' })}>Use built-in icon</button></>}</div></div>)}
        <button type="button" className="adm-btn" onClick={() => setSoc([...soc, { platform: 'facebook', label: 'Facebook', url: '', icon_url: '' }])}><Plus size={15}/> Add social link</button></div></section>
    <section className="adm-card"><h3>Ads</h3>
      <label className="adm-check"><input type="checkbox" checked={!!f.ads_enabled} onChange={set('ads_enabled')}/> Show ads on the website <small style={{ display: 'block', color: '#6b7280', fontWeight: 400 }}>Master switch. Create the ads in Ads manager.</small></label>
      <div className="adm-field" style={{ marginTop: 14 }}><span>When should ads load?</span>
        <label className="adm-check"><input type="radio" name="adsmode" checked={!!f.ads_require_consent} onChange={() => setF({ ...f, ads_require_consent: true })}/><span><b>After the visitor accepts cookies</b> <small style={{ display: 'block', color: '#6b7280', fontWeight: 400 }}>Required in the EU/UK. The cookie notice shows “Accept all / Essential only”.</small></span></label>
        <label className="adm-check" style={{ marginTop: 8 }}><input type="radio" name="adsmode" checked={!f.ads_require_consent} onChange={() => setF({ ...f, ads_require_consent: false })}/><span><b>Always, with or without cookie acceptance</b> <small style={{ display: 'block', color: '#6b7280', fontWeight: 400 }}>Ads load immediately for every visitor. The cookie notice becomes information only.</small></span></label></div></section>
    <section className="adm-card"><h3>Download buttons</h3>
      <label className="adm-field" style={{ maxWidth: 320 }}><span>Countdown before redirect (seconds)</span><input type="number" min="0" max="300" value={f.download_wait_seconds} onChange={set('download_wait_seconds')}/><span className="adm-hint">Used by the listing “Download” button. Buttons you add in the editor have their own value (default 30). 0 = redirect immediately.</span></label></section>
    <section className="adm-card"><h3>Download password gate</h3><p className="adm-sub">Replaces the Download button with “Enter the 4-digit password”. The visitor finds the password lower down the page, enters it, and lands on a separate download page with the countdown and the real Download button. Takes priority over unlock steps. Run supabase/v15_password_gate.sql and v16_password_scratch.sql once first.</p>
      <label className="adm-check"><input type="checkbox" checked={!!f.password_enabled} onChange={e => setF({ ...f, password_enabled: e.target.checked })}/> Turn on the password gate for all listings</label>
      <div className="adm-grid2" style={{ marginTop: 14 }}><label className="adm-field"><span>How does the visitor get the password?</span><select value={f.password_reveal || (f.password_show === false ? 'none' : 'scratch')} onChange={e => setF({ ...f, password_reveal: e.target.value })}><option value="scratch">Scratch card under the password box (timer, then scratch with sound)</option><option value="page">A password box lower down the page</option><option value="none">Not shown, I share it elsewhere (video, Telegram)</option></select></label>
        <label className="adm-field"><span>Scratch card timer (seconds)</span><input type="number" min="0" max="60" value={f.password_scratch_wait ?? 10} onChange={e => setF({ ...f, password_scratch_wait: e.target.value })}/><span className="adm-hint">The wait after tapping “Scratch to reveal”, before the card appears. 0 = no wait.</span></label></div>
      <label className="adm-field" style={{ marginTop: 14 }}><span>Hint under the password box (optional)</span><input value={f.password_hint || ''} maxLength={200} onChange={e => setF({ ...f, password_hint: e.target.value })} placeholder="The password is in the box at the bottom of this page."/></label></section>
    <section className="adm-card"><h3>Download unlock steps (site default)</h3><p className="adm-sub">Show a short checklist before every download button unlocks: subscribe, join Telegram, view a sponsor link. Each listing can override this. Run supabase/v14_unlock_steps.sql once first.</p>
      <label className="adm-check"><input type="checkbox" checked={!!f.unlock_enabled} onChange={e => setF({ ...f, unlock_enabled: e.target.checked })}/> Turn on unlock steps for all listings</label>
      <label className="adm-check" style={{ marginTop: 8 }}><input type="checkbox" checked={f.unlock_final_page !== false} onChange={e => setF({ ...f, unlock_final_page: e.target.checked })}/> <span>Finish on a separate download page <small style={{ display: 'block', color: '#6b7280', fontWeight: 400 }}>A second page view with a countdown and extra ad slots (uses the countdown seconds above).</small></span></label>
      <div style={{ marginTop: 14 }}><UnlockEditor steps={f.unlock_steps} onChange={v => setF({ ...f, unlock_steps: v })}/></div></section>
    <div className="adm-actions"><button className="adm-btn primary" disabled={busy}><Save size={15}/> {busy ? 'Saving…' : 'Save settings'}</button></div>
  </form>
}
