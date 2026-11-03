import { useLocation } from 'react-router-dom'
import { useAutoLinks, useAutoBanners, usePageAdsOff } from '../lib/useAds'
import { AUTO_AD_COPY } from '../lib/monetagDefaults'
import AdBlock from './AdBlock'

const hash = str => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h }

// Automatic ads for a spot: Adsterra banner(s) for that spot (if any) + one direct-link card (Monetag or Adsterra, rotated per page).
// Appears on every public page (top + bottom) and in the spots listed in AdSlot / the blog and mod pages.
// Switched off per page in Admin → Page manager, per post by "Show ads on this post", per network in Admin → Ads manager.
export default function AutoAd({ slot = 'inline', wrap = false }) {
  const links = useAutoLinks(), banners = useAutoBanners(slot), off = usePageAdsOff(), { pathname } = useLocation()
  if (off || (!links.length && !banners.length)) return null
  const h = hash(pathname + slot), c = AUTO_AD_COPY[h % AUTO_AD_COPY.length], link = links.length ? links[h % links.length].url : ''
  const inner = <>
    {banners.length > 0 && <AdBlock units={banners}/>}
    {link && <div className="ad-block auto-ad"><aside className="ad-unit ad-kind-direct_link" aria-label="Advertisement" data-ad={`auto-${slot}`}>
      <span className="ad-label">Advertisement</span>
      <div className="ad-body"><a className="ad-direct ad-direct-card" href={link} target="_blank" rel="sponsored nofollow noopener noreferrer"><span><strong>{c.title}</strong><small>{c.text}</small></span><span className="ad-direct-go">Open →</span></a></div>
    </aside></div>}
  </>
  return wrap ? <div className={`container auto-ad-wrap auto-ad-${slot}`}>{inner}</div> : inner
}
