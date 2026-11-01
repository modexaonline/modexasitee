import { useEffect, useMemo, useRef, useState } from 'react'
import { Save, Search, Cookie, Info, ExternalLink, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setContentCache } from '../lib/siteContent'
import { isPathAdsOff } from '../lib/adsControl'
import { Switch } from './fields'
import './admin-extra.css'

// Admin → Page manager. Per-page "Show ads" switches + the cookie / consent rules for ads.
// Saved in site_content('ads_control') (no SQL needed). Blog / guide posts use their own "Show ads on this post" flag (posts.ads_enabled).
const STATIC = [
  { g: 'Main pages', path: '/', title: 'Home' }, { g: 'Main pages', path: '/apps', title: 'Apps list' }, { g: 'Main pages', path: '/games', title: 'Games list' },
  { g: 'Main pages', path: '/guide', title: 'Guides list' }, { g: 'Main pages', path: '/blog', title: 'Blog list' }, { g: 'Main pages', path: '/search', title: 'Search' },
  { g: 'Main pages', path: '/saved', title: 'Saved' }, { g: 'Main pages', path: '/submit-mod', title: 'Submit a mod' },
  { g: 'Info pages', path: '/about', title: 'About' }, { g: 'Info pages', path: '/contact', title: 'Contact' }, { g: 'Info pages', path: '/guidelines', title: 'Guidelines' },
  { g: 'Info pages', path: '/faq', title: 'FAQ' }, { g: 'Info pages', path: '/privacy', title: 'Privacy Policy' }, { g: 'Info pages', path: '/terms', title: 'Terms' },
  { g: 'Info pages', path: '/cookies', title: 'Cookie Policy' }, { g: 'Info pages', path: '/copyright', title: 'Copyright' },
  { g: 'Whole sections', path: '/games/*', title: 'Every game page', note: 'all /games/…' }, { g: 'Whole sections', path: '/apps/*', title: 'Every app page', note: 'all /apps/…' },
  { g: 'Whole sections', path: '/blog/*', title: 'Every blog post', note: 'all /blog/…' }, { g: 'Whole sections', path: '/guide/*', title: 'Every guide post', note: 'all /guide/…' },
  { g: 'Whole sections', path: '/download/*', title: 'Every download page', note: 'all /download/…' }, { g: 'Whole sections', path: '/page/*', title: 'Every custom page', note: 'all /page/…' },
]
const GROUPS = ['All', 'Main pages', 'Info pages', 'Whole sections', 'Games', 'Apps', 'Guides', 'Blog posts', 'Custom pages']
const PRESETS = [
  { id: 'always', label: 'Everything shows without cookies', cards: 'always', scripts: 'always' },
  { id: 'mixed', label: 'Cards without cookies, scripts after Accept', cards: 'always', scripts: 'accept' },
  { id: 'accept', label: 'Everything only after Accept', cards: 'accept', scripts: 'accept' },
]
const MODE = [{ id: 'always', label: 'Show without cookies (always)' }, { id: 'accept', label: 'Only after the visitor accepts cookies' }]
const mono = { fontFamily: 'ui-monospace,Menlo,Consolas,monospace', fontSize: 12 }

