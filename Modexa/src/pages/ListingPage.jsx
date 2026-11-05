import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import SEO from '../components/SEO'
import SeoContent from '../components/SeoContent'
import PageHero from '../components/PageHero'
import ModGrid from '../components/ModGrid'
import { LISTING } from '../content/seo'
import { usePageContent } from '../lib/siteContent'
import { useModsState } from '../lib/useMods'
import { prepare, search } from '../lib/search'
import { htmlToPlain } from '../lib/formatText'
import { toHtml } from '../lib/contentHtml'

// One page for both "Apps" and "Games", same features, same editor in Admin.
export default function ListingPage({ type = 'app', savedIds, onToggleSave }) {
  const key = type === 'game' ? 'games' : 'apps'
  const L = usePageContent('listing:' + key, LISTING[key])
  const { items } = useModsState()
  const all = useMemo(() => items.filter(m => (m.type || 'app') === type), [items, type])
  const [q, setQ] = useState(''), [cat, setCat] = useState('All'), [sort, setSort] = useState('new')
  const prepared = useMemo(() => all.map(m => prepare({ id: m.id, title: m.title, subtitle: m.short, game: m.game, category: m.category, text: htmlToPlain(toHtml(m.content || m.description || '')) })), [all])
  const cats = useMemo(() => ['All', ...new Set(all.map(m => m.category).filter(Boolean))], [all])
  const list = useMemo(() => {
    let l = q.trim() ? search(q, prepared, { limit: 200 }).map(r => all.find(m => m.id === r.id)).filter(Boolean) : [...all]
    if (cat !== 'All') l = l.filter(m => m.category === cat)
    if (!q.trim()) { if (sort === 'new') l.sort((a, b) => new Date(b.updated) - new Date(a.updated)); if (sort === 'downloads') l.sort((a, b) => b.downloads - a.downloads); if (sort === 'az') l.sort((a, b) => a.title.localeCompare(b.title)); if (sort === 'featured') l.sort((a, b) => Number(b.featured) - Number(a.featured)) }
    return l
  }, [all, prepared, q, cat, sort])
  const name = type === 'game' ? 'Games' : 'Apps'
  return <>
    <SEO fullTitle={L.seoTitle} description={L.description} pageType="CollectionPage" breadcrumbs={[{ label: 'Home', to: '/' }, { label: name, to: '/' + key }]} faqs={L.faqs}/>
    <PageHero eyebrow={name.toUpperCase()} title={L.h1 || name} description={L.description}/>
    <section className="directory-section"><div className="container">
      <div className="listing-toolbar">
        <div className="directory-search"><Search size={18}/><input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${name.toLowerCase()}…`} aria-label={`Search ${name.toLowerCase()}`}/>{q && <button type="button" onClick={() => setQ('')} aria-label="Clear"><X size={15}/></button>}</div>
        {cats.length > 2 && <div className="chip-row" role="tablist">{cats.map(c => <button key={c} role="tab" aria-selected={cat === c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>)}</div>}
        <select className="listing-sort" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort"><option value="new">Newest</option><option value="featured">Featured</option><option value="downloads">Most downloaded</option><option value="az">A – Z</option></select>
      </div>
      <p className="results-count-line">{list.length} {list.length === 1 ? type : name.toLowerCase()}</p>
      <ModGrid mods={list} savedIds={savedIds} onToggleSave={onToggleSave}/>
    </div></section>
    <SeoContent data={L}/>
  </>
}
