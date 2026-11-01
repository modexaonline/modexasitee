import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Download, ArrowLeft, ShieldAlert, Volume2, VolumeX } from 'lucide-react'
import SEO from '../components/SEO'
import AdSlot from '../components/AdSlot'
import SafeImg from '../components/SafeImg'
import { PageSkeleton } from '../components/Skeleton'
import { useModsState } from '../lib/useMods'
import { useSettings } from '../lib/useSettings'
import { slugify } from '../lib/format'
import { resolveUnlock, readProgress } from '../lib/unlock'
import { passwordActive, hasAccess } from '../lib/password'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { sfxInit, sfxOn, setSfx, tick, ready, speak, stopSpeak } from '../lib/sfx'

// /download/<slug>: second page view with its own countdown and ad slots. Not indexed by search engines.
export default function DownloadPage() {
  const { slug } = useParams()
  const { items: mods, loading } = useModsState(), settings = useSettings()
  const mod = mods.find(m => m.slug === slug)
  const wait = Number.isFinite(+settings.download_wait_seconds) ? +settings.download_wait_seconds : 30
  const [left, setLeft] = useState(wait), [sound, setSound] = useState(sfxOn)
  // Countdown with a spoken cue at the start, soft ticks for the last 3 seconds and a chime when the link is ready.
  useEffect(() => {
    setLeft(wait); if (!(wait > 0)) return
    speak(`Please wait ${wait} seconds. Your download link is getting ready.`)
    let l = wait
    const id = setInterval(() => {
      l -= 1; setLeft(Math.max(0, l))
      if (l > 0 && l <= 3) tick()
      if (l <= 0) { clearInterval(id); ready(); speak('Your download link is ready. Tap download now.') }
    }, 1000)
    return () => { clearInterval(id); stopSpeak() }
  }, [wait, slug])
  const toggleSound = () => { const n = !sound; setSound(n); setSfx(n); if (n) { sfxInit(); tick() } else stopSpeak() }
  if (loading && !mod) return <PageSkeleton/>
  if (!mod || !mod.downloadUrl) return <div className="container not-found-inline"><h1>Not found</h1><p>This download page may have moved.</p><Link className="button button-primary" to="/apps">Browse apps</Link></div>
  const pwOn = passwordActive(mod, settings)
  if (pwOn && !hasAccess(mod.slug)) return <Navigate to={mod.href} replace/>
  const steps = pwOn ? [] : resolveUnlock(mod, settings)
  if (steps.length && readProgress(mod.slug) < steps.length) return <Navigate to={`${mod.href}#unlock`} replace/>
  const track = () => { if (!supabaseConfigured) return; try { const k = `modexa-dl-${mod.slug}`; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1') } catch {} supabase.rpc('increment_mod_downloads', { p_slug: mod.slug }).then(() => {}) }
  const g = slugify(mod.game)
  return <>
    <SEO fullTitle={`Download ${mod.title} | Modexa`} description={`Download page for ${mod.title}.`} noindex/>
    <div className="container dlpage">
      <Link className="back-link" to={mod.href}><ArrowLeft size={15}/> Back to {mod.title}</Link>
      <div className="dlpage-card">
        <div className="dlpage-art"><SafeImg src={mod.image} alt={mod.title}/></div>
        <h1>{mod.title}</h1>
        <p className="dlpage-meta">{[mod.version && `Version ${mod.version}`, mod.platform].filter(Boolean).join(' · ')}</p>
        <AdSlot placement="download_gate" gameSlug={g}/>
        <button type="button" className="dl-snd" onClick={toggleSound} aria-pressed={sound}>{sound ? <Volume2 size={14}/> : <VolumeX size={14}/>} Voice &amp; sound {sound ? 'on' : 'off'}</button>
        {left > 0 ? <p className="dlpage-wait" role="status" aria-live="polite">Your download link will be ready in <b>{left}s</b>…</p>
          : <a className="mx-btn mx-btn--green mx-btn--lg" href={mod.downloadUrl} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={track}><Download size={18}/><span>Download now</span></a>}
        <AdSlot placement="download_gate" gameSlug={g}/>
        <p className="dlpage-note"><ShieldAlert size={14}/> The link opens in a new tab and may lead to an external site. Only install files from sources you trust.</p>
      </div>
      <DownloadContent mod={mod} gameSlug={g}/>
    </div>
  </>
}

// Readable content under the download card, with ad slots between the sections.
function DownloadContent({ mod, gameSlug }) {
  const list = a => Array.isArray(a) && a.length > 0 ? a : null
  const name = mod.title, meta = [mod.version && `version ${mod.version}`, mod.platform].filter(Boolean).join(' for ')
  const faqs = [
    [`Is ${name} free to download?`, `Yes. The download link on this page is free. You only need to wait for the short countdown to finish and then tap “Download now”.`],
    [`Why do I have to wait before downloading?`, `The countdown keeps the site free and helps pay for hosting. When it reaches zero the “Download now” button appears and the file link opens in a new tab.`],
    [`The download did not start. What should I do?`, `Turn off any pop-up blocker for this site, tap “Download now” again, or try another browser. If the link still fails, reload this page and wait for the timer once more.`],
    [`Is it safe to install?`, `Always scan files with an up-to-date antivirus before opening them, only install from sources you trust and keep a backup of your game or app data first.`],
  ]
  return <div className="dlpage-more">
    <AdSlot placement="download_gate" gameSlug={gameSlug}/>
    <section className="dl-sec"><h2>About {name}</h2>
      <p>{mod.short || `${name} is available to download on Modexa${meta ? ` (${meta})` : ''}.`}</p>
      {meta && <p>This download is {meta}{mod.updated ? `, last updated ${mod.updated}` : ''}{mod.creator ? `, shared by ${mod.creator}` : ''}.</p>}
      {list(mod.features) && <><h3>Main features</h3><ul>{mod.features.map(f => <li key={f}>{f}</li>)}</ul></>}
    </section>
    <section className="dl-sec"><h2>How to download {name}</h2>
      <ol><li>Wait for the countdown above to reach zero.</li><li>Tap the green <b>Download now</b> button. The link opens in a new tab.</li><li>Follow the page that opens and save the file to your device.</li><li>Open the file and follow the install steps below.</li></ol>
    </section>
    <AdSlot placement="download_gate" gameSlug={gameSlug}/>
    {(list(mod.install) || list(mod.requirements)) && <section className="dl-sec">
      {list(mod.install) && <><h2>How to install</h2><ol>{mod.install.map(t => <li key={t}>{t}</li>)}</ol></>}
      {list(mod.requirements) && <><h2>Requirements</h2><ul>{mod.requirements.map(t => <li key={t}>{t}</li>)}</ul></>}
    </section>}
    <section className="dl-sec"><h2>Safety tips</h2>
      <ul><li>Scan every downloaded file with an antivirus before opening it.</li><li>Back up your game progress or app data before installing anything new.</li><li>Do not enter personal or payment details on any page that asks for them after a download.</li><li>If something looks wrong, close the tab and go back to the {name} page.</li></ul>
    </section>
    <section className="dl-sec"><h2>Frequently asked questions</h2>
      {faqs.map(([q, a]) => <details key={q} className="dl-faq"><summary>{q}</summary><p>{a}</p></details>)}
    </section>
    <AdSlot placement="download_gate" gameSlug={gameSlug}/>
    <p className="dl-back"><Link className="button button-outline" to={mod.href}><ArrowLeft size={15}/> Back to {name}</Link></p>
  </div>
}
