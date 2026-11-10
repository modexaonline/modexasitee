import { lazy, Suspense, useEffect, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { Navigate as RawNavigate } from 'react-router-dom'
import { useLang, useEnabledLangs, langInfo } from './lib/i18n'
import { useSettings } from './lib/useSettings'
import { Routes, Route, Navigate, useLocation } from './lib/i18nRouter'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import { PageSkeleton } from './components/Skeleton'
import { applyTheme, getTheme } from './lib/theme'
import { useHiddenPaths, useContentReady } from './lib/siteContent'
import { isPathHidden } from './lib/hidden'
const ListingPage = lazy(() => import('./pages/ListingPage'))
const DetailPage = lazy(() => import('./pages/DetailPage'))
const LegacyModRedirect = lazy(() => import('./pages/DetailPage').then(m => ({ default: m.LegacyModRedirect })))
const DownloadPage = lazy(() => import('./pages/DownloadPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const SavedPage = lazy(() => import('./pages/SavedPage'))
const SubmitPage = lazy(() => import('./pages/SubmitPage'))
const InfoPage = lazy(() => import('./pages/InfoPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const BlogIndex = lazy(() => import('./pages/BlogPages').then(m => ({ default: m.BlogIndex })))
const BlogDetail = lazy(() => import('./pages/BlogPages').then(m => ({ default: m.BlogDetail })))
const CustomPage = lazy(() => import('./pages/BlogPages').then(m => ({ default: m.CustomPage })))
const Admin = lazy(() => import('./admin/Admin'))

export default function App() {
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('modexa-saved') || '[]') } catch { return [] }
  })
  const location = useLocation(), hidden = useHiddenPaths(), contentReady = useContentReady()
  const lang = useLang(), settings = useSettings(), enabledLangs = useEnabledLangs()
  // <html lang dir> follows the page language (Arabic and Urdu read right to left)
  useEffect(() => { const L = langInfo(lang); document.documentElement.lang = L.hreflang; document.documentElement.dir = L.dir || 'ltr' }, [lang])
  // after the first screen is up, quietly fetch the pages people open next so they open instantly
  useEffect(() => { const go = () => { import('./pages/DetailPage'); import('./pages/ListingPage'); import('./pages/BlogPages') }; const id = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 2500); return () => { window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id) } }, [])
  useEffect(() => { try { localStorage.setItem('modexa-saved', JSON.stringify(savedIds)) } catch {} }, [savedIds])
  useEffect(() => { applyTheme(location.pathname.startsWith('/admin') ? 'light' : getTheme()) }, [location.pathname])
  useEffect(() => { if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])
  if (location.pathname.startsWith('/admin')) return <ErrorBoundary fullscreen><Suspense fallback={<div className="admin-center">Loading admin…</div>}><Admin /></Suspense></ErrorBoundary>
  // a language that is switched off (or not set up yet) sends visitors to the normal English page
  if (lang !== 'en' && settings.__loaded && !enabledLangs.some(l => l.code === lang)) return <RawNavigate to={location.pathname + location.search + location.hash} replace/>
  const onToggleSave = id => setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  return <Layout savedCount={savedIds.length}>
    <Suspense fallback={<PageSkeleton/>}>{!contentReady ? <PageSkeleton/> : isPathHidden(hidden, location.pathname) ? <NotFoundPage hidden/> : <Routes location={location}>
      <Route path="/" element={<HomePage savedIds={savedIds} onToggleSave={onToggleSave}/>}/>
      <Route path="/apps" element={<ListingPage type="app" savedIds={savedIds} onToggleSave={onToggleSave}/>}/>
      <Route path="/apps/:slug" element={<DetailPage type="app" savedIds={savedIds} onToggleSave={onToggleSave}/>}/>
      <Route path="/games" element={<ListingPage type="game" savedIds={savedIds} onToggleSave={onToggleSave}/>}/>
      <Route path="/games/:slug" element={<DetailPage type="game" savedIds={savedIds} onToggleSave={onToggleSave}/>}/>
      <Route path="/guide" element={<BlogIndex type="guide"/>}/>
      <Route path="/guide/:slug" element={<BlogDetail type="guide"/>}/>
      <Route path="/blog" element={<BlogIndex type="blog"/>}/>
      <Route path="/blog/:slug" element={<BlogDetail type="blog"/>}/>
      <Route path="/page/:slug" element={<CustomPage savedIds={savedIds} onToggleSave={onToggleSave}/>}/>
      <Route path="/download/:slug" element={<DownloadPage/>}/>
      <Route path="/search" element={<SearchPage/>}/>
      <Route path="/saved" element={<SavedPage savedIds={savedIds} onToggleSave={onToggleSave}/>}/>
      <Route path="/mods" element={<Navigate to="/apps" replace/>}/>
      <Route path="/mods/:slug" element={<LegacyModRedirect/>}/>
      {['/categories', '/categories/:slug', '/trending', '/latest'].map(p => <Route key={p} path={p} element={<Navigate to="/apps" replace/>}/>)}
      <Route path="/submit-mod" element={<SubmitPage/>}/>
      {['about','contact','guidelines','faq','privacy','terms','cookies','copyright'].map(slug => <Route key={slug} path={`/${slug}`} element={<InfoPage/>}/>)}
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes>}</Suspense>
  </Layout>
}