import { Link, Navigate, useParams } from '../lib/i18nRouter'
import { useT } from '../lib/i18n'
import { ArrowLeft, Bookmark, Check, Download, CalendarDays, UserRound, Monitor, ChevronRight } from 'lucide-react'
import SEO from '../components/SEO'
import ModCard from '../components/ModCard'
import ContentHtml from '../components/ContentHtml'
import SafeImg from '../components/SafeImg'
import ShareButton from '../components/ShareButton'
import FaqSection from '../components/FaqSection'
import AdSlot from '../components/AdSlot'
import UnlockSteps from '../components/UnlockSteps'
import PasswordGate from '../components/PasswordGate'
import PasswordReveal from '../components/PasswordReveal'
import { passwordActive } from '../lib/password'
import { resolveUnlock } from '../lib/unlock'
import { PageSkeleton } from '../components/Skeleton'
import { formatCount } from '../data/mods'
import { useModsState } from '../lib/useMods'
import { usePostsState } from '../lib/usePosts'
import { postHref } from '../lib/useSearchItems'
import { useSettings } from '../lib/useSettings'
import { useAdUnits, useAutoUnits } from '../lib/useAds'
import { slugify } from '../lib/format'
import { supabase, supabaseConfigured } from '../lib/supabase'

export default function DetailPage({ type = 'app', savedIds, onToggleSave }) {
  const t = useT()
  const { items: mods, loading } = useModsState(), { items: posts } = usePostsState(), { slug } = useParams(), settings = useSettings()
  const mod = mods.find(m => m.slug === slug)
  const ctx = { gameSlug: mod ? slugify(mod.game) : '' }
  const all = useAdUnits('', ctx, { ignoreScope: true }), inContent = useAdUnits('blog_in_content', ctx), autoU = useAutoUnits()
  if (loading && !mod) return <PageSkeleton/>
  const base = type === 'game' ? '/games' : '/apps', label = type === 'game' ? 'Games' : 'Apps'
  if (mod && (mod.type || 'app') !== type) return <Navigate to={mod.href} replace/>
  if (!mod) return <div className="container not-found-inline"><h1>Not found</h1><p>This page may have moved or no longer exists.</p><Link className="button button-primary" to={base}>Browse {label.toLowerCase()}</Link></div>
  const related = mods.filter(m => m.id !== mod.id && m.type === mod.type && (m.game === mod.game || m.category === mod.category)).slice(0, 3)
  const guides = posts.filter(p => p.game_slug === mod.slug).sort((a, b) => (a.post_type === 'guide' ? 0 : 1) - (b.post_type === 'guide' ? 0 : 1)).slice(0, 4)
  const saved = savedIds.includes(mod.id)
  const wait = Number.isFinite(+settings.download_wait_seconds) ? +settings.download_wait_seconds : 30
  const pwOn = passwordActive(mod, settings), reveal = settings.password_reveal || (settings.password_show === false ? 'none' : 'scratch'), scratchWait = Number.isFinite(+settings.password_scratch_wait) ? +settings.password_scratch_wait : 10
  const unlock = pwOn ? [] : resolveUnlock(mod, settings)
  const trackDownload = () => { if (!supabaseConfigured) return; try { const k = `modexa-dl-${mod.slug}`; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1') } catch {} supabase.rpc('increment_mod_downloads', { p_slug: mod.slug }).then(() => {}) }
  const jsonLd = [
    { '@type': type === 'game' ? ['VideoGame', 'SoftwareApplication'] : 'SoftwareApplication', name: mod.title, applicationCategory: type === 'game' ? 'GameApplication' : 'MobileApplication', ...(type === 'game' ? { gamePlatform: mod.platform, genre: mod.category || undefined } : {}), operatingSystem: mod.platform, description: mod.short || undefined, image: mod.image || undefined, softwareVersion: mod.version || undefined, datePublished: mod.updated || undefined, author: { '@type': 'Person', name: mod.creator } },
    ...(mod.install?.length ? [{ '@type': 'HowTo', name: `How to install ${mod.title}`, step: mod.install.map((t, n) => ({ '@type': 'HowToStep', position: n + 1, text: String(t) })) }] : []),
  ]
  const crumbs = [{ label: t('Home'), to: '/' }, { label, to: base }, { label: mod.title }]
  const rows = [[t('Creator'), mod.creator], [t('Version'), mod.version], [t('Updated'), mod.updated], [t('Platform'), mod.platform], [t('Category'), mod.category]].filter(r => r[1])
  const body = mod.content || mod.description
  return <>
    <SEO i18n={{ kind: 'mod', key: mod.id, translated: mod._tr }} ogTitle={mod.og_title} ogDescription={mod.og_description} ogImage={mod.og_image} twitterCard={mod.twitter_card} fullTitle={mod.seo_title ? `${mod.seo_title} | Modexa` : `${mod.title}: ${label.slice(0, -1)} | Modexa`} description={mod.seo_description || mod.short || `${mod.title} on Modexa.`} noindex={mod.noindex} canonical={mod.canonical_url} image={mod.image} type="article" pageType="ItemPage" modified={mod.updated} breadcrumbs={crumbs} jsonLd={jsonLd} faqs={mod.faqs}/>
    <div className="detail-page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{crumbs.map((c, i) => <li key={c.label}>{i > 0 && <ChevronRight size={13} aria-hidden="true"/>}{c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>)}</ol></nav>
      <div className="detail-hero">
        <div className="detail-art"><SafeImg src={mod.image} alt={`${mod.title}`}/>{mod.category && <span className="detail-art-tag">{mod.category}</span>}</div>
        <div className="detail-summary">
          <h1>{mod.title}</h1>
          {mod.short && <p className="detail-lead">{mod.short}</p>}
          <div className="detail-game-line"><span className="game-mini-icon"><Monitor size={16}/></span><span>{mod.game && mod.game !== 'Uncategorized' && mod.game !== mod.title ? <>{t('For')} <strong>{mod.game}</strong> · </> : null}{mod.platform}</span></div>
          <div className="detail-stats"><div><Download size={16}/><span><b>{formatCount(mod.downloads)}</b><small>{t('Downloads')}</small></span></div>{mod.updated && <div><CalendarDays size={16}/><span><b>{mod.updated}</b><small>{t('Updated')}</small></span></div>}{mod.creator && <div><UserRound size={16}/><span><b>{mod.creator}</b><small>{t('Creator')}</small></span></div>}</div>
          {pwOn && <PasswordGate mod={mod} hint={settings.password_hint} showReveal={reveal === 'page'} scratch={reveal === 'scratch'} scratchWait={scratchWait} gameSlug={slugify(mod.game)}/>}
          <div className="detail-actions">
            {mod.downloadUrl && unlock.length > 0 && <a className="mx-btn mx-btn--green mx-btn--lg" href="#unlock"><Download size={18}/><span>{t('Download')}</span></a>}
            {mod.downloadUrl && !unlock.length && !pwOn && <a className="mx-btn mx-btn--green mx-btn--lg" href={mod.downloadUrl} data-wait={wait} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={trackDownload}><Download size={18}/><span>{t('Download')}</span></a>}
            <button className={`button ${saved ? 'button-saved' : 'button-outline'}`} onClick={() => onToggleSave(mod.id)}>{saved ? <Check size={17}/> : <Bookmark size={17}/>} {saved ? t('Saved') : t('Save')}</button>
            <ShareButton title={mod.title} text={mod.short}/>
          </div>
        </div>
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          {body ? <ContentHtml content={body} ads={all} inContent={inContent.length ? inContent : autoU} className="detail-body"/> : null}
          {mod.features?.length > 0 && <section className="detail-list"><h2>{t('Features')}</h2><ul>{mod.features.map(f => <li key={f}><Check size={16}/>{f}</li>)}</ul></section>}
          {mod.requirements?.length > 0 && <section className="detail-list"><h2>{t('Requirements')}</h2><ul>{mod.requirements.map(f => <li key={f}><Check size={16}/>{f}</li>)}</ul></section>}
          {mod.install?.length > 0 && <section className="detail-list"><h2>{t('How to install')}</h2><ol>{mod.install.map(s => <li key={s}>{s}</li>)}</ol></section>}
          {unlock.length > 0 && <UnlockSteps mod={mod} steps={unlock} finalPage={settings.unlock_final_page !== false} wait={wait} gameSlug={slugify(mod.game)} onDownload={trackDownload}/>}
          <FaqSection faqs={mod.faqs}/>
          {pwOn && reveal === 'page' && <PasswordReveal mod={mod} gameSlug={slugify(mod.game)} scratchWait={scratchWait}/>}
          {guides.length > 0 && <section className="detail-list related-guides"><h2>{t('Guides for')} {mod.title}</h2><ul>{guides.map(g => <li key={g.id}><Link to={postHref(g)}><strong>{g.title}</strong></Link>{g.excerpt ? <span> - {g.excerpt}</span> : null}</li>)}</ul></section>}
          <AdSlot placement="mod_bottom" gameSlug={slugify(mod.game)}/>
        </div>
        <aside className="detail-sidebar">
          <AdSlot placement="mod_sidebar" gameSlug={slugify(mod.game)}/>
          {rows.length > 0 && <div className="lst-card"><h3>{t('Details')}</h3>{rows.map(([k, v]) => <div className="lst-row" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>}
        </aside>
      </div>
      {related.length > 0 && <section className="related-section"><h2>{t('More like this')}</h2><div className="mods-grid">{related.map(m => <ModCard key={m.id} mod={m} saved={savedIds.includes(m.id)} onToggleSave={onToggleSave}/>)}</div></section>}
    </div>
  </>
}
export function LegacyModRedirect() {
  const { slug } = useParams(), { items, loading } = useModsState(), m = items.find(x => x.slug === slug)
  if (loading) return <PageSkeleton/>
  return <Navigate to={m ? m.href : '/apps'} replace/>
}
