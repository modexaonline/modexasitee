import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAdUnits } from '../lib/useAds'
import { postscribe } from '../lib/postscribe'
import AdUnit from './AdUnit'
import { useSettings } from '../lib/useSettings'
import { useConsent } from '../lib/consent'

// Site-wide scripts (pop-under, social bar, ad-network loaders) + the sticky footer bar.
export default function GlobalAds() {
  const head = useAdUnits('global_head'), body = useAdUnits('global_body'), sticky = useAdUnits('sticky_bottom')
  const [hideSticky, setHideSticky] = useState(() => { try { return sessionStorage.getItem('modexa-sticky-closed') === '1' } catch { return false } })
  const settings = useSettings(), consent = useConsent()
  const allowed = settings.monetag_enabled !== false && (!settings.ads_require_consent || consent === 'all')
  const monetag = allowed ? [(settings.monetag_code || '').trim(), ...(Array.isArray(settings.monetag_formats) ? settings.monetag_formats : []).filter(f => f && f.on !== false && f.format !== 'smartlink').map(f => String(f.code || '').trim())].filter(Boolean) : []
  const monetagSig = monetag.join('\u0000')
  useEffect(() => {
    if (!monetag.length) return
    const holders = []
    const go = () => monetag.forEach(code => {   // one holder per pasted code, so a broken one cannot stop the others
      const holder = document.createElement('div'); holder.setAttribute('data-modexa-monetag', '1'); holder.style.display = 'contents'
      document.head.appendChild(holder); postscribe(holder, code); holders.push(holder)
    })
    // load ad scripts once the page is idle (max ~2.5s) so they never delay the first screen
    const id = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1200)
    return () => { window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id); holders.forEach(h => h.remove()) }
  }, [monetagSig])
  const sig = [...head, ...body].map(u => u.id + ':' + (u.code || '').length).join('|')
  useEffect(() => {
    const added = []
    const put = (units, parent) => units.forEach(u => {
      if (!u.code || document.querySelector(`[data-modexa-global="${u.id}"]`)) return
      const holder = document.createElement('div'); holder.setAttribute('data-modexa-global', u.id); holder.style.display = 'contents'
      parent.appendChild(holder); postscribe(holder, u.code); added.push(holder)
    })
    put(head, document.head); put(body, document.body)
    return () => { added.forEach(n => n.remove()) }
  }, [sig])
  const unit = sticky[0]
  useEffect(() => { document.body.classList.toggle('has-sticky-ad', Boolean(unit) && !hideSticky); return () => document.body.classList.remove('has-sticky-ad') }, [unit, hideSticky])
  if (!unit || hideSticky) return null
  return <div className="sticky-ad" role="complementary" aria-label="Advertisement">
    <button className="sticky-ad-close" aria-label="Close advertisement" onClick={() => { try { sessionStorage.setItem('modexa-sticky-closed', '1') } catch {} setHideSticky(true) }}><X size={16}/></button>
    <AdUnit unit={{ ...unit, label: '' }}/>
  </div>
}
