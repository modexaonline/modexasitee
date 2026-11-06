import { useEffect } from 'react'
import { useSettings } from '../lib/useSettings'

function upsertMeta(attribute, key, content) {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, key); document.head.appendChild(meta) }
  if (content) meta.setAttribute('content', content)
  else meta.removeAttribute('content')
}

// title: page title (without brand). breadcrumbs: [{label,to}]. faqs: [{q,a}] -> FAQPage schema. jsonLd: extra schema node(s).
export default function SEO({ title, fullTitle, description, noindex = false, canonical = '', image = '', type = 'website', ogTitle = '', ogDescription = '', ogImage = '', twitterCard = '', jsonLd = null, breadcrumbs = null, faqs = null, pageType = 'WebPage', modified = '' }) {
  const st = useSettings(), defaultOg = st.default_og_image || '', twitterUrl = st.twitter_url || ''
  useEffect(() => {
    const absUrl = u => { u = String(u || '').trim(); return !u ? '' : /^https?:\/\//i.test(u) ? u : u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? window.location.origin + u : '' }
    const DEFAULT_IMG = absUrl(defaultOg) || window.location.origin + '/og-default.png'
    image = absUrl(image)
    const finalTitle = fullTitle || (title ? `${title} | Modexa` : 'Modexa: Discover Game Mods, Custom Content & Guides')
    const summary = description || 'Discover game mods, custom content and practical modding guides on Modexa.'
    const origin = window.location.origin
    const url = canonical || origin + window.location.pathname
    document.title = finalTitle
    upsertMeta('name', 'description', summary)
    upsertMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1')
    // social share values: the page's own Social sharing fields → its normal title/description/cover → site default image
    const sTitle = ogTitle || finalTitle, sDesc = ogDescription || summary, sImg = absUrl(ogImage) || image || DEFAULT_IMG
    const card = twitterCard === 'summary' ? 'summary' : 'summary_large_image', handle = (String(twitterUrl).match(/(?:twitter|x)\.com\/@?([A-Za-z0-9_]{1,15})/) || [])[1]
    upsertMeta('property', 'og:site_name', 'Modexa'); upsertMeta('property', 'og:title', sTitle); upsertMeta('property', 'og:description', sDesc)
    upsertMeta('property', 'og:type', type); upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', sImg); upsertMeta('property', 'og:image:alt', sTitle); upsertMeta('property', 'og:locale', 'en_US')
    upsertMeta('name', 'twitter:card', card); upsertMeta('name', 'twitter:title', sTitle)
    upsertMeta('name', 'twitter:description', sDesc); upsertMeta('name', 'twitter:image', sImg)
    if (handle) upsertMeta('name', 'twitter:site', '@' + handle)
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
  }, [title, fullTitle, description, noindex, canonical, image, type, modified, defaultOg, ogTitle, ogDescription, ogImage, twitterCard, twitterUrl, JSON.stringify(jsonLd), JSON.stringify(breadcrumbs), JSON.stringify(faqs)])
  return null
}
