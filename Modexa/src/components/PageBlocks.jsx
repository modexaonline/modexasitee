import { Link } from 'react-router-dom'
import ContentHtml from './ContentHtml'
import AdBlock from './AdBlock'
import AdUnit from './AdUnit'
import SafeImg from './SafeImg'
import FaqSection from './FaqSection'
import ModCard from './ModCard'
import { useAdUnits } from '../lib/useAds'
import { useModsState } from '../lib/useMods'
import { usePostsState } from '../lib/usePosts'
import { buttonHtml } from '../lib/buttonTemplates'
import { postHref } from '../lib/useSearchItems'
import ContactForm from './ContactForm'
import { ICON_MAP, parseVideo, safeColor, safeUrl, safeClass, safeAnchor } from '../lib/blockIcons'

// Renders the sections built in Admin > Website editor > page builder (WordPress-style blocks).
const isExt = u => /^https?:\/\//i.test(u || '')
const A = ({ to, children, className }) => !to ? <span className={className}>{children}</span> : isExt(to) ? <a className={className} href={to} target="_blank" rel="noopener noreferrer">{children}</a> : <Link className={className} to={to}>{children}</Link>

function ListingBlock({ d, savedIds = [], onToggleSave = () => {} }) {
  const { items: mods } = useModsState(), { items: posts } = usePostsState()
  const n = Math.max(1, Math.min(12, +d.count || 3))
  if (d.kind === 'app' || d.kind === 'game') { const l = mods.filter(m => m.type === d.kind).slice(0, n); return l.length ? <div className="mods-grid">{l.map(m => <ModCard key={m.id} mod={m} saved={savedIds.includes(m.id)} onToggleSave={onToggleSave}/>)}</div> : null }
  const l = posts.filter(p => (p.post_type === 'guide' ? 'guide' : 'blog') === d.kind).slice(0, n)
  return l.length ? <div className="blog-list-grid">{l.map(p => <article className="blog-list-card" key={p.id}><Link to={postHref(p)} className="blog-list-image"><SafeImg src={p.cover_image} loading="lazy"/></Link><div className="blog-list-content"><Link to={postHref(p)}><h2>{p.title}</h2></Link><p>{p.excerpt}</p></div></article>)}</div> : null
}
function AdKey({ k }) { const all = useAdUnits('', {}, { ignoreScope: true }); const u = all.find(x => x.slot_key === k); return u ? <AdBlock units={[u]}/> : null }

const paras = t => String(t || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean)
// Per-section style (Style settings in the page builder): background, spacing, width, alignment, visibility, anchor, extra class.
const hasStyle = st => st && (st.bg && st.bg !== 'none' || st.pad && st.pad !== 'default' || st.width && st.width !== 'normal' || st.align || st.hide && st.hide !== 'none' || st.anchor || st.cls)
function Wrap({ st, children }) {
  if (!hasStyle(st)) return children
  const style = {}
  if (st.bg === 'custom') { const c = safeColor(st.bgColor), im = safeUrl(st.bgImage); if (c) style.backgroundColor = c; if (im) { style.backgroundImage = `url("${im}")`; style.backgroundSize = 'cover'; style.backgroundPosition = 'center' } }
  if (st.align) style.textAlign = st.align
  const cls = ['pb-wrap', st.bg && st.bg !== 'none' && st.bg !== 'custom' ? `pb-bg-${st.bg}` : '', st.bg === 'custom' && safeColor(st.bgColor) && safeColor(st.bgColor).length <= 7 ? 'pb-bg-custom' : '', st.pad && st.pad !== 'default' ? `pb-pad-${st.pad}` : '', st.width && st.width !== 'normal' ? `pb-w-${st.width}` : '', st.hide && st.hide !== 'none' ? `pb-hide-${st.hide}` : '', safeClass(st.cls)].filter(Boolean).join(' ')
  return <div id={safeAnchor(st.anchor) || undefined} className={cls} style={style}>{children}</div>
}

export default function PageBlocks({ blocks = [], ads = [], savedIds, onToggleSave, layout = 'default' }) {
  return <div className={`pb ${layout === 'wide' ? 'pb-layout-wide' : layout === 'full' ? 'pb-layout-full' : ''}`}>{blocks.map((b, i) => { const key = b.id || i; return <Wrap key={key} st={b.style}>{renderBlock(b, i, { ads, savedIds, onToggleSave })}</Wrap> })}</div>
}

