import { useEffect, useState } from 'react'
import { Link } from '../lib/i18nRouter'
import { Cookie, X } from 'lucide-react'
import { useSettings } from '../lib/useSettings'
import { getConsent, setConsent } from '../lib/consent'
import { useAdsControl } from '../lib/adsControl'
import { useAdNetworksOn } from '../lib/adsterra'

export default function CookieNotice() {
  const s = useSettings()
  const ctl = useAdsControl(), nets = useAdNetworksOn()
  // The banner is always shown when any ad kind needs the visitor's OK; otherwise Admin → Page manager decides.
  const ads = Boolean(ctl.ready && nets.any && (ctl.cards === 'accept' || ctl.scripts === 'accept'))
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!ctl.ready) return
    try { setShow(ads ? !getConsent() : (ctl.banner !== false && !localStorage.getItem('modexa-cookie-notice'))) } catch {}
    const open = () => setShow(true); window.addEventListener('modexa-open-consent', open); return () => window.removeEventListener('modexa-open-consent', open)
  }, [ads, ctl.ready, ctl.banner])
  if (!show) return null
  const done = v => { if (ads) setConsent(v); try { localStorage.setItem('modexa-cookie-notice', '1') } catch {} setShow(false) }
  return <div className="cookie-notice" role="region" aria-label="Cookie notice">
    <span className="cookie-icon"><Cookie size={20}/></span>
    {ctl.bannerText.trim()
      ? <p>{ctl.bannerText.trim()} <Link to="/cookies">Cookie Policy</Link></p>
      : ads
      ? <p>We use essential browser storage to make the site work. With your permission, our advertising partners may also use cookies to show and measure ads. You can change this any time. <Link to="/cookies">Cookie Policy</Link></p>
      : <p>We use only essential browser storage (for example, to remember your saved mods) and no advertising or tracking cookies. <Link to="/cookies">Read the Cookie Policy</Link></p>}
    {ads ? <><button className="button button-outline button-small cookie-secondary" onClick={() => done('essential')}>Essential only</button><button className="button button-primary button-small" onClick={() => done('all')}>Accept all</button></> : <button className="button button-primary button-small" onClick={() => done('ok')}>Got it</button>}
    <button className="cookie-close" onClick={() => done(ads ? 'essential' : 'ok')} aria-label="Dismiss"><X size={16}/></button>
  </div>
}
