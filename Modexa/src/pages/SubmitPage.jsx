import { Link } from 'react-router-dom'
import { useState } from 'react'
import { CheckCircle2, UploadCloud, Send, ShieldCheck } from 'lucide-react'
import SEO from '../components/SEO'
import SeoContent from '../components/SeoContent'
import { usePageContent } from '../lib/siteContent'
import { LISTING } from '../content/seo'

import PageHero from '../components/PageHero'
import { categories, games } from '../data/mods'
import { supabase, supabaseConfigured } from '../lib/supabase'
import useModsData from '../lib/useMods'

export default function SubmitPage() {
  const L = usePageContent('listing:submit', LISTING.submit)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ title:'', game:'', category:'', platform:'PC', creator:'', source:'', description:'', license:false, website:'' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const mods = useModsData()
  const gameOptions = supabaseConfigured ? [...new Set([...mods.map(m => m.game), ...games.map(g => g.name)].filter(Boolean))] : games.map(g => g.name)
  const categoryOptions = supabaseConfigured ? [...new Set([...mods.map(m => m.category), ...categories].filter(Boolean))] : categories
  const update = e => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async e => {
    e.preventDefault()
    if (form.website) { setSubmitted(true); return } // honeypot
    if (!form.title.trim() || !form.game || !form.category || !form.creator.trim() || !form.source.trim() || !form.description.trim()) {
      setError('Please complete all required fields.')
      return
    }
    try { new URL(form.source) } catch { setError('Enter a valid source URL beginning with https://.'); return }
    if (!form.license) { setError('Please confirm that you have the rights to submit this content.'); return }
    setError('')
    if (supabaseConfigured) {
      try { if (Date.now() - Number(sessionStorage.getItem('modexa-submit-ts') || 0) < 30000) { setError('Thora wait karke dobara submit karein.'); return } } catch {}
      setBusy(true)
      const { error: err } = await supabase.from('submissions').insert({ title: form.title.trim(), game: form.game, category: form.category, platform: form.platform, creator: form.creator.trim(), source_url: form.source.trim(), description: form.description.trim() })
      setBusy(false)
      if (err) { setError(err.message.includes('check') ? 'Kuch fields ki length ya format theek nahi (description kam az kam 10 characters).' : 'Submit nahi ho saka. Dobara try karein.'); return }
      try { sessionStorage.setItem('modexa-submit-ts', String(Date.now())) } catch {}
    }
    setSubmitted(true)
  }
  return <>
    <SEO fullTitle={L.seoTitle} description={L.description} breadcrumbs={[{label:'Home',to:'/'},{label:'Submit a Game',to:'/submit-mod'}]} faqs={L.faqs}/>
    <PageHero eyebrow="SHARE YOUR GAME" title={<>Give your game a <span className="text-gradient">spotlight.</span></>} description={L.description}/>
    <section className="directory-section submit-section"><div className="container submit-layout">
      <div className="submit-main">
        {submitted ? <div className="submission-success"><CheckCircle2 size={42}/><h2>{supabaseConfigured ? 'Submission received' : 'Demo submission complete'}</h2><p>{supabaseConfigured ? 'Shukriya! Hamari team aapki listing review karegi. Approve hone par woh site par publish hogi.' : 'Demo mode: no data was sent. Connect Supabase to receive real submissions in the admin inbox.'}</p><button className="button button-primary" onClick={() => {setSubmitted(false); setForm({title:'',game:'',category:'',platform:'PC',creator:'',source:'',description:'',license:false,website:''})}}>Submit another</button></div> :
        <form className="submit-form" onSubmit={submit} noValidate>
          <div className="form-section-title"><span>01</span><div><h2>Game information</h2><p>Tell us what players should know.</p></div></div>
          <label><b className="req-label">Game title <span>*</span></b><input name="title" value={form.title} onChange={update} placeholder="e.g. Car Parking Multiplayer" required maxLength={100}/></label>
          <div className="form-row"><label><b className="req-label">Game <span>*</span></b><select name="game" value={form.game} onChange={update} required><option value="">Select a game</option>{gameOptions.map(g => <option key={g}>{g}</option>)}</select></label><label><b className="req-label">Category <span>*</span></b><select name="category" value={form.category} onChange={update} required><option value="">Select category</option>{categoryOptions.map(c => <option key={c}>{c}</option>)}</select></label></div>
          <div className="form-row"><label><b className="req-label">Platform <span>*</span></b><select name="platform" value={form.platform} onChange={update}><option>PC</option><option>Android</option><option>Console</option><option>Multiple platforms</option></select></label><label><b className="req-label">Creator name <span>*</span></b><input name="creator" value={form.creator} onChange={update} placeholder="Your creator name" required maxLength={80}/></label></div>
          <label><b className="req-label">Short description <span>*</span></b><textarea name="description" value={form.description} onChange={update} placeholder="What is the game about? What makes it fun?" required rows={4} maxLength={1200}/><small>{form.description.length}/1200 characters</small></label>
          <div className="form-section-title form-section-spaced"><span>02</span><div><h2>Source & permissions</h2><p>Link to the original authorized listing.</p></div></div>
          <label><b className="req-label">Original source URL <span>*</span></b><input name="source" type="url" value={form.source} onChange={update} placeholder="https://..." required/><small>Only submit content you own or are permitted to share.</small></label>
          <label className="checkbox-label"><input type="checkbox" name="license" checked={form.license} onChange={update}/><span>I confirm I have the right to submit this content and will respect the creator's license. <b>*</b></span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <input name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field"/>
          <button className="button button-primary submit-form-button" type="submit" disabled={busy}><Send size={16}/> {busy ? 'Sending…' : 'Submit for review'}</button>
          <p className="form-privacy"><ShieldCheck size={14}/> {supabaseConfigured ? 'Your submission goes to our moderation queue. Nothing is published without review.' : 'Demo only: connect Supabase to send submissions to the admin inbox.'}</p>
        </form>}
      </div>
      <aside className="submit-sidebar"><div className="submit-aside-card"><span className="aside-icon"><UploadCloud size={22}/></span><h3>Before you submit</h3><ul><li>Provide accurate compatibility details.</li><li>Link to an authorized source.</li><li>Credit all original creators.</li><li>Respect licenses and game publisher rules.</li><li>Do not submit malware or misleading files.</li></ul></div><div className="submit-aside-card aside-muted"><h3>What happens next?</h3><p>Our team checks the source link, description and rights. Approved mods are published with your name and a link to your page. See our <Link to="/guidelines">Community Guidelines</Link>.</p></div></aside>
    </div></section>
    <SeoContent data={L}/>
  </>
}