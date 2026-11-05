import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import AnnouncementBar from './AnnouncementBar'
import BackToTop from './BackToTop'
import ErrorBoundary from './ErrorBoundary'
import CookieNotice from './CookieNotice'
import GlobalAds from './GlobalAds'
import AdsDebugPanel from './AdsDebugPanel'
import DownloadGate from './DownloadGate'
import AutoAd from './AutoAd'

export default function Layout({ children, savedCount }) {
  const { pathname } = useLocation()
  return <><a className="skip-link" href="#main-content">Skip to content</a><AnnouncementBar where="top"/><Header savedCount={savedCount}/><AnnouncementBar where="below_header"/><main id="main-content">{!pathname.startsWith('/download/') && <AutoAd slot="top" wrap/>}<ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary><AutoAd slot="bottom" wrap/></main><Footer/><AnnouncementBar where="bottom"/><BackToTop/><CookieNotice/><GlobalAds/><AdsDebugPanel/><DownloadGate/></>
}
