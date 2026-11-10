import { Link, useNavigate } from '../lib/i18nRouter'
import { ArrowRight, ArrowUpRight, Search, Sparkles, ShieldCheck, Zap, Compass, TrendingUp, Clock3, Gamepad2, BadgeCheck, Layers3, Smartphone, UserCheck, Scale, FileSearch, Download } from 'lucide-react'
import SEO from '../components/SEO'
import AnswerBox from '../components/AnswerBox'
import ContentSections from '../components/ContentSections'
import FaqSection from '../components/FaqSection'
import { LISTING } from '../content/seo'
import { HOME_DEFAULT } from '../content/merge'
import { usePageContent, useHiddenPaths } from '../lib/siteContent'
import { isPathHidden, homeHidden } from '../lib/hidden'
import SearchBox from '../components/SearchBox'
import AdSlot from '../components/AdSlot'
import ModCard from '../components/ModCard'
import { games, categories, formatCount } from '../data/mods'
import { useModsState } from '../lib/useMods'
import SafeImg from '../components/SafeImg'
import { CardSkeletons } from '../components/Skeleton'
import { supabaseConfigured } from '../lib/supabase'
import { useState } from 'react'

const categoryIcons = ['◈', '✦', '◇', '⌘', '↗', '⚙', '◎']