export default function AdminPageManager({ onNotice, onError }) {
  const [ctl, setCtl] = useState({ cards: 'accept', scripts: 'accept', banner: true, banner_text: '', pages_off: [] })
  const [dirty, setDirty] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const [posts, setPosts] = useState([]), [mods, setMods] = useState([]), [pages, setPages] = useState([])
  const [q, setQ] = useState(''), [group, setGroup] = useState('All')
  const ctlRef = useRef(ctl); ctlRef.current = ctl

  useEffect(() => {
    let alive = true
    Promise.all([
      supabase.from('site_content').select('data').eq('key', 'ads_control').maybeSingle(),
      supabase.from('site_settings').select('ads_require_consent').eq('id', 1).maybeSingle(),
      supabase.from('posts').select('id,slug,title,post_type,status,ads_enabled').order('created_at', { ascending: false }).limit(1000),
      supabase.from('mods').select('slug,title,listing_type,status').order('created_at', { ascending: false }).limit(1000),
      supabase.from('pages').select('slug,title,status').order('created_at', { ascending: false }).limit(500),
    ]).then(([c, st, p, m, pg]) => {
      if (!alive) return
      const legacy = st.data && st.data.ads_require_consent === false ? 'always' : 'accept', d = c.data?.data || {}
      setCtl({ cards: d.cards || legacy, scripts: d.scripts || legacy, banner: typeof d.banner === 'boolean' ? d.banner : true, banner_text: d.banner_text || '', pages_off: Array.isArray(d.pages_off) ? d.pages_off : [] })
      setPosts(p.data || []); setMods(m.data || []); setPages(pg.data || []); setLoading(false)
    })
    return () => { alive = false }
  }, [])

  async function persist(next, okMsg) {
    const clean = { cards: next.cards, scripts: next.scripts, banner: next.banner !== false, banner_text: (next.banner_text || '').slice(0, 600), pages_off: [...new Set(next.pages_off)] }
    const { error } = await supabase.from('site_content').upsert({ key: 'ads_control', data: clean }, { onConflict: 'key' })
    if (error) { onError(error.message); return false }
    setContentCache('ads_control', clean); setCtl(clean); if (okMsg) onNotice(okMsg); return true
  }
  async function saveRules() { setBusy(true); const ok = await persist(ctlRef.current, 'Saved. The new cookie rules are live.'); setBusy(false); if (ok) setDirty(false) }
  const edit = patch => { setCtl(c => ({ ...c, ...patch })); setDirty(true) }
  const needsAccept = ctl.cards === 'accept' || ctl.scripts === 'accept'

  const rows = useMemo(() => {
    const r = STATIC.map(x => ({ ...x, kind: 'path' }))
    mods.filter(x => x.listing_type === 'game').forEach(x => r.push({ g: 'Games', path: '/games/' + x.slug, title: x.title, kind: 'path', draft: x.status !== 'published' }))
    mods.filter(x => x.listing_type !== 'game').forEach(x => r.push({ g: 'Apps', path: '/apps/' + x.slug, title: x.title, kind: 'path', draft: x.status !== 'published' }))
    posts.filter(x => x.post_type === 'guide').forEach(x => r.push({ g: 'Guides', path: '/guide/' + x.slug, title: x.title, kind: 'post', id: x.id, ads: x.ads_enabled !== false, draft: x.status !== 'published' }))
    posts.filter(x => x.post_type !== 'guide').forEach(x => r.push({ g: 'Blog posts', path: '/blog/' + x.slug, title: x.title, kind: 'post', id: x.id, ads: x.ads_enabled !== false, draft: x.status !== 'published' }))
    pages.forEach(x => r.push({ g: 'Custom pages', path: '/page/' + x.slug, title: x.title, kind: 'path', draft: x.status !== 'published' }))
    return r
  }, [posts, mods, pages])

  // a row is OFF if its own switch is off, or a whole-section switch above covers it
  const sectionOff = path => ctl.pages_off.some(e => e.endsWith('/*') && isPathAdsOff([e], path))
  const ownOff = row => row.kind === 'post' ? row.ads === false : ctl.pages_off.includes(row.path)
  const isOff = row => ownOff(row) || (!row.path.endsWith('/*') && sectionOff(row.path))
  const shown = rows.filter(r => (group === 'All' || r.g === group) && (!q.trim() || (r.title + ' ' + r.path).toLowerCase().includes(q.toLowerCase())))
  const offCount = rows.filter(isOff).length

  async function setRow(row, on) {
    if (row.kind === 'post') {
      const { error } = await supabase.from('posts').update({ ads_enabled: on }).eq('id', row.id)
      if (error) return onError(error.message)
      setPosts(l => l.map(p => p.id === row.id ? { ...p, ads_enabled: on } : p)); return
    }
    const cur = ctlRef.current, list = cur.pages_off.filter(e => e !== row.path)
    await persist({ ...cur, pages_off: on ? list : [...list, row.path] })
  }
  async function bulk(on) {
    if (!shown.length || !confirm(`Turn ads ${on ? 'ON' : 'OFF'} for the ${shown.length} page${shown.length === 1 ? '' : 's'} shown?`)) return
    setBusy(true)
    const postRows = shown.filter(r => r.kind === 'post'), pathRows = shown.filter(r => r.kind === 'path')
    const ids = postRows.filter(r => (r.ads !== false) !== on).map(r => r.id)
    if (ids.length) { const { error } = await supabase.from('posts').update({ ads_enabled: on }).in('id', ids); if (error) { onError(error.message); setBusy(false); return } }
    setPosts(l => l.map(p => postRows.some(r => r.id === p.id) ? { ...p, ads_enabled: on } : p))
    const touched = new Set(pathRows.map(r => r.path)), cur = ctlRef.current
    const kept = cur.pages_off.filter(e => !touched.has(e))
    await persist({ ...cur, pages_off: on ? kept : [...kept, ...touched] }, `Ads turned ${on ? 'ON' : 'OFF'} for ${shown.length} page${shown.length === 1 ? '' : 's'}.`)
    setBusy(false)
  }

  if (loading) return <div className="adm"><p>Loading…</p></div>
  return <div className="adm">
    <div className="adm-head"><div><h2>Page manager</h2><p>Full control over ads: switch ads ON or OFF for each page, and decide whether ads need the visitor’s cookie consent.</p></div></div>

    <section className="adm-card" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Cookie size={20}/><div><h3 style={{ margin: 0 }}>Cookies &amp; ads</h3><p className="adm-sub" style={{ margin: '2px 0 0' }}>Choose when ads may appear. “Cards” are the Advertisement direct-link cards. “Scripts” are the Monetag scripts (popunder, push, vignette…) and manual ad units that run network code.</p></div></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{PRESETS.map(p => <button type="button" key={p.id} className={`adm-btn ${ctl.cards === p.cards && ctl.scripts === p.scripts ? 'primary' : ''}`} onClick={() => edit({ cards: p.cards, scripts: p.scripts })}>{p.label}</button>)}</div>
      <div className="adm-grid2">
        <label className="adm-field"><span>Cards (direct link ads)</span><select value={ctl.cards} onChange={e => edit({ cards: e.target.value })}>{MODE.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
        <label className="adm-field"><span>Scripts (popunder, push, vignette, banners…)</span><select value={ctl.scripts} onChange={e => edit({ scripts: e.target.value })}>{MODE.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div><b style={{ fontSize: 14 }}>Show the cookie banner</b><p className="adm-sub" style={{ margin: '2px 0 0' }}>{needsAccept ? 'Always shown while any ad kind needs “Accept”, otherwise visitors could not accept.' : 'Optional notice. Ads do not need it with your current choice.'}</p></div>
        <Switch checked={needsAccept ? true : ctl.banner} onChange={v => { if (!needsAccept) edit({ banner: v }) }} label="Show cookie banner"/>
      </div>
      <label className="adm-field"><span>Custom banner text (optional)</span><textarea rows={2} maxLength={600} value={ctl.banner_text} onChange={e => edit({ banner_text: e.target.value })} placeholder="Leave empty to use the default wording."/></label>
      {needsAccept && <div className="adm-alert warn"><AlertTriangle size={16} style={{ flex: 'none', marginTop: 2 }}/><div>Visitors who tap “Essential only” (or ignore the banner) will see <b>no</b> {ctl.cards === 'accept' && ctl.scripts === 'accept' ? 'ads' : ctl.cards === 'accept' ? 'cards' : 'scripts'}. This costs revenue. Pick “without cookies” if you want ads for everyone. Check that this fits the privacy laws of your visitors’ countries.</div></div>}
      <div className="adm-actions"><button type="button" className="adm-btn primary" disabled={busy || !dirty} onClick={saveRules}><Save size={15}/> {busy ? 'Saving…' : dirty ? 'Save cookie rules' : 'Saved'}</button></div>
    </section>

    <section className="adm-card" style={{ padding: 0 }}>
      <div style={{ padding: 16, display: 'grid', gap: 12, borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div><h3 style={{ margin: 0 }}>Ads on each page</h3><p className="adm-sub" style={{ margin: '2px 0 0' }}>{offCount} of {rows.length} pages have ads OFF. Changes are live immediately.</p></div>
          <div style={{ display: 'flex', gap: 8 }}><button type="button" className="adm-btn" disabled={busy || !shown.length} onClick={() => bulk(true)}>All shown: ON</button><button type="button" className="adm-btn danger" disabled={busy || !shown.length} onClick={() => bulk(false)}>All shown: OFF</button></div>
        </div>
        <div className="adm-tabs" role="tablist" aria-label="Page groups">{GROUPS.map(g => <button key={g} type="button" role="tab" aria-selected={group === g} className={group === g ? 'active' : ''} onClick={() => setGroup(g)}>{g}</button>)}</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px' }}><Search size={16}/><input style={{ border: 0, outline: 0, flex: 1, background: 'none' }} value={q} onChange={e => setQ(e.target.value)} placeholder="Search a page by name or link…" aria-label="Search pages"/></label>
      </div>
      <div>{shown.length === 0 ? <p style={{ padding: 20, color: '#6b7280' }}>No pages found.</p> : shown.map(r => {
        const off = isOff(r), viaSection = !ownOff(r) && sectionOff(r.path)
        return <div key={r.kind + r.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}{r.draft && <small style={{ color: '#b45309', fontWeight: 600 }}> · draft</small>}</b>
            <small style={{ ...mono, color: '#6b7280' }}>{r.path}{r.note ? ` · ${r.note}` : ''}{viaSection ? ' · OFF via section switch' : ''}</small>
          </div>
          {!r.path.endsWith('/*') && <a href={r.path} target="_blank" rel="noopener noreferrer" aria-label="Open page" style={{ color: '#6b7280' }}><ExternalLink size={14}/></a>}
          <span style={{ fontSize: 12, fontWeight: 700, color: off ? '#b91c1c' : '#15803d', minWidth: 28 }}>{off ? 'OFF' : 'ON'}</span>
          <Switch checked={!ownOff(r)} onChange={v => setRow(r, v)} label={`Show ads on ${r.title}`}/>
        </div>
      })}</div>
    </section>
    <div className="adm-alert info"><Info size={16} style={{ flex: 'none', marginTop: 2 }}/><div>OFF stops the cards, banners and the sticky bar on that page. Site-wide scripts (popunder, push, vignette) will not start on a page that is OFF, but if a visitor already opened another page first they are already running and keep working until the visitor reloads. Blog and guide posts use the same switch as “Show ads on this post” in the post editor.</div></div>
  </div>
}
