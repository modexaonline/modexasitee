import { useEffect } from 'react'

function upsertMeta(attribute, key, content) {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, key); document.head.appendChild(meta) }
  if (content) meta.setAttribute('content', content)
  else meta.removeAttribute('content')
}
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=85'

// title: page title (without brand). breadcrumbs: [{label,to}]. faqs: [{q,a}] -> FAQPage schema. jsonLd: extra schema node(s).
export default function SEO({ title, fullTitle, description, noindex = false, canonical = '', image = '', type = 'website', jsonLd = null, breadcrumbs = null, faqs = null, pageType = 'WebPage', modified = '' }) {
  useEffect(() => {
    const finalTitle = fullTitle || (title ? `${title} | Modexa` : 'Modexa: Discover Game Mods, Custom Content & Guides')
    const summary = description || 'Discover game mods, custom content and practical modding guides on Modexa.'
    const origin = window.location.origin
    const url = canonical || origin + window.location.pathname
    document.title = finalTitle
    upsertMeta('name', 'description', summary)
    upsertMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1')
    upsertMeta('property', 'og:title', finalTitle); upsertMeta('property', 'og:description', summary)
    upsertMeta('property', 'og:type', type); upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', image || DEFAULT_IMG); upsertMeta('property', 'og:locale', 'en_US')
    upsertMeta('name', 'twitter:card', 'summary_large_image'); upsertMeta('name', 'twitter:title', finalTitle)
    upsertMeta('name', 'twitter:description', summary); upsertMeta('name', 'twitter:image', image || DEFAULT_IMG)
    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = url

    const graph = []
    graph.push({ '@type': pageType, '@id': url + '#webpage', url, name: finalTitle, description: summary, inLanguage: 'en', isPartOf: { '@id': origin + '/#website' }, ...(modified ? { dateModified: modified } : {}), ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}) })
    if (breadcrumbs?.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.label, item: origin + (b.to || window.location.pathname) })) })
    if (faqs?.length) graph.push({ '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: String(f.a).replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g, '$1') } })) })
    if (jsonLd) (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).forEach(n => graph.push(n))
    let ld = document.head.querySelector('script[data-modexa-ld]')
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.setAttribute('data-modexa-ld', '1'); document.head.appendChild(ld) }
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    return () => { document.head.querySelector('script[data-modexa-ld]')?.remove() }
  }, [title, fullTitle, description, noindex, canonical, image, type, modified, JSON.stringify(jsonLd), JSON.stringify(breadcrumbs), JSON.stringify(faqs)])
  return null
}
