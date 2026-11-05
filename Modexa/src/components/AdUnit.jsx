import { useEffect, useRef, useState } from 'react'
import { unitDims } from '../lib/adConfig'
import { useAdsDebug } from '../lib/adsDebug'
import { postscribe } from '../lib/postscribe'

function useInView(ref, margin = '300px') {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (seen || !ref.current) return
    if (!('IntersectionObserver' in window)) { setSeen(true); return }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setSeen(true); io.disconnect() } }, { rootMargin: margin })
    io.observe(ref.current); return () => io.disconnect()
  }, [seen, ref])
  return seen
}

// Kept for compatibility: runs code in a container (supports document.write based ad tags).
export function injectHtml(container, html) { return postscribe(container, html) }

const strictDoc = (code) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}body{display:flex;justify-content:center;align-items:flex-start}</style></head><body>${code}</body></html>`

function DirectLink({ unit }) {
  const rel = 'sponsored nofollow noopener noreferrer'
  if (unit.link_style === 'text') return <p className="ad-direct ad-direct-text">{unit.link_text && <span>{unit.link_text} </span>}<a href={unit.link_url} target="_blank" rel={rel}>{unit.link_label}</a></p>
  if (unit.link_style === 'card') return <a className="ad-direct ad-direct-card" href={unit.link_url} target="_blank" rel={rel}><span><strong>{unit.link_label}</strong>{unit.link_text && <small>{unit.link_text}</small>}</span><span className="ad-direct-go">Open →</span></a>
  return <div className="ad-direct ad-direct-button">{unit.link_text && <p>{unit.link_text}</p>}<a className="button button-primary" href={unit.link_url} target="_blank" rel={rel}>{unit.link_label}</a></div>
}

function Frame({ unit, frameRef }) {
  const { w, h, fluid } = unitDims(unit)
  const common = { title: unit.name || 'Advertisement', className: 'ad-frame', scrolling: 'no', width: fluid ? '100%' : w, height: h, style: { width: fluid ? '100%' : w, maxWidth: '100%', height: h }, referrerPolicy: 'no-referrer-when-downgrade' }
  if (unit.render_mode === 'strict') return <iframe ref={frameRef} {...common} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" srcDoc={strictDoc(unit.code || '')}/>
  return <iframe ref={frameRef} key={unit.id + ':' + (unit.code || '').length} {...common} src="/ad-frame.html" allow="autoplay; fullscreen"
    onLoad={e => { try { e.target.contentWindow.postMessage({ type: 'modexa-ad', code: unit.code || '' }, window.location.origin) } catch {} }}/>
}

function Inline({ unit }) {
  const ref = useRef(null)
  useEffect(() => { const el = ref.current; if (!el) return; el.innerHTML = ''; postscribe(el, unit.code || ''); return () => { el.innerHTML = '' } }, [unit.id, unit.code])
  const { h } = unitDims(unit)
  return <div ref={ref} className="ad-inline" style={{ minHeight: Math.min(h, 120) }}/>
}
const hasContent = root => root && [...root.children].some(e => !/^(SCRIPT|STYLE|BASE|META|NOSCRIPT)$/i.test(e.tagName) && (e.offsetHeight > 1 || (e.textContent || '').trim() || e.querySelector('iframe,img,ins,canvas,video')))

export default function AdUnit({ unit, preview = false }) {
  const holder = useRef(null), frameRef = useRef(null)
  const visible = useInView(holder)
  const debug = useAdsDebug() || preview
  const [status, setStatus] = useState('')
  const { w, h, fluid } = unitDims(unit)
  const isLink = unit.kind === 'direct_link'
  const base = unit.render_mode === 'inline' ? 'inline' : unit.render_mode === 'strict' ? 'strict' : 'frame'
  const [mode, setMode] = useState(base), [fell, setFell] = useState(false)
  useEffect(() => { setMode(base); setFell(false) }, [base, unit.id, unit.code])
  // AUTO: start in a real same-site frame; if the network put nothing in it, run the same code directly on the page.
  useEffect(() => {
    if (isLink || base !== 'frame' || mode !== 'frame' || (!visible && !preview)) return
    const t = setTimeout(() => { try { if (!hasContent(frameRef.current?.contentDocument?.body)) { setMode('inline'); setFell(true) } } catch {} }, 4500)
    return () => clearTimeout(t)
  }, [visible, preview, base, mode, unit.id, unit.code, isLink])
  useEffect(() => {
    if (!debug || isLink || (!visible && !preview)) return
    setStatus('waiting…')
    const t = setTimeout(() => {
      try {
        let root = null
        if (mode === 'inline') root = holder.current?.querySelector('.ad-inline')
        else if (mode === 'frame') root = frameRef.current?.contentDocument?.body
        else { setStatus('strict sandbox, cannot inspect'); return }
        setStatus(hasContent(root) ? '✓ network content loaded' : '⚠ slot is empty, ad blocker, domain not approved by the network, or no ad to serve')
      } catch { setStatus('cannot inspect') }
    }, 7500)
    return () => clearTimeout(t)
  }, [debug, visible, preview, unit.id, unit.code, mode, isLink])
  const body = !visible && !preview ? null : isLink ? <DirectLink unit={unit}/> : mode === 'inline' ? <Inline unit={unit}/> : <Frame unit={{ ...unit, render_mode: mode === 'strict' ? 'strict' : 'isolated' }} frameRef={frameRef}/>
  return <aside ref={holder} className={`ad-unit ad-kind-${unit.kind}`} aria-label={unit.label || 'Advertisement'} data-ad={unit.slot_key}>
    {unit.label && <span className="ad-label">{unit.label}</span>}
    <div className="ad-body" style={!isLink ? { minHeight: mode === 'inline' ? undefined : h, width: fluid ? '100%' : w, maxWidth: '100%' } : undefined}>{body}{debug && !isLink && <span className="ad-debug-chip">{unit.slot_key} · {mode}{fell ? ' (auto-fallback)' : ''}{status ? ' · ' + status : ''}</span>}</div>
  </aside>
}
