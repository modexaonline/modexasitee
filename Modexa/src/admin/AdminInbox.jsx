import { useEffect, useState } from 'react'
import { Mail, Trash2, ExternalLink, Inbox, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CONFIG = {
  submissions: { title: 'Mod submissions', empty: 'No submissions yet. Jab koi public form bharega, yahan nazar aayega.', statuses: ['new', 'reviewing', 'approved', 'rejected'] },
  contact_messages: { title: 'Contact messages', empty: 'No messages yet.', statuses: ['new', 'read', 'archived'] },
}

export default function AdminInbox({ table, onChanged, onNotice, onError }) {
  const cfg = CONFIG[table]
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [filter, setFilter] = useState('all'), [open, setOpen] = useState(null)
  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(300)
    setLoading(false)
    if (error) { onError(error.message); return }
    setRows(data || [])
  }
  useEffect(() => { load(); setOpen(null); setFilter('all') }, [table])
  async function setStatus(row, status) {
    const { error } = await supabase.from(table).update({ status }).eq('id', row.id)
    if (error) { onError(error.message); return }
    setRows(r => r.map(x => x.id === row.id ? { ...x, status } : x)); onChanged?.()
  }
  async function saveNote(row, admin_note) {
    const { error } = await supabase.from(table).update({ admin_note }).eq('id', row.id)
    if (error) onError(error.message); else onNotice('Note saved.')
  }
  async function remove(row) {
    if (!confirm('Delete this item permanently?')) return
    const { error } = await supabase.from(table).delete().eq('id', row.id)
    if (error) { onError(error.message); return }
    setRows(r => r.filter(x => x.id !== row.id)); onNotice('Deleted.'); onChanged?.()
  }
  const shown = rows.filter(r => filter === 'all' || r.status === filter)
  return <section className="admin-table-card">
    <div className="table-head"><div><h2>{cfg.title}</h2><p>{rows.filter(r => r.status === 'new').length} new · {rows.length} total</p></div>
      <select className="admin-filter" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status"><option value="all">All</option>{cfg.statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
    {loading ? <div className="admin-empty"><p>Loading…</p></div> : !shown.length ? <div className="admin-empty"><Inbox size={27}/><h3>Nothing here</h3><p>{cfg.empty}</p></div> :
      <div className="inbox-list">{shown.map(r => {
        const isOpen = open === r.id
        return <article className={`inbox-item ${r.status === 'new' ? 'is-new' : ''}`} key={r.id}>
          <button className="inbox-summary" onClick={() => { setOpen(isOpen ? null : r.id); if (!isOpen && table === 'contact_messages' && r.status === 'new') setStatus(r, 'read') }} aria-expanded={isOpen}>
            <span className="inbox-main"><b>{table === 'submissions' ? r.title : (r.subject || r.name)}</b><small>{table === 'submissions' ? `${r.game} · ${r.category} · by ${r.creator}` : `${r.name} · ${r.email} · ${r.kind}`}</small></span>
            <span className={`status ${r.status === 'new' ? 'draft' : r.status === 'approved' || r.status === 'read' ? 'published' : ''}`}>{r.status}</span>
            <small className="inbox-date">{new Date(r.created_at).toLocaleDateString()}</small>
          </button>
          {isOpen && <div className="inbox-body">
            {table === 'submissions' ? <>
              <p>{r.description}</p>
              <p className="inbox-meta"><b>Platform:</b> {r.platform} · <a href={r.source_url} target="_blank" rel="noopener noreferrer nofollow">{r.source_url} <ExternalLink size={13}/></a></p>
            </> : <>
              <p style={{ whiteSpace: 'pre-wrap' }}>{r.message}</p>
              {r.listing_url && <p className="inbox-meta"><b>Listing:</b> <a href={r.listing_url} target="_blank" rel="noopener noreferrer nofollow">{r.listing_url}</a></p>}
              <p className="inbox-meta"><a href={`mailto:${r.email}?subject=${encodeURIComponent('Re: ' + (r.subject || 'Your message to Modexa'))}`}><Mail size={14}/> Reply to {r.email}</a></p>
            </>}
            {table === 'submissions' && <label className="inbox-note">Internal note<textarea rows="2" defaultValue={r.admin_note || ''} onBlur={e => e.target.value !== (r.admin_note || '') && saveNote(r, e.target.value)} placeholder="Private note (not public)"/></label>}
            <div className="inbox-actions">
              {cfg.statuses.map(s => <button key={s} className={`admin-secondary ${r.status === s ? 'is-active' : ''}`} onClick={() => setStatus(r, s)}>{r.status === s && <Check size={14}/>} {s}</button>)}
              <button className="admin-secondary danger" onClick={() => remove(r)}><Trash2 size={14}/> Delete</button>
            </div>
          </div>}
        </article>
      })}</div>}
  </section>
}
