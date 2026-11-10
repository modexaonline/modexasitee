import { useEffect, useRef, useState } from 'react'
import { useT } from '../lib/i18n'
import { Link, NavLink, useLocation, useNavigate } from '../lib/i18nRouter'
import { Menu, X, Bookmark } from 'lucide-react'
import SearchBox from './SearchBox'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import LangSwitcher from './LangSwitcher'
import usePublicPages from '../lib/usePublicPages'
import { usePageContent, useHiddenPaths } from '../lib/siteContent'
import { isPathHidden } from '../lib/hidden'
import { NAV_DEFAULT } from '../content/merge'


export default function Header({ savedCount = 0 }) {
  const t = useT()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const customPages = usePublicPages('show_in_menu')
  const hiddenPaths = useHiddenPaths()
  const links = usePageContent('nav', NAV_DEFAULT).header.filter(l => !isPathHidden(hiddenPaths, l.to))
  const navigate = useNavigate()
  const location = useLocation()
  

  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  useEffect(() => { document.body.style.overflow = mobileOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [mobileOpen])
  useEffect(() => {
    const onKey = e => {
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      if (e.key === '/' && !['input', 'textarea', 'select'].includes(tag)) { e.preventDefault(); document.querySelector('.searchbox-header input')?.focus() }
      if (e.key === 'Escape') setMobileOpen(false)
    }
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll(); window.addEventListener('keydown', onKey); window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label={t('Main navigation')}>
          {links.map(link => <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{link.label}</NavLink>)}
          {customPages.map(page => <NavLink key={page.slug} to={`/page/${page.slug}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{page.title}</NavLink>)}
        </nav>
        <div className="header-actions">
          <SearchBox variant="header" className="header-searchbox"/>
          <LangSwitcher/>
          <ThemeToggle/>
          <Link className="saved-link" to="/saved" aria-label={`${t('Saved mods')}: ${savedCount}`}><Bookmark size={18}/><span className="saved-count">{savedCount}</span></Link>
          <Link className="button button-small button-primary submit-header" to="/submit-mod">{t('Submit a Game')} <span>↗</span></Link>
          <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? t('Close menu') : t('Open menu')} aria-expanded={mobileOpen}>{mobileOpen ? <X/> : <Menu/>}</button>
        </div>
      </div>
      {mobileOpen && <div className="mobile-panel">
        <SearchBox variant="mobile" onDone={() => setMobileOpen(false)}/>
        {links.map(link => <NavLink key={link.to} to={link.to} className="mobile-nav-link">{link.label}<span>↗</span></NavLink>)}
        {customPages.map(page => <NavLink key={page.slug} to={`/page/${page.slug}`} className="mobile-nav-link">{page.title}<span>↗</span></NavLink>)}
        <Link className="mobile-nav-link" to="/saved">{t('Saved mods')} <span>{savedCount}</span></Link>
        <Link className="button button-primary mobile-submit" to="/submit-mod">{t('Submit a Game')}</Link>
      </div>}
    </header>
  )
}