function renderBlock(b, i, { ads, savedIds, onToggleSave }) {
  const d = b.data || {}; const key = b.id || i
  { switch (b.type) {
    case 'heading': { const Tag = d.level === 'h1' ? 'h1' : d.level === 'h3' ? 'h3' : 'h2'; return <section key={key} className="pb-block container pb-heading" style={{ textAlign: d.align || 'center' }}><Tag className="pb-title">{d.text}</Tag>{d.sub && <p>{d.sub}</p>}</section> }
    case 'imagetext': return <section key={key} className={`pb-block container pb-split ${d.side === 'right' ? 'is-right' : ''}`}><div className="pb-split-img">{d.image && <SafeImg src={d.image} alt={d.alt || d.title || ''} loading="lazy"/>}</div><div className="pb-split-text">{d.title && <h2 className="pb-title">{d.title}</h2>}{paras(d.text).map((t, k) => <p key={k}>{t}</p>)}{d.buttonLabel && d.buttonUrl && <A to={d.buttonUrl} className="mx-btn mx-btn--green">{d.buttonLabel}</A>}</div></section>
    case 'features': { const n = Math.min(4, Math.max(2, +d.cols || 3)); return <section key={key} className="pb-block container">{d.title && <h2 className="pb-title" style={{ textAlign: 'center' }}>{d.title}</h2>}<div className="pb-features" style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))` }}>{(d.items || []).map((f, k) => { const I = ICON_MAP[f.icon] || ICON_MAP.star; return <div className="pb-feature" key={k}><span className="pb-feature-ico"><I size={22}/></span><b>{f.title}</b>{f.text && <p>{f.text}</p>}</div> })}</div></section> }
    case 'stats': return <section key={key} className="pb-block container"><div className="pb-stats">{(d.items || []).map((s, k) => <div key={k}><b>{s.value}</b><span>{s.label}</span></div>)}</div></section>
    case 'steps': return <section key={key} className="pb-block container pb-narrow">{d.title && <h2 className="pb-title">{d.title}</h2>}<ol className="pb-steps">{(d.items || []).map((s, k) => <li key={k}><span className="pb-step-n">{k + 1}</span><div><b>{s.title}</b>{s.text && <p>{s.text}</p>}</div></li>)}</ol></section>
    case 'testimonials': return <section key={key} className="pb-block container">{d.title && <h2 className="pb-title" style={{ textAlign: 'center' }}>{d.title}</h2>}<div className="pb-cards">{(d.items || []).map((t, k) => <figure className="pb-testi" key={k}><blockquote>{t.quote}</blockquote><figcaption>{t.avatar && <SafeImg src={t.avatar} alt="" loading="lazy"/>}<span><b>{t.name}</b>{t.role && <small>{t.role}</small>}</span></figcaption></figure>)}</div></section>
    case 'video': { const v = parseVideo(d.url); if (!v) return null; return <section key={key} className="pb-block container pb-narrow pb-video">{v.type === 'iframe' ? <div className="pb-video-frame"><iframe src={v.src} title={d.caption || 'Video'} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div> : <video src={v.src} controls preload="metadata" playsInline/>}{d.caption && <p className="pb-caption">{d.caption}</p>}</section> }
    case 'gallery': { const n = Math.min(5, Math.max(2, +d.cols || 3)); return <section key={key} className="pb-block container">{d.title && <h2 className="pb-title">{d.title}</h2>}<div className="pb-gallery" style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))` }}>{(d.images || []).filter(x => x.src).map((im, k) => <SafeImg key={k} src={im.src} alt={im.alt || ''} loading="lazy"/>)}</div></section> }
    case 'notice': return <section key={key} className="pb-block container pb-narrow"><div className={`pb-notice is-${['info', 'success', 'warning', 'danger'].includes(d.kind) ? d.kind : 'info'}`} role="note">{d.title && <b>{d.title}</b>}{d.text && <p>{d.text}</p>}</div></section>
    case 'quote': return <section key={key} className="pb-block container pb-narrow"><blockquote className="pb-quote"><p>{d.text}</p>{d.author && <cite>{d.author}</cite>}</blockquote></section>
    case 'table': { const rows = String(d.text || '').split('\n').map(r => r.trim()).filter(Boolean).map(r => r.split('|').map(c => c.trim())); if (!rows.length) return null; const head = d.header !== false ? rows[0] : null, body = head ? rows.slice(1) : rows; return <section key={key} className="pb-block container">{d.title && <h2 className="pb-title">{d.title}</h2>}<div className="pb-table-wrap"><table className="pb-table">{head && <thead><tr>{head.map((c, k) => <th key={k}>{c}</th>)}</tr></thead>}<tbody>{body.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div></section> }
    case 'contact': return <section key={key} className="pb-block container pb-narrow">{d.title && <h2 className="pb-title">{d.title}</h2>}<ContactForm/></section>

    case 'hero': return <section key={key} className={`pb-block pb-hero ${d.image ? 'has-img' : ''}`} style={d.image ? { backgroundImage: `linear-gradient(#0a0a0acc,#0a0a0acc),url(${d.image})` } : undefined}><div className="container pb-hero-in" style={{ textAlign: d.align || 'center' }}><h1>{d.title}</h1>{d.subtitle && <p>{d.subtitle}</p>}{d.buttonLabel && d.buttonUrl && <A to={d.buttonUrl} className="mx-btn mx-btn--green mx-btn--lg">{d.buttonLabel}</A>}</div></section>
    case 'text': return <section key={key} className="pb-block container pb-narrow"><ContentHtml content={d.html} ads={ads}/></section>
    case 'image': { const img = <SafeImg src={d.src} alt={d.alt || ''} loading="lazy"/>; return <figure key={key} className="pb-block container pb-image" style={{ maxWidth: d.width ? d.width + '%' : undefined }}>{d.link ? <A to={d.link}>{img}</A> : img}{d.caption && <figcaption>{d.caption}</figcaption>}</figure> }
    case 'buttons': return <section key={key} className="pb-block container pb-buttons" style={{ textAlign: d.align || 'center' }}><div className="mx-content" dangerouslySetInnerHTML={{ __html: (d.items || []).filter(x => x.url).map(x => buttonHtml({ tpl: x.tpl, label: x.label, href: x.url, wait: x.wait ?? 30, img: x.img }).replace('<p style="text-align:center">', '<span>').replace(/<\/p>$/, '</span>')).join('') }}/></section>
    case 'columns': return <section key={key} className="pb-block container"><div className="pb-cols" style={{ gridTemplateColumns: `repeat(${Math.min(4, (d.cols || []).length || 1)},minmax(0,1fr))` }}>{(d.cols || []).map((c, k) => <div key={k}><ContentHtml content={c.html} ads={ads}/></div>)}</div></section>
    case 'cards': return <section key={key} className="pb-block container">{d.title && <h2 className="pb-title">{d.title}</h2>}<div className="pb-cards">{(d.items || []).map((c, k) => <A key={k} to={c.url} className="pb-card">{c.image && <SafeImg src={c.image} alt="" loading="lazy"/>}<b>{c.title}</b>{c.text && <p>{c.text}</p>}</A>)}</div></section>
    case 'faq': return <section key={key} className="pb-block container pb-narrow"><FaqSection faqs={(d.items || []).filter(x => x.q)} title={d.title || 'Frequently asked questions'} id={'faq-' + i}/></section>
    case 'listing': return <section key={key} className="pb-block container">{d.title && <h2 className="pb-title">{d.title}</h2>}<ListingBlock d={d} savedIds={savedIds} onToggleSave={onToggleSave}/></section>
    case 'code': return <section key={key} className="pb-block container"><div className="ad-block"><AdUnit unit={{ id: 'pb-' + i, slot_key: 'embed', name: 'Embedded code', kind: 'script', render_mode: 'isolated', code: d.code || '', size: d.w ? 'custom' : 'responsive', custom_width: d.w || 300, custom_height: d.h || 250, label: '' }}/></div></section>
    case 'ad': return <section key={key} className="pb-block container"><AdKey k={d.key}/></section>
    case 'cta': return <section key={key} className="pb-block pb-cta"><div className="container pb-cta-in"><div><h2>{d.title}</h2>{d.text && <p>{d.text}</p>}</div>{d.buttonLabel && d.buttonUrl && <A to={d.buttonUrl} className="button button-primary">{d.buttonLabel}</A>}</div></section>
    case 'divider': return <div key={key} className="pb-block container"><hr style={{ margin: (d.size || 24) + 'px 0' }}/></div>
    case 'spacer': return <div key={key} style={{ height: +d.size || 40 }} aria-hidden="true"/>
    default: return null } }
}
