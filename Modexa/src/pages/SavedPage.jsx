import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import SEO from '../components/SEO'
import SeoContent from '../components/SeoContent'
import { usePageContent } from '../lib/siteContent'
import { LISTING } from '../content/seo'

import PageHero from '../components/PageHero'
import ModGrid from '../components/ModGrid'
import useModsData from '../lib/useMods'

export default function SavedPage({ savedIds, onToggleSave }) {
  const L = usePageContent('listing:saved', LISTING.saved)
  const mods = useModsData()
  const saved = mods.filter(m => savedIds.includes(m.id))
  return <><SEO fullTitle={L.seoTitle + ' | Modexa'} noindex description={L.description}/><PageHero eyebrow="YOUR PERSONAL COLLECTION" title={<>Keep your favorites <span className="text-gradient">close.</span></>} description="Your saved mod listings stay in this browser, ready for your next visit."/><section className="directory-section"><div className="container"><div className="results-summary"><span><strong>{saved.length}</strong> saved listings</span><span>Stored locally in this browser</span></div>{saved.length ? <ModGrid mods={saved} savedIds={savedIds} onToggleSave={onToggleSave}/> : <div className="empty-state"><span className="empty-icon"><Bookmark size={24}/></span><h3>Your collection is waiting</h3><p>Save any mod that catches your eye and it will show up here.</p><Link className="button button-primary" to="/apps">Explore mods</Link></div>}</div></section><SeoContent data={L}/></>
}