import AdBlock from './AdBlock'
import AutoAd from './AutoAd'
import { useAdUnits, useAdsLoaded } from '../lib/useAds'

// Spots that fall back to an automatic Monetag direct-link card when no unit is set up for them in the Ads manager.
const AUTO_FALLBACK = new Set(['home_middle', 'mod_bottom', 'mod_sidebar'])

// <AdSlot placement="home_middle" />, renders every active unit for that placement (respecting targeting, device and consent).
export default function AdSlot({ placement, postSlug, gameSlug, className }) {
  const units = useAdUnits(placement, { postSlug, gameSlug }), loaded = useAdsLoaded()
  if (!units.length && loaded && AUTO_FALLBACK.has(placement)) return <AutoAd slot={placement}/>
  return <AdBlock units={units} className={className}/>
}
