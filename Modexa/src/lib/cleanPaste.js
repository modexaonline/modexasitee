import { autoFormatText, escapeHtml, htmlToPlain } from './formatText'
// Cleans pasted HTML (Word, Google Docs, web pages, ChatGPT…) down to headings, paragraphs, lists, bold/italic, links, images, tables.
// Words are never changed; only formatting noise (fonts, colours, spans, divs) is dropped.
const BLOCK = /<(h2|h3|p|ul|ol|blockquote|table)\b/i
export function cleanPastedHtml(html, plain = '') {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,style,meta,link,title,head,noscript,svg,button,form,input,select,textarea,iframe').forEach(n => n.remove())
  doc.querySelectorAll('[style*="display:none"],[hidden]').forEach(n => n.remove())
  const walk = node => {
    if (node.nodeType === 3) return escapeHtml(node.textContent.replace(/\s+/g, ' '))
    if (node.nodeType !== 1) return ''
    const t = node.tagName.toLowerCase(), inner = () => [...node.childNodes].map(walk).join('')
    const align = (node.style?.textAlign || '').match(/^(center|right|justify)$/)?.[1]
    switch (t) {
      case 'h1': case 'h2': { const x = inner().trim(); return x ? `<h2>${x}</h2>` : '' }
      case 'h3': case 'h4': case 'h5': case 'h6': { const x = inner().trim(); return x ? `<h3>${x}</h3>` : '' }
      case 'p': { const x = inner().trim(); return x ? `<p${align ? ` style="text-align:${align}"` : ''}>${x}</p>` : '' }
      case 'br': return '<br>'
      case 'ul': case 'ol': { const items = [...node.children].filter(c => c.tagName === 'LI').map(c => `<li>${[...c.childNodes].map(walk).join('').trim()}</li>`).join(''); return items ? `<${t}>${items}</${t}>` : '' }
      case 'blockquote': return `<blockquote>${inner().trim()}</blockquote>`
      case 'strong': case 'b': { const x = inner(); return /^\s*$/.test(x) ? x : (/font-weight:\s*(normal|400)/i.test(node.getAttribute('style') || '') ? x : `<strong>${x}</strong>`) }
      case 'em': case 'i': { const x = inner(); return /^\s*$/.test(x) ? x : `<em>${x}</em>` }
      case 'u': return `<u>${inner()}</u>`
      case 'a': { const h = node.getAttribute('href') || ''; return /^(https?:|mailto:|\/)/i.test(h) ? `<a href="${escapeHtml(h)}">${inner()}</a>` : inner() }
      case 'img': { const src = node.getAttribute('src') || ''; return /^https?:/i.test(src) ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(node.getAttribute('alt') || '')}">` : '' }
      case 'table': { const rows = [...node.querySelectorAll('tr')].map(tr => `<tr>${[...tr.children].map(c => `<${c.tagName.toLowerCase() === 'th' ? 'th' : 'td'}>${[...c.childNodes].map(walk).join('').trim()}</${c.tagName.toLowerCase() === 'th' ? 'th' : 'td'}>`).join('')}</tr>`).join(''); return `<table><tbody>${rows}</tbody></table>` }
      case 'div': case 'section': case 'article': case 'main': case 'span': case 'font': case 'body': case 'html': case 'figure': case 'center': {
        const kids = [...node.childNodes], hasBlock = kids.some(k => k.nodeType === 1 && /^(P|H[1-6]|UL|OL|DIV|SECTION|ARTICLE|BLOCKQUOTE|TABLE|FIGURE)$/.test(k.tagName))
        if (t === 'span' || t === 'font' || !hasBlock && t !== 'div') return inner()
        if (hasBlock) return inner()
        const x = inner().trim(); return x ? `<p>${x}</p>` : ''   // a <div> that only holds text = one paragraph
      }
      default: return inner()
    }
  }
  let out = walk(doc.body).replace(/(<br>\s*){3,}/g, '<br><br>').replace(/<p>\s*<\/p>/g, '')
  // pure text pasted (no real structure) → smart formatting
  const text = htmlToPlain(out)
  const paragraphs = (out.match(/<p[ >]/g) || []).length, headings = (out.match(/<h[23]/g) || []).length
  if (!BLOCK.test(out) || (headings === 0 && paragraphs <= 2 && text.length > 500)) return autoFormatText(plain || text.replace(/\s+/g, ' '))
  return out
}