export default function HomePage({ savedIds, onToggleSave }) {
  const { items: mods, loading } = useModsState()
  const navigate = useNavigate(), hp = useHiddenPaths(), show = p => !isPathHidden(hp, p)
  const [query, setQuery] = useState('')
  const apps = mods.filter(m => m.type !== 'game'), gameListings = mods.filter(m => m.type === 'game')
  const featured = (apps.filter(m => m.featured).length ? apps.filter(m => m.featured) : apps).slice(0, 3)
  const shownGames = (gameListings.filter(m => m.featured).length ? gameListings.filter(m => m.featured) : gameListings).slice(0, 4)
  const home = usePageContent('home', { ...LISTING.home, ...HOME_DEFAULT })
  const hs = homeHidden(home), on = k => !hs.includes(k)
  const quick = [['/apps', 'Apps'], ['/games', 'Games'], ['/guide', 'Guides']].filter(([p]) => show(p))
  return <>
    <SEO i18n={{ kind: 'content', key: 'home' }} fullTitle={home.seoTitle} description={home.description} faqs={home.faqs}/>
    {on('hero') && <section className="hero-section">
      <div className="hero-orb hero-orb-one"/><div className="hero-orb hero-orb-two"/>
      <div className="container hero-content">
        <div className="eyebrow"><span className="live-dot"/> {home.hero.eyebrow}</div>
        <h1>{home.hero.line1}<br/><span>{home.hero.line2}</span></h1>
        <p className="hero-description">{home.hero.description}</p>
        <SearchBox variant="hero" big placeholder={home.hero.searchPlaceholder}/>
        {on('hero_links') && quick.length > 0 && <div className="hero-quick-links"><span>Browse:</span>{quick.map(([p, l]) => <Link key={p} to={p}>{l}</Link>)}</div>}
      </div>
      {on('hero_visual') && <div className="hero-visual" aria-hidden="true">
        <div className="visual-backdrop"/>
        <div className="floating-label label-top"><Sparkles size={15}/> COMMUNITY PICKS</div>
        <div className="hero-feature-image"><SafeImg src={mods[0]?.image} fetchpriority="high"/></div>
        <div className="floating-card floating-card-top"><span className="mini-icon"><TrendingUp size={16}/></span><span><b>Fresh discoveries</b><small>Explore something new</small></span></div>
        <div className="floating-card floating-card-bottom"><span className="mini-icon cyan"><Gamepad2 size={16}/></span><span><b>Made for players</b><small>Find your next experience</small></span></div>
        <div className="visual-caption"><span className="caption-pip"/> APPS & GAMES, EVERY DAY</div>
      </div>}
    </section>}


    {on('featured') && show('/apps') && <section className="section-block"><div className="container">
      <div className="section-heading"><div><div className="eyebrow">HAND-PICKED DISCOVERIES</div><h2>{home.headings.featured.title} <span className="text-gradient">{home.headings.featured.accent}</span></h2><p>{home.headings.featured.text}</p></div>{show('/apps') && <Link className="text-link" to="/apps">All apps <ArrowRight size={16}/></Link>}</div>
      {loading ? <CardSkeletons/> : featured.length === 0 ? <div className="empty-state"><h3>New apps coming soon</h3><p>We are adding listings right now. Meanwhile, check out our guides.</p></div> : <div className="mods-grid">{featured.map(mod => <ModCard key={mod.id} mod={mod} saved={savedIds.includes(mod.id)} onToggleSave={onToggleSave}/>)}</div>}
    </div></section>}

    <div className="container"><AdSlot placement="home_middle"/></div>
    {on('games') && show('/games') && gameListings.length > 0 && <section className="section-block section-muted"><div className="container">
      <div className="section-heading"><div><div className="eyebrow">FIND YOUR WORLD</div><h2>{home.headings.games.title} <span className="text-gradient">{home.headings.games.accent}</span></h2><p>{home.headings.games.text}</p></div>{show('/games') && <Link className="text-link" to="/games">All games <ArrowRight size={16}/></Link>}</div>
      <div className="games-grid">{shownGames.map((game, i) => <Link to={game.href} className="game-card" key={game.id}><SafeImg src={game.image} loading="lazy"/><div className="game-overlay"/><div className="game-info"><span className="game-count">{game.platform}</span><h3>{game.title}</h3><span className="game-cta">Open <ArrowUpRight size={15}/></span></div><span className="game-index">0{i + 1}</span></Link>)}</div>
    </div></section>}



    {on('creator') && show('/submit-mod') && <section className="creator-banner"><div className="container creator-banner-inner"><div className="creator-art"><div className="creator-art-circle"/><Gamepad2 size={88} strokeWidth={1}/><span className="creator-spark spark-a">✦</span><span className="creator-spark spark-b">✧</span></div><div className="creator-copy"><div className="eyebrow">MADE BY THE COMMUNITY</div><h2>Made a game<br/><span className="text-gradient">worth playing?</span></h2><p>Give your game a place to be discovered. Share it with players who are looking for their next favorite game.</p><Link className="button button-primary" to="/submit-mod">Submit your game <ArrowRight size={17}/></Link></div><div className="banner-decoration">MODEXA<br/>CREATOR HUB</div></div></section>}

    {on('how') && <section className="section-block how-section"><div className="container">
      <div className="section-heading"><div><div className="eyebrow">SIMPLE BY DESIGN</div><h2>{home.headings.how.title} <span className="text-gradient">{home.headings.how.accent}</span></h2><p>{home.headings.how.text}</p></div></div>
      <ol className="steps-grid">{home.steps.map((s, i) => <li className="step-card" key={s.t}><span className="step-num">{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p></li>)}</ol>
    </div></section>}

    {on('why') && <section className="section-block section-muted"><div className="container">
      <div className="section-heading"><div><div className="eyebrow">WHY MODEXA</div><h2>{home.headings.why.title} <span className="text-gradient">{home.headings.why.accent}</span></h2><p>{home.headings.why.text}</p></div></div>
      <div className="value-grid">{home.values.map((v, i) => { const Icon = [UserCheck, FileSearch, BadgeCheck, ShieldCheck, Smartphone, Scale][i]; return <article className="value-card" key={v.t}><span className="value-icon"><Icon size={22}/></span><h3>{v.t}</h3><p>{v.d}</p></article> })}</div>
    </div></section>}

    {(on('answer') || on('content') || on('faq')) && <section className="seo-content"><div className="container"><div className="seo-content-inner">
      {on('answer') && <AnswerBox {...home.answer}/>}
      {on('content') && <ContentSections sections={home.sections}/>}
      {on('faq') && <FaqSection faqs={home.faqs}/>}
    </div></div></section>}

    {on('cta') && show(home.cta.buttonLink) && <section className="cta-band"><div className="container cta-inner">
      <div><h2>{home.cta.title}</h2><p>{home.cta.text}</p></div>
      <Link className="button button-primary" to={home.cta.buttonLink}>{home.cta.buttonText} <ArrowRight size={16}/></Link>
    </div></section>}
  </>
}