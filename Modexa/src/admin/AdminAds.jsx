import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Copy, Trash2, Pause, Play, Megaphone, AlertTriangle, Info, Search, X, ClipboardCopy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AD_SIZES, AD_KINDS, AD_PLACEMENTS, GLOBAL_PLACEMENTS, unitDims, slugKey } from '../lib/adConfig'
import { refreshAds } from '../lib/useAds'
import { setSettingsCache } from '../lib/useSettings'
import AdUnit from '../components/AdUnit'
import { Switch } from './fields'
import MonetagCard from './MonetagCard'
import './admin-extra.css'

const BLANK = { name: '', slot_key: '', kind: 'banner', size: '300x250', custom_width: 300, custom_height: 250, render_mode: 'isolated', code: '', link_url: '', link_label: 'Learn more', link_text: '', link_style: 'button', placement: 'blog_in_content', position_after: 3, repeat_every: 0, devices: 'all', scope: 'all', target_slugs: [], exclude_slugs: [], label: 'Advertisement', priority: 0, status: 'active' }
const kindOf = id => AD_KINDS.find(k => k.id === id) || AD_KINDS[0]
const sizeOf = u => u.kind === 'direct_link' ? 'Direct link' : (u.kind === 'popunder' || u.kind === 'social_bar') ? 'Script' : u.size === 'custom' ? `${u.custom_width}×${u.custom_height}` : u.size === 'responsive' ? 'Responsive' : u.size
const placementLabel = id => AD_PLACEMENTS.find(p => p.id === id)?.label || id
function placementsFor(kind) {
  if (kind === 'popunder' || kind === 'social_bar') return AD_PLACEMENTS.filter(p => GLOBAL_PLACEMENTS.includes(p.id))
  if (kind === 'script') return AD_PLACEMENTS
  return AD_PLACEMENTS.filter(p => !GLOBAL_PLACEMENTS.includes(p.id))
}

