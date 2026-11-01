import AdBlock from './AdBlock'
import { useAdUnits } from '../lib/useAds'

// <AdSlot placement="home_middle" />, renders every active unit for that placement (respecting targeting, device and consent).
export default function AdSlot({ placement, postSlug, gameSlug, className }) {
  const units = useAdUnits(placement, { postSlug, gameSlug })
  return <AdBlock units={units} className={className}/>
}
