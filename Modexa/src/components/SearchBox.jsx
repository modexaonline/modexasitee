import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ArrowRight } from 'lucide-react'
import SafeImg from './SafeImg'
import { useSearchItems, TYPE_LABEL } from '../lib/useSearchItems'
import { search, highlightParts } from '../lib/search'

// Live suggestions across apps, games, guides and blog posts. Typo tolerant; narrows as the spelling gets complete.
export default function SearchBox({ placeholder = 'Search apps, games, guides…', className = '', variant = 'header', initial = '', autoFocus = false, onDone, big = false }) {
  const [q, setQ] = useState(initial), [open, setOpen] = useState(false), [idx, setIdx] = useState(-1)
  const nav = useNavigate(), box = useRef(null), input = useRef(null)
  const { items } = useSearchItems()
  const results = useMemo(() => (q.trim() ? search(q, items, { limit: 7 }) : []), [q, items])
  useEffect(() => { setIdx(-1) }, [q])
  useEffect(() => { const out = e => { if (box.current && !box.current.contains(e.target)) setOpen(false) }; document.addEventListener('mousedown', out); return () => document.removeEventListener('mousedown', out) }, [])
  const go = href => { setOpen(false); onDone?.(); nav(href) }
  const submit = e => { e.preventDefault(); if (idx >= 0 && results[idx]) return go(results[idx].href); const t = q.trim(); go(t ? `/search?q=${encodeURIComponent(t)}` : '/search') }
  const onKey = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setIdx(i => Math.min(results.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(-1, i - 1)) }
    else if (e.key === 'Escape') { setOpen(false); input.current?.blur() }
  }
  return <div ref={box} className={`searchbox searchbox-${variant} ${big ? 'is-big' : ''} ${className}`} role="search">
    <form onSubmit={submit} autoComplete="off">
      <Search size={big ? 20 : 16} aria-hidden="true"/>
      <input ref={input} autoFocus={autoFocus} value={q} onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKey} placeholder={placeholder} aria-label="Search" role="combobox" aria-expanded={open && results.length > 0} aria-autocomplete="list" enterKeyHint="search"/>
      {q && <button type="button" className="searchbox-clear" onClick={() => { setQ(''); input.current?.focus() }} aria-label="Clear search"><X size={15}/></button>}
      {variant === 'header' && !q && <kbd>/</kbd>}
      {big && <button className="searchbox-go" type="submit">Search</button>}
    </form>
    {open && q.trim() && <div className="searchbox-panel" role="listbox">
      {results.length === 0 ? <div className="searchbox-empty">No results for “{q.trim()}”. Check the spelling or try fewer words.</div> : <>
        {results.map((r, i) => <button type="button" role="option" aria-selected={i === idx} key={r.id} className={`searchbox-item ${i === idx ? 'active' : ''}`} onMouseEnter={() => setIdx(i)} onMouseDown={e => { e.preventDefault(); go(r.href) }}>
          <SafeImg src={r.image} alt="" loading="lazy"/>
          <span className="searchbox-text"><b>{highlightParts(r.title, q).map((p, k) => p.m ? <mark key={k}>{p.t}</mark> : <span key={k}>{p.t}</span>)}</b><small>{TYPE_LABEL[r.type]}{r.subtitle ? ' · ' + String(r.subtitle).slice(0, 60) : ''}</small></span>
        </button>)}
        <button type="button" className="searchbox-all" onMouseDown={e => { e.preventDefault(); go(`/search?q=${encodeURIComponent(q.trim())}`) }}>See all results for “{q.trim()}” <ArrowRight size={14}/></button></>}
    </div>}
  </div>
}
