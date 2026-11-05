import { ArrowUp } from 'lucide-react'
import AdSlot from './AdSlot'
import ScratchReveal from './ScratchReveal'

// The box lower down the page (between ad slots). The password sits behind the same scratch card
// (tap, short wait with a voice cue, then scratch) instead of being shown straight away.
export default function PasswordReveal({ mod, gameSlug, scratchWait = 10 }) {
  return <section className="pw-reveal" id="password" aria-labelledby="pw-h">
    <AdSlot placement="download_gate" gameSlug={gameSlug}/>
    <div className="pw-box"><h2 id="pw-h">Download password</h2>
      <ScratchReveal mod={mod} wait={scratchWait} gameSlug={gameSlug}/>
      <div className="pw-actions"><a className="button button-primary" href="#pw-gate"><ArrowUp size={15}/> Enter it at the top</a></div></div>
    <AdSlot placement="download_gate" gameSlug={gameSlug}/>
  </section>
}
