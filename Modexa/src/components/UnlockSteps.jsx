import { useEffect, useRef, useState } from 'react'
import { Link } from '../lib/i18nRouter'
import { Check, Lock, Download, ExternalLink, RotateCcw } from 'lucide-react'
import AdSlot from './AdSlot'
import SocialIcon from './SocialIcon'
import { stepType, readProgress, writeProgress } from '../lib/unlock'

// Sequential checklist. Each step opens a link in a new tab, counts down, then the visitor taps "Done, continue".
// Social actions are NOT verified (and the page says so). The last step leads to the download page or the file.
export default function UnlockSteps({ mod, steps, finalPage, wait, gameSlug, onDownload }) {
  const [done, setDone] = useState(() => Math.min(readProgress(mod.slug), steps.length))
  const [phase, setPhase] = useState('idle'), [left, setLeft] = useState(0)
  const timer = useRef(null)
  useEffect(() => () => clearInterval(timer.current), [])
  useEffect(() => { setDone(Math.min(readProgress(mod.slug), steps.length)); setPhase('idle') }, [mod.slug, steps.length])
  const finish = n => { setDone(n); setPhase('idle'); writeProgress(mod.slug, n) }
  function start(s) {
    clearInterval(timer.current)
    if (!(s.wait > 0)) return setPhase('ready')
    setPhase('wait'); setLeft(s.wait); let l = s.wait
    timer.current = setInterval(() => { l -= 1; setLeft(l); if (l <= 0) { clearInterval(timer.current); setPhase('ready') } }, 1000)
  }
  const reset = () => { clearInterval(timer.current); finish(0) }
  const all = done >= steps.length, pct = Math.round((done / steps.length) * 100)
  return <section className="unlock" id="unlock" aria-labelledby="unlock-h">
    <div className="unlock-head"><div><h2 id="unlock-h">{all ? 'Your download is unlocked' : 'Complete these steps to unlock your download'}</h2>
      <p>{all ? 'All steps are done. Your download is ready below.' : 'Follow the steps in order and keep this page open. Each link opens in a new tab.'}</p></div>
      <b className="unlock-count">{done} / {steps.length}</b></div>
    <div className="unlock-bar" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done}><i style={{ width: pct + '%' }}/></div>
    <AdSlot placement="download_gate" gameSlug={gameSlug}/>
    <ol className="unlock-list">{steps.map((s, i) => {
      const t = stepType(s.type), complete = i < done, active = i === done && !all, locked = i > done
      return <li key={i} className={`unlock-step${complete ? ' is-done' : ''}${active ? ' is-active' : ''}${locked ? ' is-locked' : ''}`}>
        <span className="unlock-ico">{complete ? <Check size={17}/> : locked ? <Lock size={15}/> : <SocialIcon item={{ platform: t.platform }} size={17}/>}</span>
        <div className="unlock-body"><small>STEP {String(i + 1).padStart(2, '0')}{t.sponsored && <em className="unlock-tag">Sponsored</em>}</small><h3>{s.label}</h3>
          <p>{complete ? 'Completed' : locked ? 'Unlocks after the previous step.' : phase === 'idle' ? 'Opens in a new tab. Come back here when you are done.' : phase === 'wait' ? `Please wait ${left}s…` : 'All set. Tap continue.'}</p></div>
        <div className="unlock-act">{complete ? <span className="unlock-ok"><Check size={14}/> Done</span> : active ? (
          phase === 'ready' ? <button type="button" className="mx-btn mx-btn--green" onClick={() => finish(i + 1)}>Done, continue</button>
            : <a className={`mx-btn mx-btn--black${phase === 'wait' ? ' is-waiting' : ''}`} href={s.url} target="_blank" rel="sponsored nofollow noopener noreferrer" aria-disabled={phase === 'wait'} onClick={e => { if (phase === 'wait') { e.preventDefault(); return } start(s) }}>
              {phase === 'wait' ? <span>{left}s</span> : <><span>{s.btn}</span><ExternalLink size={14}/></>}</a>
        ) : null}</div>
      </li>
    })}</ol>
    {all && <div className="unlock-final">
      {finalPage ? <Link className="mx-btn mx-btn--green mx-btn--lg" to={`/download/${mod.slug}`}><Download size={18}/><span>Go to download page</span></Link>
        : <a className="mx-btn mx-btn--green mx-btn--lg" href={mod.downloadUrl} data-wait={wait} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={onDownload}><Download size={18}/><span>Download</span></a>}
    </div>}
    <p className="unlock-note">Links open in a new tab. We cannot verify actions on other sites, so these steps support the creators and sponsors listed. <button type="button" className="unlock-reset" onClick={reset}><RotateCcw size={12}/> Reset progress</button></p>
  </section>
}
