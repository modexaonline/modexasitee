import { Link } from '../lib/i18nRouter'
import { Compass } from 'lucide-react'
import SEO from '../components/SEO'

export default function NotFoundPage({ hidden = false }) {
  return <><SEO title="Page not found" noindex/><section className="not-found-page container"><span className="not-found-code">404</span><span className="not-found-icon"><Compass size={32}/></span><h1>Looks like you’ve wandered off-map.</h1><p>The page you’re looking for doesn’t exist or may have moved.</p><div><Link className="button button-primary" to="/">Back to home</Link><Link className="button button-outline" to="/games">Browse games</Link></div></section></>
}