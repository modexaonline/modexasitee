import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumbs({ items = [] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{items.map((it, i) => <li key={it.label}>{i > 0 && <ChevronRight size={13} aria-hidden="true"/>}{it.to && i < items.length - 1 ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}</li>)}</ol></nav>
}
