import { useLocation } from 'react-router-dom'
import { useMonetag, usePageAdsOff } from '../lib/useAds'
import { AUTO_AD_COPY } from '../lib/monetagDefaults'

const hash = str => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h }

// Automatic Monetag direct-link card. Appears on every public page (top + bottom) and in the spots below.
// Switched off per page by "Show ads on this post" (posts), or globally from Admin → Ads → Monetag.
export default function AutoAd({ slot = 'inline', wrap = false }) {
  const { link } = useMonetag(), off = usePageAdsOff(), { pathname } = useLocation()
  if (!link || off) return null
  const c = AUTO_AD_COPY[hash(pathname + slot) % AUTO_AD_COPY.length]
  const card = <div className="ad-block auto-ad"><aside className="ad-unit ad-kind-direct_link" aria-label="Advertisement" data-ad={`auto-${slot}`}>
    <span className="ad-label">Advertisement</span>
    <div className="ad-body"><a className="ad-direct ad-direct-card" href={link} target="_blank" rel="sponsored nofollow noopener noreferrer"><span><strong>{c.title}</strong><small>{c.text}</small></span><span className="ad-direct-go">Open →</span></a></div>
  </aside></div>
  return wrap ? <div className={`container auto-ad-wrap auto-ad-${slot}`}>{card}</div> : card
}
