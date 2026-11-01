import { useEffect, useState } from 'react'
// Open any page with ?adsdebug=1 to see why an ad is (not) showing. ?adsdebug=0 turns it off.
const KEY = 'modexa-adsdebug'
function read() {
  try {
    const q = new URLSearchParams(window.location.search).get('adsdebug')
    if (q === '1') sessionStorage.setItem(KEY, '1'); if (q === '0') sessionStorage.removeItem(KEY)
    return sessionStorage.getItem(KEY) === '1'
  } catch { return false }
}
export function useAdsDebug() {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && read())
  useEffect(() => { const f = () => setOn(read()); f(); window.addEventListener('modexa-adsdebug', f); return () => window.removeEventListener('modexa-adsdebug', f) }, [])
  return on
}
export const disableAdsDebug = () => { try { sessionStorage.removeItem(KEY) } catch {} window.dispatchEvent(new Event('modexa-adsdebug')) }
// Typical ad blockers hide elements with these class names.
export function detectAdBlock() {
  return new Promise(resolve => {
    const bait = document.createElement('div'); bait.className = 'adsbox ad-banner ads advert pub_300x250'; bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:10px;height:10px'; bait.innerHTML = '&nbsp;'
    document.body.appendChild(bait)
    setTimeout(() => { const cs = getComputedStyle(bait); const blocked = !bait.offsetHeight || cs.display === 'none' || cs.visibility === 'hidden'; bait.remove(); resolve(blocked) }, 150)
  })
}
