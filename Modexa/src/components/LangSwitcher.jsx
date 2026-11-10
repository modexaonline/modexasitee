import { useEffect, useRef, useState } from 'react'
import { Link as RawLink, useLocation as useRawLocation } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { EN, LANGS, langInfo, splitPath, withLang, useEnabledLangs, useLang } from '../lib/i18n'

// Language menu in the header. Links go to the same page in the other language (English has no prefix).
export default function LangSwitcher({ className = '' }) {
  const langs = useEnabledLangs(), lang = useLang(), loc = useRawLocation(), [open, setOpen] = useState(false), box = useRef(null)
  useEffect(() => {
    if (!open) return
    const off = e => { if (box.current && !box.current.contains(e.target)) setOpen(false) }, esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  useEffect(() => { setOpen(false) }, [loc.pathname])
  if (!langs.length) return null
  const { path } = splitPath(loc.pathname), cur = lang === 'en' ? EN : langInfo(lang)
  return <div className={`lang-switch ${className}`} ref={box}>
    <button type="button" className="lang-btn" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="true" aria-label="Language"><Globe size={16}/><span>{cur.code.toUpperCase()}</span></button>
    {open && <ul className="lang-menu" role="menu">{[EN, ...langs].map(l => <li key={l.code} role="none"><RawLink role="menuitem" hrefLang={l.hreflang} lang={l.hreflang} className={l.code === lang ? 'active' : ''} to={withLang(path, l.code) + loc.search + loc.hash}>{l.native}</RawLink></li>)}</ul>}
  </div>
}
