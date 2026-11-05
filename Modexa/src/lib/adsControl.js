import { useMemo } from 'react'
import { useSiteContent, useContentReady } from './siteContent'
import { useSettings } from './useSettings'
import { norm } from './hidden.js'

// Ads control, saved by Admin → Page manager in the existing `site_content` table under key `ads_control`:
//   { cards: 'always' | 'accept', scripts: 'always' | 'accept', banner: true | false, banner_text: '', pages_off: ['/about', '/games/*', …] }
// cards   = the “Advertisement” direct-link cards (no cookies set by us)
// scripts = Monetag scripts (popunder, push, vignette …) and manual ad units that run network code
export const consentOk = (mode, consent) => mode === 'always' || consent === 'all'

// '/about' matches only that page; '/games/*' matches every page inside /games.
export function isPathAdsOff(list, path) {
  if (!Array.isArray(list) || !list.length) return false
  const p = norm(path)
  return list.some(e => {
    const x = String(e || '')
    if (x.endsWith('/*')) { const b = norm(x.slice(0, -2)); return b !== '/' && p.startsWith(b + '/') }
    return norm(x) === p
  })
}

export function useAdsControl() {
  const c = useSiteContent(), s = useSettings(), contentReady = useContentReady()
  const d = c.ads_control, legacy = s.ads_require_consent === false ? 'always' : 'accept'
  return useMemo(() => {
    const pick = v => (v === 'always' || v === 'accept') ? v : legacy
    return {
      ready: Boolean(contentReady && s.__loaded),
      cards: pick(d?.cards), scripts: pick(d?.scripts),
      banner: d && typeof d.banner === 'boolean' ? d.banner : true,
      bannerText: typeof d?.banner_text === 'string' ? d.banner_text : '',
      pagesOff: Array.isArray(d?.pages_off) ? d.pages_off : [],
    }
  }, [d, legacy, contentReady, s.__loaded])
}
