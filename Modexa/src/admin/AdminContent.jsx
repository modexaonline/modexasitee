import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Copy, Trash2, Eye, EyeOff, ExternalLink, X, Search, FilePlus2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { refreshMods } from '../lib/useMods'
import { refreshPosts } from '../lib/usePosts'
import { useSettings } from '../lib/useSettings'
import { getSitemapState, setInSitemap, normPath } from '../lib/sitemapAdmin'
import RichEditor from './RichEditor'
import { ImageField, Counter, slugify, FaqEditor, ListBox, cleanFaqs } from './fields'
import { cleanList } from '../lib/formatText'
import UnlockEditor from './UnlockEditor'
import { isPin, autoPassword } from '../lib/password'
import { cleanSteps, hasBadStep } from '../lib/unlock'
import './admin-extra.css'

export const PLATFORMS = ['Android', 'iOS', 'Android & iOS', 'Windows', 'PC', 'macOS', 'Linux', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Web / Browser', 'All platforms']
export const CATEGORIES = ['Action', 'Adventure', 'Arcade', 'Racing', 'Sports', 'Simulation', 'Strategy', 'Puzzle', 'RPG', 'Shooter', 'Tools', 'Social', 'Entertainment', 'Photo & Video', 'Productivity', 'Education', 'Music', 'Other']
export const BADGES = ['New', 'Popular', 'Hot', 'Updated', 'Premium', 'Mod', 'Pro', 'Unlocked']
// Dropdown that also keeps any older, hand-typed value so nothing is lost when editing existing listings.
function Pick({ label, value, onChange, options, empty }) {
  const list = value && !options.includes(value) ? [value, ...options] : options
  return <label className="adm-field"><span>{label}</span><select value={value || ''} onChange={ev => onChange(ev.target.value)}>{empty !== undefined && <option value="">{empty}</option>}{list.map(o => <option key={o} value={o}>{o}</option>)}</select></label>
}
const today = () => new Date().toISOString().slice(0, 10)
const CFG = {
  posts: { table: 'posts', title: 'Posts', one: 'post', href: r => (r.post_type === 'guide' ? '/guide/' : '/blog/') + r.slug },
  apps: { table: 'mods', title: 'App listings', one: 'app', type: 'app', href: r => '/apps/' + r.slug },
  games: { table: 'mods', title: 'Game listings', one: 'game', type: 'game', href: r => '/games/' + r.slug },
}
const blank = kind => kind === 'posts'
  ? { title: '', slug: '', post_type: 'blog', game_slug: '', category: '', excerpt: '', cover_image: '', content: '', faqs: [], status: 'draft', published_at: today(), ads_enabled: true, seo_title: '', seo_description: '', canonical_url: '', noindex: false, og_title: '', og_description: '', og_image: '', twitter_card: 'summary_large_image' }
  : { title: '', slug: '', listing_type: CFG[kind].type, excerpt: '', cover_image: '', content: '', game: '', category: '', platform: 'Android', version: '', creator: '', downloads: 0, download_url: '', badge: '', featured: false, features: [], requirements: [], install: [], faqs: [], status: 'draft', published_at: today(), seo_title: '', seo_description: '', canonical_url: '', noindex: false, og_title: '', og_description: '', og_image: '', twitter_card: 'summary_large_image' }

export default function AdminContent({ kind, onNotice, onError }) {
  const cfg = CFG[kind], settings = useSettings()
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [editing, setEditing] = useState(null), [busy, setBusy] = useState(false)
  const [q, setQ] = useState(''), [fs, setFs] = useState('all'), [ads, setAds] = useState([]), [gameList, setGameList] = useState([])
  const [sm, setSm] = useState({ paths: new Set(), ready: false }), [smBusy, setSmBusy] = useState('')
  async function load() {
    setLoading(true)
    let qb = supabase.from(cfg.table).select('*').order('created_at', { ascending: false }).limit(500)
    if (cfg.type) qb = qb.eq('listing_type', cfg.type)
    const [r, a, g] = await Promise.all([qb, supabase.from('ad_units').select('slot_key,name,kind,size').order('created_at', { ascending: false }), supabase.from('mods').select('slug,title').eq('listing_type', 'game')])
    setLoading(false)
    if (r.error) { onError(r.error.message); return }
    setRows(r.data || []); setAds(a.data || []); setGameList(g.data || [])
  }
  useEffect(() => { setEditing(null); setQ(''); setFs('all'); load(); getSitemapState().then(x => setSm({ paths: x.paths, ready: true })).catch(() => setSm({ paths: new Set(), ready: false })) }, [kind])
  async function toggleSitemap(r) {
    const path = normPath(cfg.href(r)), listed = sm.paths.has(path)
    if (!listed && r.status !== 'published') return onError('Publish this ' + cfg.one + ' first, drafts cannot go in the sitemap.')
    if (!listed && r.noindex) return onError('This page is set to noindex, so it is not added to the sitemap. Turn noindex off in its SEO settings first.')
    setSmBusy(r.id)
    try { const res = await setInSitemap(path, !listed); setSm({ paths: res.paths, ready: true }); onNotice(listed ? `Removed ${path} from the sitemap.` : `Added ${res.url} to the sitemap. It is live now (CDN may take up to 5 minutes). Resubmit sitemap.xml in Google Search Console if needed.`) }
    catch (er) { onError(er.message || 'Could not update the sitemap.') }
    setSmBusy('')
  }
  const set = p => setEditing(e => ({ ...e, ...p }))
  const refresh = () => { cfg.table === 'posts' ? refreshPosts() : refreshMods() }

  async function save(e) {
    e?.preventDefault()
    const r = { ...editing }
    if (!r.title.trim()) return onError('Title is required.')
    const { id, created_at, updated_at, ...payload } = r
    Object.keys(payload).forEach(k => { if (k[0] === '_') delete payload[k] })   // editor-only keys must never reach the database
    payload.title = payload.title.trim(); payload.slug = slugify(payload.slug || payload.title)
    if (!payload.slug) return onError('Slug is required.')
    if (!payload.published_at) payload.published_at = today()
    payload.faqs = cleanFaqs(payload.faqs)
    if (kind !== 'posts') { payload.downloads = Math.max(0, Number(payload.downloads) || 0); payload.description = payload.description || '' ; payload.features = cleanList(payload.features); payload.requirements = cleanList(payload.requirements); payload.install = cleanList(payload.install) }
    if (payload.download_url && !/^https?:\/\//i.test(payload.download_url)) return onError('Download link must start with https://')
    if (kind !== 'posts' && ('password_mode' in payload || 'download_password' in payload)) { payload.download_password = String(payload.download_password || '').trim(); if (payload.download_password && !isPin(payload.download_password)) return onError('The download password must be exactly 4 digits (or leave it empty for an automatic one).'); payload.password_mode = payload.password_mode || 'default' }
    if (kind !== 'posts' && ('unlock_mode' in payload || 'unlock_steps' in payload)) { if (hasBadStep(payload.unlock_steps)) return onError('Every unlock step link must start with https://'); payload.unlock_steps = cleanSteps(payload.unlock_steps); payload.unlock_mode = payload.unlock_mode || 'default'; if (payload.unlock_mode === 'custom' && !payload.unlock_steps.length) return onError('Add at least one unlock step, or choose another unlock option.') }
    setBusy(true)
    const { error } = id ? await supabase.from(cfg.table).update(payload).eq('id', id) : await supabase.from(cfg.table).insert(payload)
    setBusy(false)
    if (error) return onError(/duplicate key/i.test(error.message) ? 'This URL slug is already used. Change the slug.' : error.message)
    onNotice(id ? 'Saved.' : 'Created.'); refresh(); setEditing(null); load()
  }
  async function toggle(r) { const next = r.status === 'published' ? 'draft' : 'published'; const { error } = await supabase.from(cfg.table).update({ status: next, ...(next === 'published' && !r.published_at ? { published_at: today() } : {}) }).eq('id', r.id); if (error) return onError(error.message); onNotice(next === 'published' ? 'Published, live on the site.' : 'Moved to draft.'); refresh(); load() }
  async function remove(r) { if (!confirm(`Delete “${r.title}” permanently?`)) return; const { error } = await supabase.from(cfg.table).delete().eq('id', r.id); if (error) return onError(error.message); onNotice('Deleted.'); refresh(); load() }
  const duplicate = r => { const { id, created_at, updated_at, ...rest } = r; setEditing({ ...blank(kind), ...rest, title: r.title + ' (copy)', slug: r.slug + '-copy', status: 'draft' }) }
  const shown = useMemo(() => rows.filter(r => (fs === 'all' || r.status === fs) && (!q.trim() || `${r.title} ${r.slug}`.toLowerCase().includes(q.toLowerCase()))), [rows, q, fs])

  if (editing) {
    const e = editing, isPost = kind === 'posts'
    const listVal = k => Array.isArray(e[k]) ? e[k].join('\n') : (e[k] || '')
    return <form className="adm" onSubmit={save}>
      <div className="adm-head"><div><h2>{e.id ? `Edit ${cfg.one}` : `New ${cfg.one}`}</h2><p>{e.id ? e.title : 'Write in Compose view, or switch to HTML to edit code and add your ad scripts.'}</p></div>
        <div className="adm-actions"><button type="button" className="adm-btn" onClick={() => setEditing(null)}><X size={15}/> Close</button><button className="adm-btn primary" disabled={busy}>{busy ? 'Saving…' : e.status === 'published' ? 'Save & publish' : 'Save'}</button></div></div>
      <div className="adm-split">
        <div className="adm">
          <section className="adm-card">
            <label className="adm-field"><span>Title *</span><input required value={e.title} maxLength={160} onChange={ev => set({ title: ev.target.value, slug: e.id ? e.slug : slugify(ev.target.value) })} placeholder={isPost ? 'Post title' : `${cfg.one === 'game' ? 'Game' : 'App'} name`}/></label>
            <div className="adm-grid2" style={{ marginTop: 14 }}>
              <label className="adm-field"><span>URL slug</span><input value={e.slug} onChange={ev => set({ slug: slugify(ev.target.value) })}/><span className="adm-hint">{cfg.href({ ...e, slug: e.slug || 'slug' })}</span></label>
              {isPost ? <div className="adm-field"><span>Type</span><div className="adm-seg"><button type="button" className={e.post_type === 'blog' ? 'on' : ''} onClick={() => set({ post_type: 'blog' })}>Blog</button><button type="button" className={e.post_type === 'guide' ? 'on' : ''} onClick={() => set({ post_type: 'guide' })}>Guide</button></div></div>
                : <Pick label="Platform" value={e.platform} onChange={v => set({ platform: v })} options={PLATFORMS}/>}
            </div>
            <label className="adm-field" style={{ marginTop: 14 }}><span>Short summary</span><textarea rows={2} value={e.excerpt || ''} maxLength={300} onChange={ev => set({ excerpt: ev.target.value })} placeholder="One or two sentences shown on cards and search results"/></label>
          </section>
          <section className="adm-card"><RichEditor label={isPost ? 'Post content' : 'Full description'} value={e.content || ''} onChange={v => set({ content: v })} ads={ads} onNotice={onNotice} onError={onError} waitDefault={Number(settings.download_wait_seconds ?? 30)}/></section>
          {!isPost && <section className="adm-card"><h3>Download & details</h3><p className="adm-sub">The Download button appears at the top of the page when a link is added. Add more buttons anywhere inside the description with the editor’s Button tool.</p>
            <div className="adm-grid2"><label className="adm-field"><span>Main download link</span><input value={e.download_url || ''} onChange={ev => set({ download_url: ev.target.value })} placeholder="https://…"/></label><Pick label="Label / badge (optional)" value={e.badge} onChange={v => set({ badge: v })} options={BADGES} empty="None"/></div>
            <div className="adm-grid3" style={{ marginTop: 14 }}><label className="adm-field"><span>Version</span><input value={e.version || ''} onChange={ev => set({ version: ev.target.value })}/></label><label className="adm-field"><span>Creator / developer</span><input value={e.creator || ''} onChange={ev => set({ creator: ev.target.value })}/></label><Pick label="Category" value={e.category} onChange={v => set({ category: v })} options={CATEGORIES} empty="Select"/></div>
            <div className="adm-grid3" style={{ marginTop: 14 }}><label className="adm-field"><span>{kind === 'games' ? 'Series / game name' : 'Related game (optional)'}</span><input value={e.game || ''} onChange={ev => set({ game: ev.target.value })}/></label><label className="adm-field"><span>Downloads shown</span><input type="number" min="0" value={e.downloads ?? 0} onChange={ev => set({ downloads: ev.target.value })}/></label><label className="adm-check" style={{ alignSelf: 'end', minHeight: 42 }}><input type="checkbox" checked={!!e.featured} onChange={ev => set({ featured: ev.target.checked })}/> {kind === 'games' ? 'Show on home page' : 'Featured on home'}</label></div>
            <details style={{ marginTop: 16 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Optional lists (features, requirements, install steps)</summary><div className="adm-grid3" style={{ marginTop: 12 }}>{[['features', 'Features'], ['requirements', 'Requirements'], ['install', 'Install steps']].map(([k, l]) => <ListBox key={k} label={l} value={listVal(k)} onChange={v => set({ [k]: v })}/>)}</div></details>
            <div className="adm-grid2" style={{ marginTop: 14 }}>
              <label className="adm-field"><span>Download password (4 digits)</span><div className="adm-actions"><input value={e.download_password || ''} inputMode="numeric" maxLength={4} onChange={ev => set({ download_password: ev.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder={e.slug ? `Automatic: ${autoPassword(e.slug)}` : 'Automatic'} style={{ maxWidth: 160 }}/><button type="button" className="adm-btn sm" onClick={() => set({ download_password: String(1000 + Math.floor(Math.random() * 9000)) })}>Generate</button></div><span className="adm-hint">Only used when the site-wide password gate is on. Leave empty to use the automatic password shown in the box.</span></label>
              <label className="adm-field"><span>Password gate for this listing</span><select value={e.password_mode || 'default'} onChange={ev => set({ password_mode: ev.target.value })}><option value="default">Follow the site-wide setting (Site &amp; brand)</option><option value="off">Off, keep the normal download button</option></select></label></div>
            <div className="adm-field" style={{ marginTop: 14 }}><span>Download unlock steps</span>
              <select value={e.unlock_mode || 'default'} onChange={ev => set({ unlock_mode: ev.target.value })} style={{ maxWidth: 380 }}><option value="default">Follow the site-wide setting (Site &amp; brand)</option><option value="custom">Custom steps for this listing</option><option value="off">None, direct download button</option></select>
              <span className="adm-hint">Visitors complete short steps (subscribe, join Telegram, view a sponsor) before the download button unlocks. Needs the v14 SQL once.</span></div>
            {(e.unlock_mode || 'default') === 'custom' && <div style={{ marginTop: 10 }}><UnlockEditor steps={e.unlock_steps} onChange={v => set({ unlock_steps: v })}/></div>}
          </section>}
          <section className="adm-card"><h3>FAQs</h3><p className="adm-sub">Questions and answers shown at the bottom of the page as an accordion, and sent to Google as FAQ schema. Paste your whole FAQ list in the top box and it splits into separate FAQs automatically. Empty ones are ignored.</p><FaqEditor items={e.faqs} onChange={faqs => set({ faqs })}/></section>
          <section className="adm-card"><h3>Search & sharing (SEO)</h3>
            <label className="adm-field"><span>SEO title</span><input value={e.seo_title || ''} onChange={ev => set({ seo_title: ev.target.value })} placeholder={e.title}/><Counter value={e.seo_title || e.title} min={30} max={60}/></label>
            <label className="adm-field" style={{ marginTop: 14 }}><span>Meta description</span><textarea rows={3} value={e.seo_description || ''} onChange={ev => set({ seo_description: ev.target.value })} placeholder={e.excerpt}/><Counter value={e.seo_description || e.excerpt} min={110} max={160}/></label>
            <div className="adm-serp"><small>Google preview</small><b>{(e.seo_title || e.title || 'Title') + ' | Modexa'}</b><i>modexa.online{cfg.href({ ...e, slug: e.slug || 'slug' })}</i><p>{(e.seo_description || e.excerpt || 'Your description appears here.').slice(0, 160)}</p></div>
            <div className="adm-grid2" style={{ marginTop: 14 }}><label className="adm-field"><span>Canonical URL (optional)</span><input value={e.canonical_url || ''} onChange={ev => set({ canonical_url: ev.target.value })}/></label><label className="adm-check" style={{ alignSelf: 'end', minHeight: 42 }}><input type="checkbox" checked={!!e.noindex} onChange={ev => set({ noindex: ev.target.checked })}/> Hide from search engines (noindex)</label></div></section>
          <section className="adm-card"><h3>Social sharing (Facebook, WhatsApp, X / Twitter)</h3>
            <p className="adm-sub">What people see when this page is shared. Leave a field empty and it is filled automatically from the SEO title, meta description and cover image (then the site default image).</p>
            <label className="adm-field"><span>Social title (og:title)</span><input value={e.og_title || ''} onChange={ev => set({ og_title: ev.target.value })} maxLength={95} placeholder={e.seo_title || e.title}/><Counter value={e.og_title || e.seo_title || e.title || ''} min={30} max={70}/></label>
            <label className="adm-field" style={{ marginTop: 14 }}><span>Social description (og:description)</span><textarea rows={3} maxLength={200} value={e.og_description || ''} onChange={ev => set({ og_description: ev.target.value })} placeholder={e.seo_description || e.excerpt || 'Short line shown under the title'}/><Counter value={e.og_description || e.seo_description || e.excerpt || ''} min={80} max={160}/></label>
            <div style={{ marginTop: 14 }}><ImageField label="Social image (og:image)" value={e.og_image} onChange={v => set({ og_image: v })} onError={onError} hint="1200×630 works best. Empty = the cover image, then the site default image."/></div>
            <label className="adm-field" style={{ marginTop: 14 }}><span>Twitter / X card</span><select value={e.twitter_card || 'summary_large_image'} onChange={ev => set({ twitter_card: ev.target.value })}><option value="summary_large_image">Large image card (recommended)</option><option value="summary">Small square card</option></select></label>
            <div className="adm-og"><small>Share preview</small>
              <div className="adm-og-card"><div className="adm-og-img" style={(e.og_image || e.cover_image || settings.default_og_image) ? { backgroundImage: `url(${e.og_image || e.cover_image || settings.default_og_image})` } : undefined}/><div className="adm-og-txt"><i>modexa.online</i><b>{e.og_title || e.seo_title || e.title || 'Title'}</b><p>{e.og_description || e.seo_description || e.excerpt || 'Description'}</p></div></div></div>
          </section>
        </div>
        <aside className="adm-sticky">
          <section className="adm-card"><h3>Publish</h3>
            <label className="adm-field"><span>Status</span><select value={e.status} onChange={ev => set({ status: ev.target.value })}><option value="draft">Draft (hidden)</option><option value="published">Published (live)</option></select></label>
            <label className="adm-field" style={{ marginTop: 12 }}><span>Date</span><input type="date" value={(e.published_at || '').slice(0, 10)} onChange={ev => set({ published_at: ev.target.value })}/></label>
            {isPost && <label className="adm-check" style={{ marginTop: 14 }}><input type="checkbox" checked={e.ads_enabled !== false} onChange={ev => set({ ads_enabled: ev.target.checked })}/> Show ads on this post <small style={{ display: 'block', color: '#6b7280', fontWeight: 400 }}>ON = Monetag ads load automatically (popunder, push, banner, direct links in the right places). Nothing else to set up.</small></label>}
            <div className="adm-actions" style={{ marginTop: 16 }}><button className="adm-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>{e.id && <a className="adm-btn" href={cfg.href(e)} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> View</a>}</div></section>
          <section className="adm-card"><h3>Cover image</h3><ImageField label="" value={e.cover_image} onChange={v => set({ cover_image: v })} onError={onError} hint="Landscape, at least 900px wide."/></section>
          {isPost && <section className="adm-card"><h3>Details</h3><label className="adm-field"><span>Category</span><input value={e.category || ''} onChange={ev => set({ category: ev.target.value })} placeholder="Tips, News…"/></label>
            <label className="adm-field" style={{ marginTop: 12 }}><span>Related game (optional)</span><select value={e.game_slug || ''} onChange={ev => set({ game_slug: ev.target.value })}><option value="">None</option>{gameList.map(g => <option key={g.slug} value={g.slug}>{g.title}</option>)}</select></label></section>}
        </aside>
      </div>
    </form>
  }
  return <div className="adm">
    <div className="adm-head"><div><h2>{cfg.title}</h2><p>{kind === 'posts' ? 'Blog posts and guides. Each has Compose and HTML view, ads and buttons.' : `All ${cfg.one}s. Click one to edit, the editor works exactly like Blogger’s Compose / HTML view.`}</p></div><button className="adm-btn primary" onClick={() => setEditing(blank(kind))}><Plus size={16}/> New {cfg.one}</button></div>
    <section className="adm-card" style={{ padding: 0 }}>
      <div className="adm-filters" style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
        <label className="adm-field adm-search" style={{ flex: 1 }}><Search size={15}/><input value={q} onChange={ev => setQ(ev.target.value)} placeholder="Search title or slug…" aria-label="Search"/></label>
        <select className="adm-input" value={fs} onChange={ev => setFs(ev.target.value)} aria-label="Filter status"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select>
      </div>
      {loading ? <p style={{ padding: 24, color: '#6b7280' }}>Loading…</p> : shown.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}><h3 style={{ margin: '0 0 6px' }}>{rows.length ? 'No matches' : `No ${cfg.one}s yet`}</h3><p style={{ margin: 0 }}>{rows.length ? 'Try another search.' : `Create your first ${cfg.one}.`}</p></div> :
        <div className="adm-scroll"><table className="adm-table"><thead><tr><th>Title</th>{kind === 'posts' && <th>Type</th>}<th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>{shown.map(r => <tr key={r.id}>
          <td><div className="adm-name"><b>{r.title}</b>{r.featured && kind !== 'posts' && <span className="adm-pill green" style={{ marginTop: 4, width: 'fit-content' }}>On home</span>}<small>{cfg.href(r)}</small></div></td>
          {kind === 'posts' && <td><span className={`adm-pill ${r.post_type === 'guide' ? 'dark' : ''}`}>{r.post_type === 'guide' ? 'Guide' : 'Blog'}</span></td>}
          <td><span className={`adm-pill ${r.status === 'published' ? 'green' : 'amber'}`}>{r.status === 'published' ? 'Published' : 'Draft'}</span></td>
          <td style={{ color: '#6b7280' }}>{(r.published_at || r.created_at || '').slice(0, 10)}</td>
          <td><div className="adm-actions"><button className="adm-btn sm primary" onClick={() => setEditing({ ...blank(kind), ...r })}><Pencil size={14}/> Edit</button><button className="adm-btn sm" onClick={() => toggle(r)} title={r.status === 'published' ? 'Unpublish' : 'Publish'}>{r.status === 'published' ? <EyeOff size={14}/> : <Eye size={14}/>}</button><button className={`adm-btn sm adm-sitemap-btn ${sm.paths.has(normPath(cfg.href(r))) ? 'on' : ''}`} disabled={smBusy === r.id} onClick={() => toggleSitemap(r)} title={sm.paths.has(normPath(cfg.href(r))) ? 'This URL is in sitemap.xml. Click to remove it.' : r.status === 'published' ? 'Add this URL to sitemap.xml' : 'Publish first, then add to sitemap'}>{sm.paths.has(normPath(cfg.href(r))) ? <><CheckCircle2 size={14}/> In sitemap</> : <><FilePlus2 size={14}/> {smBusy === r.id ? 'Adding…' : 'Add to sitemap'}</>}</button><a className="adm-btn sm" href={cfg.href(r)} target="_blank" rel="noopener noreferrer" title="View"><ExternalLink size={14}/></a><button className="adm-btn sm" onClick={() => duplicate(r)} title="Duplicate"><Copy size={14}/></button><button className="adm-btn sm danger" onClick={() => remove(r)} title="Delete"><Trash2 size={14}/></button></div></td>
        </tr>)}</tbody></table></div>}
    </section>
  </div>
}
