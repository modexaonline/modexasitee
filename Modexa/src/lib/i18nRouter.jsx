// Drop-in replacement for react-router-dom. Everything is re-exported unchanged, except:
//  Link / NavLink / Navigate / useNavigate add the language prefix (/id/...) when the visitor is on a translated page.
//  useLocation shows the page path WITHOUT the prefix, so the rest of the site works the same in every language.
import { forwardRef, useCallback, useMemo } from 'react'
import { Link as RLink, NavLink as RNavLink, Navigate as RNavigate, useNavigate as useRNavigate, useLocation as useRLocation } from 'react-router-dom'
import { splitPath, withLang } from './i18n'
export * from 'react-router-dom'

const internal = to => typeof to === 'string' && to.startsWith('/') && !to.startsWith('//') && !/^\/admin(\/|$)/.test(to)
const localizeStr = (to, lang) => (lang === 'en' || !internal(to) || splitPath(to.replace(/[?#].*$/, '')).lang !== 'en') ? to : withLang(to, lang)
function useLocalize() {
  const lang = splitPath(useRLocation().pathname).lang
  return useCallback(to => {
    if (typeof to === 'string') return localizeStr(to, lang)
    if (to && typeof to === 'object' && typeof to.pathname === 'string') return { ...to, pathname: localizeStr(to.pathname, lang) }
    return to
  }, [lang])
}
export const Link = forwardRef(function Link({ to, ...rest }, ref) { const loc = useLocalize(); return <RLink ref={ref} to={loc(to)} {...rest}/> })
export const NavLink = forwardRef(function NavLink({ to, ...rest }, ref) { const loc = useLocalize(); return <RNavLink ref={ref} to={loc(to)} {...rest}/> })
export function Navigate({ to, ...rest }) { const loc = useLocalize(); return <RNavigate to={loc(to)} {...rest}/> }
export function useNavigate() { const nav = useRNavigate(), loc = useLocalize(); return useCallback((to, opts) => typeof to === 'number' ? nav(to) : nav(loc(to), opts), [nav, loc]) }
export function useLocation() { const l = useRLocation(); return useMemo(() => ({ ...l, pathname: splitPath(l.pathname).path }), [l]) }
