import { Link } from 'react-router-dom'
import { Heart, Mail } from 'lucide-react'
import SocialIcon from './SocialIcon'
import { socialsOf } from '../lib/social'
import Logo from './Logo'
import usePublicPages from '../lib/usePublicPages'
import { useSettings } from '../lib/useSettings'
import { usePageContent, useHiddenPaths } from '../lib/siteContent'
import { isPathHidden } from '../lib/hidden'
import { NAV_DEFAULT } from '../content/merge'
import { openConsent } from '../lib/consent'
import { useAdsControl } from '../lib/adsControl'
import { useAdNetworksOn } from '../lib/adsterra'

export default function Footer() {
  const customPages = usePublicPages('show_in_footer')
  const s = useSettings(), ctl = useAdsControl(), nets = useAdNetworksOn()
  const needsConsent = ctl.ready && nets.any && (ctl.cards === 'accept' || ctl.scripts === 'accept')
  const hiddenPaths = useHiddenPaths()
  const nav0 = usePageContent('nav', NAV_DEFAULT)
  const nav = { ...nav0, footer: nav0.footer.map(g => ({ ...g, links: g.links.filter(l => !isPathHidden(hiddenPaths, l.to)) })) }
  return <footer className="site-footer">
    <div className="footer-top">
      <div className="footer-brand-col">
        <Logo/>
        <p>{s.tagline || 'Android apps, games and guides in one place.'}</p>
        <div className="footer-socials">{socialsOf(s).map((x, i) => <a key={i} href={x.platform === 'email' && !/^mailto:/.test(x.url) ? `mailto:${x.url}` : x.url} target="_blank" rel="noopener noreferrer" aria-label={x.label || x.platform}><SocialIcon item={x}/></a>)}{s.contact_email && !socialsOf(s).some(x => x.platform === 'email') && <a href={`mailto:${s.contact_email}`} aria-label="Email us"><Mail size={16}/></a>}</div>
      </div>
      {nav.footer.map((g, gi) => <div className="footer-column" key={g.title + gi}><h4>{g.title}</h4>{g.links.map(l => /^https?:/.test(l.to) ? <a key={l.to + l.label} href={l.to} target="_blank" rel="noopener noreferrer">{l.label}</a> : <Link key={l.to + l.label} to={l.to}>{l.label}</Link>)}{gi === nav.footer.length - 1 && customPages.map(page => <Link key={page.slug} to={`/page/${page.slug}`}>{page.title}</Link>)}</div>)}
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {s.site_name || 'Modexa'}. All rights reserved.</span>{needsConsent && <button type="button" className="footer-link-btn" onClick={openConsent}>Cookie settings</button>}<span>Made for the love of games <Heart size={13} className="heart-icon" fill="currentColor"/></span></div>
    {s.footer_text && <p className="disclaimer footer-extra">{s.footer_text}</p>}
  </footer>
}
