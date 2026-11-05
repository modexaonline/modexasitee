import { useEffect, useRef, useState } from 'react'
import { Sparkles, Volume2, VolumeX, Copy, Check } from 'lucide-react'
import AdSlot from './AdSlot'
import { passwordFor } from '../lib/password'
import { sfxInit, sfxOn, setSfx, tick, ready, chime, createScratch, speak, stopSpeak } from '../lib/sfx'

const seenKey = slug => `modexa-scr-${slug}`
const wasSeen = slug => { try { return sessionStorage.getItem(seenKey(slug)) === '1' } catch { return false } }

// "Scratch to reveal the password": tap, wait a few seconds, then scratch the silver card (with sound) to see the code.
export default function ScratchReveal({ mod, wait = 10, gameSlug }) {
  const code = passwordFor(mod)
  const [phase, setPhase] = useState(() => wasSeen(mod.slug) ? 'done' : 'idle'), [left, setLeft] = useState(wait)
  const [sound, setSound] = useState(sfxOn), [copied, setCopied] = useState(false)
  const timer = useRef(null), cv = useRef(null), wrap = useRef(null), soundRef = useRef(sound)
  soundRef.current = sound
  useEffect(() => () => { clearInterval(timer.current); stopSpeak() }, [])
  useEffect(() => { setPhase(wasSeen(mod.slug) ? 'done' : 'idle'); clearInterval(timer.current) }, [mod.slug])

  const done = () => { setPhase('done'); try { sessionStorage.setItem(seenKey(mod.slug), '1') } catch {} chime() }
  function start() {
    sfxInit()                                                 // inside the tap, so the browser allows sound
    if (!(wait > 0)) { setPhase('ready'); ready(); return }
    setPhase('wait'); setLeft(wait); let l = wait
    speak(`Please wait ${wait} seconds. Your scratch card is getting ready.`)
    timer.current = setInterval(() => {
      l -= 1; setLeft(l)
      if (l > 0 && l <= 3) tick()
      if (l <= 0) { clearInterval(timer.current); setPhase('ready'); ready(); speak('Your card is ready. Scratch the silver area to reveal the password.') }
    }, 1000)
  }

  useEffect(() => {
    if (phase !== 'ready') return
    const c = cv.current, box = wrap.current; if (!c || !box) return
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = box.clientWidth, h = box.clientHeight
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
    const g = c.getContext('2d', { willReadFrequently: true }); g.scale(dpr, dpr)
    const grad = g.createLinearGradient(0, 0, w, h); grad.addColorStop(0, '#c4cad3'); grad.addColorStop(.5, '#eef0f3'); grad.addColorStop(1, '#a9b0bb')
    g.fillStyle = grad; g.fillRect(0, 0, w, h)
    for (let i = 0; i < (w * h) / 35; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.4)' : 'rgba(110,118,130,.25)'; g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6) }
    g.fillStyle = '#5b6472'; g.font = '700 15px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SCRATCH HERE', w / 2, h / 2)
    g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 34
    const fx = createScratch()
    let drawing = false, lx = 0, ly = 0, lt = 0, lastCheck = 0, finished = false
    const pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    const check = () => {
      lastCheck = performance.now()
      const d = g.getImageData(0, 0, c.width, c.height).data; let clear = 0, tot = 0
      for (let i = 3; i < d.length; i += 80) { tot++; if (d[i] < 128) clear++ }
      if (!finished && clear / tot > 0.5) { finished = true; fx.stop(); done() }
    }
    const down = e => { drawing = true; try { c.setPointerCapture(e.pointerId) } catch {} ;[lx, ly] = pos(e); lt = performance.now(); g.beginPath(); g.arc(lx, ly, 17, 0, 7); g.fill(); fx.move(0.6) }
    const move = e => {
      if (!drawing) return
      const [x, y] = pos(e), now = performance.now()
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke()
      const speed = Math.hypot(x - lx, y - ly) / Math.max(1, now - lt)
      if (soundRef.current) fx.move(speed); else fx.stop()
      lx = x; ly = y; lt = now
      if (now - lastCheck > 140) check()
    }
    const up = () => { if (!drawing) return; drawing = false; fx.stop(); check() }
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up); c.addEventListener('pointerleave', up)
    return () => { c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up); c.removeEventListener('pointerleave', up); fx.dispose() }
  }, [phase])

  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {} }
  const toggleSound = () => { const n = !sound; setSound(n); setSfx(n); if (n) { sfxInit(); tick() } }
  const pct = wait > 0 ? Math.round(((wait - left) / wait) * 100) : 100

  return <div className="scr">
    {phase === 'idle' && <button type="button" className="scr-start" onClick={start}><Sparkles size={17}/> Don’t have it? <b>Scratch to reveal the password</b></button>}
    {phase === 'wait' && <div className="scr-wait" role="status" aria-live="polite"><p>Preparing your scratch card… <b>{left}s</b></p><div className="scr-bar"><i style={{ width: pct + '%' }}/></div><AdSlot placement="download_gate" gameSlug={gameSlug}/></div>}
    {(phase === 'ready' || phase === 'done') && <div className="scr-card">
      <div className="scr-top"><span>{phase === 'done' ? 'Your password' : 'Scratch the silver area'}</span><button type="button" className="scr-snd" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>{sound ? <Volume2 size={15}/> : <VolumeX size={15}/>}</button></div>
      <div className="scr-wrap" ref={wrap}>
        <div className="scr-code" aria-hidden={phase !== 'done'}>{code.split('').map((d, i) => <b key={i}>{d}</b>)}</div>
        {phase === 'ready' && <canvas ref={cv} className="scr-canvas" aria-label="Scratch card. Drag over it to reveal the password."/>}
      </div>
      {phase === 'ready' && <><AdSlot placement="download_gate" gameSlug={gameSlug}/><button type="button" className="scr-skip" onClick={done}>Can’t scratch? Reveal it</button></>}
      {phase === 'done' && <div className="scr-after"><p role="status">Password: <b>{code.split('').join(' ')}</b>. Type it in the box above.</p><button type="button" className="button button-outline" onClick={copy}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? 'Copied' : 'Copy'}</button></div>}
    </div>}
  </div>
}
