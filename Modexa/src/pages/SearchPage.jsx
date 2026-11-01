import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import SearchBox from '../components/SearchBox'
import SafeImg from '../components/SafeImg'
import PageHero from '../components/PageHero'
import { Link } from 'react-router-dom'
import { useSearchItems, TYPE_LABEL } from '../lib/useSearchItems'
import { search, highlightParts } from '../lib/search'

export default function SearchPage() {
  const [params] = useSearchParams(), q = params.get('q') || ''
  const { items, loading } = useSearchItems()
  const results = useMemo(() => search(q, items, { limit: 60 }), [q, items])
  return <>
    <SEO fullTitle={q ? `Search results for “${q}” | Modexa` : 'Search | Modexa'} noindex description="Search apps, games, guides and blog posts on Modexa."/>
    <PageHero eyebrow="SEARCH" title={q ? <>Results for <span className="text-gradient">“{q}”</span></> : 'Search Modexa'} description="Apps, games, guides and blog posts, start typing, spelling mistakes are fine."/>
    <section className="directory-section"><div className="container search-page">
      <SearchBox variant="page" big initial={q} key={q} placeholder="Search apps, games, guides…" autoFocus={!q}/>
      {q && <p className="results-count-line">{loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}</p>}
      <div className="search-results">{results.map(r => <Link to={r.href} className="search-result" key={r.id}><SafeImg src={r.image} alt="" loading="lazy"/><span><span className="search-type">{TYPE_LABEL[r.type]}</span><b>{highlightParts(r.title, q).map((p, i) => p.m ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>)}</b>{r.subtitle && <small>{String(r.subtitle).slice(0, 140)}</small>}</span></Link>)}</div>
      {q && !loading && results.length === 0 && <div className="empty-state"><h3>Nothing found</h3><p>Check the spelling or try fewer words.</p></div>}
    </div></section>
  </>
}
