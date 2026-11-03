import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useAdUnits, useMonetag, usePageAdsOff } from '../lib/useAds'
import { useAdsterra } from '../lib/adsterra'
import { postscribe } from '../lib/postscribe'
import AdUnit from './AdUnit'

// Starts a network's scripts once the page is idle; one holder per pasted code so a broken one cannot stop the others.
function useScriptLoader(scripts, pageOff, name) {
  const sig = scripts.join('\u0000'), loadedSig = useRef(''), holders = useRef([])
  useEffect(() => {
    if (!scripts.length || pageOff || loadedSig.current === sig) return
    const go = () => {
      loadedSig.current = sig
      scripts.forEach(code => {
        const holder = document.createElement('div'); holder.setAttribute('data-modexa-' + name, '1'); holder.style.display = 'contents'
        document.head.appendChild(holder); postscribe(holder, code); holders.current.push(holder)
      })
    }
    const id = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1200)
    return () => { window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id) }
  }, [sig, pageOff])
  useEffect(() => () => { holders.current.forEach(h => h.remove()); holders.current = []; loadedSig.current = '' }, [sig])
}

// Site-wide scripts (pop-under, social bar, ad-network loaders) + the sticky footer bar.
// A page switched OFF (Admin → Page manager) only stops scripts from starting; scripts that already started cannot be unloaded safely.
export default function GlobalAds() {
  const head = useAdUnits('global_head', {}, { ignorePageOff: true }), body = useAdUnits('global_body', {}, { ignorePageOff: true }), sticky = useAdUnits('sticky_bottom')
  const [hideSticky, setHideSticky] = useState(() => { try { return sessionStorage.getItem('modexa-sticky-closed') === '1' } catch { return false } })
  const mt = useMonetag(), at = useAdsterra(), pageOff = usePageAdsOff()
  useScriptLoader(mt.scripts, pageOff, 'monetag'); useScriptLoader(at.scripts, pageOff, 'adsterra')
  const sig = [...head, ...body].map(u => u.id + ':' + (u.code || '').length).join('|')
  const added = useRef([])
  useEffect(() => {
    if (pageOff) return
    const put = (units, parent) => units.forEach(u => {
      if (!u.code || document.querySelector(`[data-modexa-global="${u.id}"]`)) return
      const holder = document.createElement('div'); holder.setAttribute('data-modexa-global', u.id); holder.style.display = 'contents'
      parent.appendChild(holder); postscribe(holder, u.code); added.current.push(holder)
    })
    put(head, document.head); put(body, document.body)
  }, [sig, pageOff])
  useEffect(() => () => { added.current.forEach(n => n.remove()); added.current = [] }, [sig])
  const unit = sticky[0]
  useEffect(() => { document.body.classList.toggle('has-sticky-ad', Boolean(unit) && !hideSticky); return () => document.body.classList.remove('has-sticky-ad') }, [unit, hideSticky])
  if (!unit || hideSticky) return null
  return <div className="sticky-ad" role="complementary" aria-label="Advertisement">
    <button className="sticky-ad-close" aria-label="Close advertisement" onClick={() => { try { sessionStorage.setItem('modexa-sticky-closed', '1') } catch {} setHideSticky(true) }}><X size={16}/></button>
    <AdUnit unit={{ ...unit, label: '' }}/>
  </div>
}