export default function AdminAds({ onNotice, onError }) {
  const [mode, setModeRaw] = useState(() => { try { return localStorage.getItem('modexa-ads-tab') === 'manual' ? 'manual' : 'auto' } catch { return 'auto' } })
  const setMode = m => { setModeRaw(m); try { localStorage.setItem('modexa-ads-tab', m) } catch {} }
  const [ads, setAds] = useState([]), [loading, setLoading] = useState(true), [editing, setEditing] = useState(null), [busy, setBusy] = useState(false)
  const [posts, setPosts] = useState([]), [games, setGames] = useState([]), [master, setMaster] = useState({ ads_enabled: false, ads_require_consent: true })
  const [q, setQ] = useState(''), [fp, setFp] = useState('all'), [fs, setFs] = useState('all')

  async function load() {
    setLoading(true)
    const [a, p, g, s] = await Promise.all([
      supabase.from('ad_units').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('slug,title').order('created_at', { ascending: false }).limit(500),
      supabase.from('games').select('slug,name').order('sort_order'),
      supabase.from('site_settings').select('ads_enabled,ads_require_consent').eq('id', 1).maybeSingle(),
    ])
    setLoading(false)
    if (a.error) { onError(a.error.message); return }
    setAds(a.data || []); setPosts(p.data || []); setGames(g.data || []); if (s.data) setMaster(s.data)
  }
  useEffect(() => { load() }, [])

  async function saveMaster(patch) {
    const next = { ...master, ...patch }; setMaster(next)
    const { error } = await supabase.from('site_settings').update(patch).eq('id', 1)
    if (error) { onError(error.message); load(); return }
    setSettingsCache(next); onNotice(patch.ads_enabled === true ? 'Ads are ON for the whole site.' : patch.ads_enabled === false ? 'Ads are OFF, nothing will show.' : 'Saved.')
  }

  const set = patch => setEditing(e => ({ ...e, ...patch }))
  function changeKind(kind) {
    const k = kindOf(kind), pl = placementsFor(kind)
    set({ kind, placement: pl.some(p => p.id === editing.placement) ? editing.placement : (k.global ? 'global_body' : 'blog_in_content'), render_mode: k.global ? 'inline' : editing.render_mode })
  }

  async function save(e) {
    e.preventDefault()
    const u = { ...editing }, k = kindOf(u.kind)
    if (!u.name.trim()) return onError('Give this ad a name.')
    if (k.code && !u.code.trim()) return onError('Paste the ad code from your ad network.')
    if (u.kind === 'direct_link' && !/^https?:\/\//i.test(u.link_url.trim())) return onError('Direct link must start with https://')
    if ((u.code || '').length > 20000) return onError('Ad code is too long (max 20,000 characters).')
    const { id, created_at, updated_at, ...payload } = u
    payload.name = payload.name.trim(); payload.slot_key = slugKey(payload.slot_key || payload.name)
    payload.link_url = (payload.link_url || '').trim(); payload.position_after = Math.max(1, Number(payload.position_after) || 3); payload.repeat_every = Math.max(0, Number(payload.repeat_every) || 0)
    payload.custom_width = Math.max(1, Number(payload.custom_width) || 300); payload.custom_height = Math.max(1, Number(payload.custom_height) || 250); payload.priority = Number(payload.priority) || 0
    setBusy(true)
    const { error } = id ? await supabase.from('ad_units').update(payload).eq('id', id) : await supabase.from('ad_units').insert(payload)
    setBusy(false)
    if (error) { onError(/duplicate key/i.test(error.message) ? 'That shortcode is already used by another ad. Change the shortcode.' : error.message); return }
    onNotice(id ? 'Ad updated.' : 'Ad created.'); setEditing(null); refreshAds(); load()
  }
  async function toggle(u) { const status = u.status === 'active' ? 'paused' : 'active'; const { error } = await supabase.from('ad_units').update({ status }).eq('id', u.id); if (error) return onError(error.message); onNotice(status === 'active' ? 'Ad is live.' : 'Ad paused.'); refreshAds(); load() }
  async function remove(u) { if (!confirm(`Delete “${u.name}” permanently?`)) return; const { error } = await supabase.from('ad_units').delete().eq('id', u.id); if (error) return onError(error.message); onNotice('Ad deleted.'); refreshAds(); load() }
  const duplicate = u => { const { id, created_at, updated_at, ...rest } = u; setEditing({ ...BLANK, ...rest, name: `${u.name} (copy)`, slot_key: `${u.slot_key}-copy`.slice(0, 60), status: 'paused' }) }
  const copy = t => { navigator.clipboard?.writeText(t); onNotice(`Copied ${t}`) }

  const shown = useMemo(() => ads.filter(a => (fp === 'all' || a.placement === fp) && (fs === 'all' || a.status === fs) && (!q.trim() || `${a.name} ${a.slot_key}`.toLowerCase().includes(q.toLowerCase()))), [ads, q, fp, fs])

  if (editing) {
    const k = kindOf(editing.kind), dims = unitDims(editing), isGlobal = k.global || GLOBAL_PLACEMENTS.includes(editing.placement)
    const needsTarget = editing.placement.startsWith('blog_') || editing.placement.startsWith('mod_')
    const pickList = editing.scope === 'selected_games' ? games.map(g => ({ slug: g.slug, title: g.name })) : posts
    const toggleIn = (field, slug) => set({ [field]: (editing[field] || []).includes(slug) ? editing[field].filter(x => x !== slug) : [...(editing[field] || []), slug] })
    return <form className="adm" onSubmit={save}>
      <div className="adm-head"><div><h2>{editing.id ? 'Edit ad' : 'New ad'}</h2><p>Paste the code from your ad network, choose size and where it shows. It then works on every matching blog automatically.</p></div><button type="button" className="adm-btn" onClick={() => setEditing(null)}><X size={15}/> Close</button></div>
      <div className="adm-split">
        <div className="adm">
          <section className="adm-card"><h3>1 · Basics</h3><p className="adm-sub">Name it so you can find it later.</p>
            <div className="adm-grid2">
              <label className="adm-field"><span>Ad name *</span><input required value={editing.name} maxLength={120} onChange={e => set({ name: e.target.value, slot_key: editing.id || editing._keyTouched ? editing.slot_key : slugKey(e.target.value) })} placeholder="e.g. Blog middle banner 300×250"/></label>
              <label className="adm-field"><span>Shortcode</span><input value={editing.slot_key} maxLength={60} onChange={e => set({ slot_key: slugKey(e.target.value), _keyTouched: true })} placeholder="auto"/><span className="adm-hint">Use <code className="adm-code-chip">[ad:{editing.slot_key || 'your-key'}]</code> inside any blog to place this ad exactly there.</span></label>
            </div>
            <div className="adm-grid2" style={{ marginTop: 16 }}>
              <label className="adm-field"><span>Ad type</span><select value={editing.kind} onChange={e => changeKind(e.target.value)}>{AD_KINDS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select><span className="adm-hint">{k.help}</span></label>
              <label className="adm-field"><span>Status</span><select value={editing.status} onChange={e => set({ status: e.target.value })}><option value="active">Active (live)</option><option value="paused">Paused (hidden)</option></select></label>
            </div>
          </section>

          <section className="adm-card"><h3>2 · Ad code</h3>
            {editing.kind === 'direct_link' ? <>
              <p className="adm-sub">No code needed, paste your direct / smart link. It opens in a new tab with <code className="adm-code-chip">rel="sponsored nofollow"</code>.</p>
              <div className="adm-grid2"><label className="adm-field"><span>Direct link URL *</span><input value={editing.link_url} onChange={e => set({ link_url: e.target.value })} placeholder="https://…"/></label><label className="adm-field"><span>Button / link text</span><input value={editing.link_label} maxLength={80} onChange={e => set({ link_label: e.target.value })}/></label></div>
              <div className="adm-grid2" style={{ marginTop: 16 }}><label className="adm-field"><span>Description (optional)</span><input value={editing.link_text} maxLength={300} onChange={e => set({ link_text: e.target.value })} placeholder="Short text shown above or inside the button"/></label><label className="adm-field"><span>Style</span><select value={editing.link_style} onChange={e => set({ link_style: e.target.value })}><option value="button">Button</option><option value="card">Card</option><option value="text">Text link</option></select></label></div>
            </> : <>
              <p className="adm-sub">Paste the full snippet exactly as your network gave it (script tags, iframe, ins tag, anything).</p>
              <label className="adm-field"><span>Code {k.code ? '*' : ''}</span><textarea className="adm-code" spellCheck={false} value={editing.code} onChange={e => set({ code: e.target.value })} placeholder={'<script async src="https://…"></script>\n<ins …></ins>'}/></label>
              {!isGlobal && <div style={{ marginTop: 16 }}><label className="adm-field"><span>How should it render?</span><select value={editing.render_mode} onChange={e => set({ render_mode: e.target.value })}><option value="isolated">Auto (recommended), safe frame first; if the network shows nothing, runs directly on the page</option><option value="inline">Inline, runs directly on the page (AdSense & loader scripts)</option><option value="strict">Strict sandbox, most secure, but many networks will stay blank</option></select><span className="adm-hint"><b>Auto</b> works for almost every network: it tries a real same-site frame (best for document.write / atOptions banners) and automatically switches to running on the page if the frame stays empty. Choose <b>Inline</b> to force page mode (AdSense/native widgets). Avoid <b>Strict</b> unless your network supports it.</span></label></div>}
              <div className="adm-alert warn" style={{ marginTop: 14 }}><AlertTriangle size={16} style={{ flex: 'none', marginTop: 2 }}/><div>Only paste code from networks you trust, ad code can run on your visitors’ browsers. Pop-under and social-bar scripts run site-wide and can annoy visitors; use them carefully.</div></div>
            </>}
          </section>

          {editing.kind !== 'direct_link' && !k.global && <section className="adm-card"><h3>3 · Size</h3><p className="adm-sub">Pick the exact size your network gave you for this code.</p>
            <div className="adm-grid2"><label className="adm-field"><span>Ad size</span><select value={editing.size} onChange={e => set({ size: e.target.value })}>{AD_SIZES.map(s => <option key={s.id} value={s.id}>{s.w ? `${s.w} × ${s.h}, ${s.label}` : s.label}</option>)}</select><span className="adm-hint">{AD_SIZES.find(s => s.id === editing.size)?.note}</span></label>
              {editing.size === 'custom' && <div className="adm-grid2"><label className="adm-field"><span>Width (px)</span><input type="number" min="1" max="2000" value={editing.custom_width} onChange={e => set({ custom_width: e.target.value })}/></label><label className="adm-field"><span>Height (px)</span><input type="number" min="1" max="2000" value={editing.custom_height} onChange={e => set({ custom_height: e.target.value })}/></label></div>}
              {editing.size === 'responsive' && <label className="adm-field"><span>Height (px)</span><input type="number" min="1" max="2000" value={editing.custom_height} onChange={e => set({ custom_height: e.target.value })}/><span className="adm-hint">Width fills the available space.</span></label>}
            </div>
            <div className="adm-size-preview" style={{ marginTop: 14 }}><div className="adm-size-box" style={{ width: dims.fluid ? '100%' : Math.min(dims.w, 420), aspectRatio: dims.fluid ? undefined : `${dims.w} / ${dims.h}`, height: dims.fluid ? Math.min(dims.h, 160) : undefined }}>{dims.fluid ? `Responsive × ${dims.h}` : `${dims.w} × ${dims.h}`}</div></div>
          </section>}

          <section className="adm-card"><h3>{editing.kind === 'direct_link' ? '3' : k.global ? '3' : '4'} · Where it shows</h3>
            <div className="adm-grid2">
              <label className="adm-field"><span>Placement</span><select value={editing.placement} onChange={e => set({ placement: e.target.value })}>{placementsFor(editing.kind).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select><span className="adm-hint">{AD_PLACEMENTS.find(p => p.id === editing.placement)?.help}</span></label>
              <label className="adm-field"><span>Devices</span><select value={editing.devices} onChange={e => set({ devices: e.target.value })}><option value="all">Desktop + mobile</option><option value="desktop">Desktop only (≥768px)</option><option value="mobile">Mobile only (&lt;768px)</option></select></label>
            </div>
            {editing.placement === 'blog_in_content' && <div className="adm-grid3" style={{ marginTop: 16 }}>
              <label className="adm-field"><span>Show after paragraph #</span><input type="number" min="1" max="100" value={editing.position_after} onChange={e => set({ position_after: e.target.value })}/></label>
              <label className="adm-field"><span>Repeat every N paragraphs</span><input type="number" min="0" max="100" value={editing.repeat_every} onChange={e => set({ repeat_every: e.target.value })}/><span className="adm-hint">0 = show once.</span></label>
              <label className="adm-field"><span>Priority</span><input type="number" value={editing.priority} onChange={e => set({ priority: e.target.value })}/><span className="adm-hint">Higher shows first.</span></label>
            </div>}
            <label className="adm-field" style={{ marginTop: 16 }}><span>Label above the ad</span><input value={editing.label} maxLength={40} onChange={e => set({ label: e.target.value })} placeholder="Advertisement"/><span className="adm-hint">“Advertisement” or “Sponsored” keeps you compliant with most ad policies. Leave empty to hide.</span></label>
          </section>

          {needsTarget && <section className="adm-card"><h3>Targeting</h3><p className="adm-sub">Leave as “All” to run on every blog automatically.</p>
            <div className="adm-grid2"><label className="adm-field"><span>Run on</span><select value={editing.scope} onChange={e => set({ scope: e.target.value, target_slugs: [] })}><option value="all">All blogs / pages (automatic)</option><option value="selected_posts">Only selected blog posts</option><option value="selected_games">Only blogs / pages of selected games</option></select></label></div>
            {editing.scope !== 'all' && <div className="adm-field" style={{ marginTop: 14 }}><span>{editing.scope === 'selected_games' ? 'Games' : 'Posts'} ({(editing.target_slugs || []).length} selected)</span><div className="adm-chiplist">{pickList.length === 0 ? <em style={{ padding: 8, color: '#6b7280' }}>Nothing to choose from yet.</em> : pickList.map(x => <label key={x.slug}><input type="checkbox" checked={(editing.target_slugs || []).includes(x.slug)} onChange={() => toggleIn('target_slugs', x.slug)}/>{x.title}</label>)}</div></div>}
            <details style={{ marginTop: 14 }}><summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Exclude specific posts ({(editing.exclude_slugs || []).length})</summary><div className="adm-chiplist" style={{ marginTop: 8 }}>{posts.map(x => <label key={x.slug}><input type="checkbox" checked={(editing.exclude_slugs || []).includes(x.slug)} onChange={() => toggleIn('exclude_slugs', x.slug)}/>{x.title}</label>)}</div></details>
            <p className="adm-hint" style={{ marginTop: 10 }}>You can also switch ads off for one post: edit the post → untick “Show ads on this post”.</p>
          </section>}

          <div className="adm-actions"><button className="adm-btn primary" disabled={busy}>{busy ? 'Saving…' : editing.id ? 'Save changes' : 'Create ad'}</button><button type="button" className="adm-btn" onClick={() => setEditing(null)}>Cancel</button></div>
        </div>
        <aside className="adm-sticky">
          <section className="adm-card"><h3>Live preview</h3><p className="adm-sub">Some networks stay blank until your domain is approved.</p>
            {isGlobal ? <div className="adm-alert info"><Info size={16} style={{ flex: 'none', marginTop: 2 }}/><div>This script runs in the background on every public page, there is nothing visual to preview.</div></div> : <div className="adm-preview-wrap"><AdUnit unit={{ ...editing, id: 'preview', slot_key: editing.slot_key || 'preview' }} preview/></div>}
          </section>
          <section className="adm-card"><h3>Ad not showing?</h3><p className="adm-sub">Open your site with <code className="adm-code-chip">?adsdebug=1</code> (for example <a href="/?adsdebug=1" target="_blank" rel="noopener noreferrer">your home page</a>). A panel tells you if ads are off, consent is missing, an ad blocker is active, or the network returned an empty slot.</p></section>
          <section className="adm-card"><h3>Tips</h3><ul className="adm-tip-list"><li>Banner code sizes must match the size you pick.</li><li>Use <b>Inline</b> render for Google AdSense.</li><li>Pop-under / social bar need a <b>site-wide script</b> placement. They fire after a click, once per visitor per day.</li><li>Add a <b>Direct link</b> ad for affiliate / smartlink offers.</li><li>Test on a phone: use <b>Devices → Mobile only</b> for 320×50 banners.</li></ul></section>
        </aside>
      </div>
    </form>
  }

  return <div className="adm">
    <div className="adm-head"><div><h2>Ads manager</h2><p>Two ways to earn, use either or both: <b>Monetag Auto</b> (paste the script Monetag gives you and the ads appear by themselves) or <b>Manual ads</b> (you choose each ad, its size and where it shows).</p></div>{mode === 'manual' && <button className="adm-btn primary" onClick={() => setEditing({ ...BLANK })}><Plus size={16}/> New ad</button>}</div>
    <div className="adm-tabs" role="tablist" aria-label="Ads mode">
      <button type="button" role="tab" aria-selected={mode === 'auto'} className={mode === 'auto' ? 'active' : ''} onClick={() => setMode('auto')}>Monetag Auto</button>
      <button type="button" role="tab" aria-selected={mode === 'manual'} className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>Manual ads{ads.length ? ` (${ads.length})` : ''}</button>
    </div>
    {mode === 'auto' && <>
      <MonetagCard onNotice={onNotice} onError={onError}/>
      <section className="adm-card"><h3 style={{ margin: 0 }}>How Monetag Auto works</h3><ul className="adm-tip-list"><li>Paste the code from Monetag, save, and it is loaded on every page. Monetag decides where and when its ads show.</li><li>It does <b>not</b> need the “Show ads on the website” switch in Manual ads.</li><li>Want a banner in an exact spot (inside a blog, under a download button)? Use the <b>Manual ads</b> tab.</li></ul></section>
    </>}
    {mode === 'manual' && <>
    <section className="adm-card" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div><h3 style={{ margin: 0 }}>Show manual ads on the website</h3><p className="adm-sub" style={{ margin: '4px 0 0' }}>Master switch. When OFF, no ad code is loaded anywhere.</p></div>
        <Switch checked={master.ads_enabled} onChange={v => saveMaster({ ads_enabled: v })} label="Ads enabled"/>
      </div>
      {master.ads_enabled && <label className="adm-check"><input type="checkbox" checked={master.ads_require_consent} onChange={e => saveMaster({ ads_require_consent: e.target.checked })}/><span>Load ads only after the visitor accepts cookies <small style={{ display: 'block', color: '#6b7280', fontWeight: 400 }}>Recommended (required in the EU/UK and many other regions). The cookie notice then shows “Accept all / Essential only”. Privacy and Cookie policies get an Advertising section automatically.</small></span></label>}
      <div className="adm-alert info"><Info size={16} style={{ flex: 'none', marginTop: 2 }}/><div><b>Real ads can stay blank</b> until your ad network approves modexa.online, when there is nothing to serve (low fill), or if the visitor uses an ad blocker. Test in a private window with extensions off and add <code className="adm-code-chip">?adsdebug=1</code> to any page URL for a live diagnosis.</div></div>
      {!master.ads_enabled && <div className="adm-alert warn"><AlertTriangle size={16} style={{ flex: 'none', marginTop: 2 }}/><div>Ads are currently <b>OFF</b>. Create your ads, then switch this on.</div></div>}
    </section>
    <section className="adm-card" style={{ padding: 0 }}>
      <div className="adm-filters" style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
        <label className="adm-field" style={{ flex: 1 }}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or shortcode…" aria-label="Search ads"/></label>
        <select className="adm-input" value={fp} onChange={e => setFp(e.target.value)} aria-label="Filter by placement"><option value="all">All placements</option>{AD_PLACEMENTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
        <select className="adm-input" value={fs} onChange={e => setFs(e.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="paused">Paused</option></select>
      </div>
      {loading ? <p style={{ padding: 24, color: '#6b7280' }}>Loading…</p> : shown.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}><Megaphone size={28}/><h3 style={{ margin: '10px 0 4px' }}>{ads.length ? 'No ads match' : 'No ads yet'}</h3><p style={{ margin: 0 }}>{ads.length ? 'Try other filters.' : 'Create your first ad, banner, pop-under or direct link.'}</p></div> :
        <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Ad</th><th>Type</th><th>Size</th><th>Placement</th><th>Runs on</th><th>Status</th><th>Actions</th></tr></thead><tbody>{shown.map(a => <tr key={a.id}>
          <td><div className="adm-name"><b>{a.name}</b><small><button type="button" className="adm-code-chip" style={{ cursor: 'pointer' }} onClick={() => copy(`[ad:${a.slot_key}]`)} title="Copy shortcode"><ClipboardCopy size={11}/> [ad:{a.slot_key}]</button></small></div></td>
          <td>{kindOf(a.kind).label.split(' / ')[0]}</td><td>{sizeOf(a)}</td>
          <td>{placementLabel(a.placement)}{a.placement === 'blog_in_content' && <small style={{ display: 'block', color: '#6b7280' }}>after ¶{a.position_after}{a.repeat_every ? `, every ${a.repeat_every}` : ''}</small>}</td>
          <td>{a.scope === 'all' ? 'All' : a.scope === 'selected_posts' ? `${(a.target_slugs || []).length} posts` : `${(a.target_slugs || []).length} games`}{a.devices !== 'all' && <small style={{ display: 'block', color: '#6b7280' }}>{a.devices} only</small>}</td>
          <td><span className={`adm-pill ${a.status === 'active' ? 'green' : 'amber'}`}>{a.status === 'active' ? 'Active' : 'Paused'}</span></td>
          <td><div className="adm-actions"><button className="adm-btn sm" onClick={() => setEditing({ ...BLANK, ...a, target_slugs: a.target_slugs || [], exclude_slugs: a.exclude_slugs || [] })} title="Edit"><Pencil size={14}/></button><button className="adm-btn sm" onClick={() => toggle(a)} title={a.status === 'active' ? 'Pause' : 'Activate'}>{a.status === 'active' ? <Pause size={14}/> : <Play size={14}/>}</button><button className="adm-btn sm" onClick={() => duplicate(a)} title="Duplicate"><Copy size={14}/></button><button className="adm-btn sm danger" onClick={() => remove(a)} title="Delete"><Trash2 size={14}/></button></div></td>
        </tr>)}</tbody></table></div>}
    </section>
    </>}
  </div>
}
