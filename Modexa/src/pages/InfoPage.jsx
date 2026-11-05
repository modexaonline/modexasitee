import { Link, useLocation } from 'react-router-dom'
import { Mail, ArrowUpRight, FileText, ShieldCheck, Cookie, Scale, Users, HelpCircle, Info, Clock3 } from 'lucide-react'
import SEO from '../components/SEO'
import PageHero from '../components/PageHero'
import Breadcrumbs from '../components/Breadcrumbs'
import AnswerBox from '../components/AnswerBox'
import ContentSections from '../components/ContentSections'
import FaqSection from '../components/FaqSection'
import ContactForm from '../components/ContactForm'
import { PAGES, ADS_SECTIONS } from '../content/legal'
import { usePageContent } from '../lib/siteContent'
import { LEGAL_LINKS, SITE } from '../content/site'
import { useSettings } from '../lib/useSettings'

const ICONS = { about: Info, contact: Mail, privacy: ShieldCheck, terms: Scale, cookies: Cookie, copyright: FileText, guidelines: Users, faq: HelpCircle }
const LEGAL = ['privacy', 'terms', 'cookies', 'copyright']

export default function InfoPage() {
  const slug = useLocation().pathname.replace(/^\/+|\/+$/g, '').split('/')[0]
  const s = useSettings()
  const base = PAGES[slug] || PAGES.about
  const edited = usePageContent('page:' + base.slug, base)
  // When ads are enabled, the Privacy / Cookie policies automatically gain an "Advertising" section.
  const adsSection = s.ads_enabled ? ADS_SECTIONS[base.slug] : null
  const page = { ...edited, sections: [...(edited.sections || []), ...(adsSection && !(edited.sections || []).some(x => x.id === 'advertising') ? [adsSection] : [])] }
  const Icon = ICONS[page.slug] || FileText
  const crumbs = [{ label: 'Home', to: '/' }, { label: page.title, to: `/${page.slug}` }]
  const isForm = page.slug === 'contact' || page.slug === 'copyright'
  const toc = page.sections.map(x => ({ id: x.id, h: x.h })).concat(page.faqs?.length ? [{ id: 'faq', h: 'FAQ' }] : [])
  const updated = page.__updated ? new Date(page.__updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : SITE.updatedLabel
  const related = LEGAL_LINKS.filter(l => l.to !== `/${page.slug}`).slice(0, 6)
  return <>
    <SEO fullTitle={page.seoTitle} description={page.description} pageType={page.type} breadcrumbs={crumbs} faqs={page.faqs} modified={page.updated}/>
    <PageHero eyebrow={page.eyebrow} title={page.h1} description={page.description}>
      <div className="hero-meta"><span className="info-hero-icon"><Icon size={20}/></span><span><Clock3 size={14}/> Last updated {updated}</span></div>
    </PageHero>
    <section className="directory-section"><div className="container">
      <Breadcrumbs items={crumbs}/>
      <div className="info-page-layout">
        <article className="info-main prose">
          <>
            <AnswerBox {...page.answer}/>
            <ContentSections sections={page.sections} numbered={LEGAL.includes(page.slug)}/>
          </>
          {isForm && <section className="info-form-wrap" id="form"><h2 className="prose-heading">{page.slug === 'copyright' ? 'Send a copyright notice' : 'Send us a message'}</h2><ContactForm defaultKind={page.slug === 'copyright' ? 'copyright' : 'general'}/></section>}
          <FaqSection faqs={page.faqs}/>
        </article>
        <aside className="info-aside">
          {toc.length > 2 && <nav className="toc-card" aria-label="On this page"><b>On this page</b>{toc.map(t => <a key={t.id} href={`#${t.id}`}>{t.h}</a>)}</nav>}
          <div className="info-contact-card"><span className="aside-icon"><Icon size={20}/></span><h3>{page.slug === 'contact' && s.contact_email ? 'Prefer email?' : 'Need help?'}</h3>
            {page.slug === 'contact' && s.contact_email ? <><p>You can also write to us directly.</p><a className="text-link" href={`mailto:${s.contact_email}`}>{s.contact_email} <ArrowUpRight size={15}/></a></> : <><p>Our team replies to most messages within a few business days.</p><Link to="/contact" className="text-link">Contact us <ArrowUpRight size={15}/></Link></>}
          </div>
          <nav className="toc-card related-card" aria-label="Related pages"><b>More from Modexa</b>{related.map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}</nav>
        </aside>
      </div>
    </div></section>
  </>
}
