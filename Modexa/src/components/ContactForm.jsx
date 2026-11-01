import { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const blank = { kind: 'general', name: '', email: '', subject: '', message: '', listing_url: '', website: '' }

export default function ContactForm({ defaultKind = 'general' }) {
  const [f, setF] = useState({ ...blank, kind: defaultKind })
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false)
  const set = e => setF({ ...f, [e.target.name]: e.target.value })
  async function submit(e) {
    e.preventDefault(); setError('')
    if (f.website) { setSent(true); return } // honeypot: bots fill this hidden field
    if (!f.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) || f.message.trim().length < 10) { setError('Naam, valid email aur kam az kam 10 characters ka message likhein.'); return }
    if (f.listing_url && !/^https?:\/\//i.test(f.listing_url)) { setError('Listing URL https:// se shuru hona chahiye.'); return }
    try { const last = Number(sessionStorage.getItem('modexa-contact-ts') || 0); if (Date.now() - last < 30000) { setError('Thora wait karke dobara bhejein.'); return } } catch {}
    setBusy(true)
    if (supabaseConfigured) {
      const { error: err } = await supabase.from('contact_messages').insert({ kind: f.kind, name: f.name.trim(), email: f.email.trim(), subject: f.subject.trim(), message: f.message.trim(), listing_url: f.listing_url.trim() })
      if (err) { setBusy(false); setError('Message send nahi ho saka. Dobara try karein.'); return }
    }
    try { sessionStorage.setItem('modexa-contact-ts', String(Date.now())) } catch {}
    setBusy(false); setSent(true)
  }
  if (sent) return <div className="submission-success"><CheckCircle2 size={42}/><h2>Message sent</h2><p>{supabaseConfigured ? 'Shukriya! Hum jald aap se rabta karenge.' : 'Demo mode: Supabase connect hone ke baad messages admin inbox mein aayenge.'}</p><button className="button button-outline" onClick={() => { setSent(false); setF({ ...blank, kind: defaultKind }) }}>Send another</button></div>
  return <form className="submit-form contact-form" onSubmit={submit} noValidate>
    <div className="form-row"><label>Topic<select name="kind" value={f.kind} onChange={set}><option value="general">General question</option><option value="listing">Problem with a listing</option><option value="copyright">Copyright / takedown</option><option value="business">Business / partnership</option></select></label><label>Your name <span>*</span><input name="name" value={f.name} onChange={set} maxLength={80} autoComplete="name"/></label></div>
    <div className="form-row"><label>Email <span>*</span><input name="email" type="email" value={f.email} onChange={set} maxLength={160} autoComplete="email" inputMode="email"/></label><label>Subject<input name="subject" value={f.subject} onChange={set} maxLength={140}/></label></div>
    {(f.kind === 'listing' || f.kind === 'copyright') && <label>Listing URL<input name="listing_url" type="url" value={f.listing_url} onChange={set} placeholder="https://" maxLength={500}/></label>}
    <label>Message <span>*</span><textarea name="message" rows={5} value={f.message} onChange={set} maxLength={3000}/><small>{f.message.length}/3000</small></label>
    <input name="website" value={f.website} onChange={set} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field"/>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary submit-form-button" disabled={busy}><Send size={16}/> {busy ? 'Sending…' : 'Send message'}</button>
  </form>
}
