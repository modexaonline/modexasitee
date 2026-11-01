import { Link } from 'react-router-dom'
import { Bookmark, Download, ArrowUpRight, Check } from 'lucide-react'
import { formatCount } from '../data/mods'
import SafeImg from './SafeImg'

export default function ModCard({ mod, saved, onToggleSave, compact = false }) {
  return <article className={`mod-card ${compact ? 'mod-card-compact' : ''}`}>
    <div className="mod-image-wrap">
      <Link to={mod.href} className="mod-image-link" aria-label={`View ${mod.title}`}>
        <SafeImg src={mod.image} className="mod-image" loading="lazy"/>
      </Link>
      {mod.badge && <span className="image-badge">{mod.badge}</span>}
      <button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={() => onToggleSave(mod.id)} aria-pressed={saved} aria-label={saved ? `Remove ${mod.title} from saved mods` : `Save ${mod.title}`} title={saved ? 'Remove saved mod' : 'Save mod'}>{saved ? <Check size={16}/> : <Bookmark size={16}/>}</button>
    </div>
    <div className="mod-card-content">
      <div className="card-meta"><span>{mod.game}</span><span className="meta-dot">·</span><span>{mod.category}</span></div>
      <Link to={mod.href} className="mod-title-link"><h3>{mod.title}</h3></Link>
      <p className="mod-short">{mod.short}</p>
      <div className="mod-card-bottom">
        <span className="platform-pill">{mod.platform}</span>
        <span className="download-count"><Download size={14}/>{formatCount(mod.downloads)}</span>
        <Link to={mod.href} className="card-arrow" aria-label={`Details for ${mod.title}`}><ArrowUpRight size={17}/></Link>
      </div>
    </div>
  </article>
}
