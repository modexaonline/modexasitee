import { useEffect } from 'react'
import { useSettings } from '../lib/useSettings'
import { useLang, langInfo, splitPath, withLang, useEnabledLangs, useItemLangs } from '../lib/i18n'

function upsertMeta(attribute, key, content) {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, key); document.head.appendChild(meta) }
  if (content) meta.setAttribute('content', content)
  else meta.removeAttribute('content')
}

// title: page title (without brand). breadcrumbs: [{label,to}]. faqs: [{q,a}] -> FAQPage schema. jsonLd: extra schema node(s).
export default function SEO({ title, fullTitle, description, noindex = false, canonical = '', image = '', type = 'website', ogTitle = '', ogDescription = '', ogImage = '', twitterCard = '', i18n = null, jsonLd = null, breadcrumbs = null, faqs = null, pageType = 'WebPage', modified = '' }) {
  const st = useSettings(), defaultOg = st.default_og_image || '', twitterUrl = st.twitter_url || ''
  // international SEO: which languages exist for this page, and is the page being viewed a real translation?
  const lang = useLang(), enabled = useEnabledLangs(), itemLangs = useItemLangs(i18n?.kind, i18n?.key)
  const altCodes = (i18n && st.i18n_enabled) ? itemLangs.filter(c => enabled.some(l => l.code === c)) : []
  const translated = lang === 'en' ? true : Boolean(i18n && (i18n.translated !== undefined ? i18n.translated : altCodes.includes(lang)))
  useEffect(() => {
    const absUrl = u => { u = String(u || '').trim(); return !u ? '' : /^https?:\/\//i.test(u) ? u : u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? window.location.origin + u : '' }
    const DEFAULT_IMG = absUrl(defaultOg) || window.location.origin + '/og-default.png'
    image = absUrl(image)
    const finalTitle = fullTitle || (title ? `${title} | Modexa` : 'Modexa: Discover Game Mods, Custom Content & Guides')
    const summary = description || 'Discover game mods, custom content and practical modding guides on Modexa.'
    const origin = window.location.origin
    const L = langInfo(lang), basePath = splitPath(window.location.pathname).path, enUrl = origin + basePath
    // an untranslated page under /xx/ is a copy of the English page: keep it out of the index and point to the English original
    const noidx = noindex || (lang !== 'en' && !translated)
    const url = lang !== 'en' ? (translated ? origin + window.location.pathname : enUrl) : (canonical || origin + window.location.pathname)
    document.title = finalTitle
    upsertMeta('name', 'description', summary)
    upsertMeta('name', 'robots', noidx ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1')
    // social share values: the page's own Social sharing fields → its normal title/description/cover → site default image
    const sTitle = ogTitle || finalTitle, sDesc = ogDescription || summary, sImg = absUrl(ogImage) || image || DEFAULT_IMG
    const card = twitterCard === 'summary' ? 'summary' : 'summary_large_image', handle = (String(twitterUrl).match(/(?:twitter|x)\.com\/@?([A-Za-z0-9_]{1,15})/) || [])[1]
    upsertMeta('property', 'og:site_name', 'Modexa'); upsertMeta('property', 'og:title', sTitle); upsertMeta('property', 'og:description', sDesc)
    upsertMeta('property', 'og:type', type); upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', sImg); upsertMeta('property', 'og:image:alt', sTitle); upsertMeta('property', 'og:locale', L.locale)
    upsertMeta('name', 'twitter:card', card); upsertMeta('name', 'twitter:title', sTitle)
    upsertMeta('name', 'twitter:description', sDesc); upsertMeta('name', 'twitter:image', sImg)
    if (handle) upsertMeta('name', 'twitter:site', '@' + handle)
    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = url
    document.head.querySelectorAll('link[data-modexa-alt]').forEach(n => n.remove())
    if (altCodes.length && translated) {
      const mk = (code, href) => { const l = document.createElement('link'); l.rel = 'alternate'; l.hreflang = code; l.href = href; l.setAttribute('data-modexa-alt', '1'); document.head.appendChild(l) }
      for (const code of ['en', ...altCodes]) mk(code === 'en' ? 'en' : langInfo(code).hreflang, origin + withLang(basePath, code))
      mk('x-default', enUrl)
    }

    const graph = []
    graph.push({ '@type': pageType, '@id': url + '#webpage', url, name: finalTitle, description: summary, inLanguage: L.hreflang, isPartOf: { '@id': origin + '/#website' }, ...(modified ? { dateModified: modified } : {}), ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}) })
    if (breadcrumbs?.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.label, item: origin + (b.to || window.location.pathname) })) })
    if (faqs?.length) graph.push({ '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: String(f.a).replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g, '$1') } })) })
    if (jsonLd) (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).forEach(n => graph.push(n))
    let ld = document.head.querySelector('script[data-modexa-ld]')
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.setAttribute('data-modexa-ld', '1'); document.head.appendChild(ld) }
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    return () => { document.head.querySelector('script[data-modexa-ld]')?.remove(); document.head.querySelectorAll('link[data-modexa-alt]').forEach(n => n.remove()) }
  }, [lang, translated, altCodes.join(','), title, fullTitle, description, noindex, canonical, image, type, modified, defaultOg, ogTitle, ogDescription, ogImage, twitterCard, twitterUrl, JSON.stringify(jsonLd), JSON.stringify(breadcrumbs), JSON.stringify(faqs)])
  return null
}
