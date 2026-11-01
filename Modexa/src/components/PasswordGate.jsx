import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, ArrowDown } from 'lucide-react'
import ScratchReveal from './ScratchReveal'
import { passwordFor, grantAccess, DEFAULT_HINT } from '../lib/password'

// Replaces the Download button: enter the 4-digit password, then continue to the separate download page.
export default function PasswordGate({ mod, hint, showReveal, scratch, scratchWait, gameSlug }) {
  const [v, setV] = useState(''), [err, setErr] = useState(false), nav = useNavigate()
  function submit(e) {
    e.preventDefault()
    if (v === passwordFor(mod)) { grantAccess(mod.slug); nav(`/download/${mod.slug}`) }
    else { setErr(true); setV('') }
  }
  return <form className="pw-gate" id="pw-gate" onSubmit={submit} noValidate>
    <label htmlFor="pw-input"><KeyRound size={16}/> Enter the 4-digit password to download</label>
    <div className="pw-row">
      <input id="pw-input" className={err ? 'is-bad' : ''} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="off" placeholder="0000" value={v} aria-invalid={err} aria-describedby="pw-help"
        onChange={e => { setV(e.target.value.replace(/\D/g, '').slice(0, 4)); setErr(false) }}/>
      <button type="submit" className="mx-btn mx-btn--green" disabled={v.length !== 4}>Unlock download</button>
    </div>
    {err && <p className="pw-err" role="alert">Wrong password. Check the password box and try again.</p>}
    <p className="pw-help" id="pw-help">{hint || (scratch ? 'Need the password? Scratch the card below to reveal it.' : DEFAULT_HINT)}{showReveal && <> <a href="#password"><ArrowDown size={12}/> Show me where</a></>}</p>
    {scratch && <ScratchReveal mod={mod} wait={scratchWait} gameSlug={gameSlug}/>}
  </form>
}
