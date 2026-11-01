import { escapeHtml } from './formatText.js'
const I = {
  download: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.4 12h11l2-8H6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 016 0"/></svg>',
  gift: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v4H3zM12 9v12M5 13v8h14v-8M12 9S10 3 7.5 4.5 8 9 12 9zm0 0s2-6 4.5-4.5S16 9 12 9z"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6l6 6-6 6"/></svg>',
}
export const BUTTON_TEMPLATES = [
  { id: 'dl-green', name: 'Download: green', cls: 'mx-btn mx-btn--green', icon: 'download', label: 'Download' },
  { id: 'dl-blue', name: 'Download: blue', cls: 'mx-btn mx-btn--blue', icon: 'download', label: 'Download Now' },
  { id: 'dl-black', name: 'Free download: black', cls: 'mx-btn mx-btn--black', icon: 'download', label: 'Free Download' },
  { id: 'dl-outline', name: 'Download: outline', cls: 'mx-btn mx-btn--outline', icon: 'download', label: 'Download' },
  { id: 'install', name: 'Install: large', cls: 'mx-btn mx-btn--green mx-btn--lg', icon: 'bolt', label: 'Install Now' },
  { id: 'buy', name: 'Buy now: orange', cls: 'mx-btn mx-btn--orange', icon: 'cart', label: 'Buy Now' },
  { id: 'shop', name: 'Shop now: purple', cls: 'mx-btn mx-btn--purple', icon: 'bag', label: 'Shop Now' },
  { id: 'get', name: 'Get it: red', cls: 'mx-btn mx-btn--red', icon: 'gift', label: 'Get It Free' },
  { id: 'visit', name: 'Visit site: outline blue', cls: 'mx-btn mx-btn--blueoutline', icon: 'link', label: 'Visit Website' },
  { id: 'watch', name: 'Watch video', cls: 'mx-btn mx-btn--red', icon: 'play', label: 'Watch Video' },
  { id: 'block', name: 'Full width', cls: 'mx-btn mx-btn--green mx-btn--block mx-btn--lg', icon: 'download', label: 'Download for Android' },
  { id: 'pill', name: 'Pill: continue', cls: 'mx-btn mx-btn--pill', icon: 'arrow', label: 'Continue' },
  { id: 'text', name: 'Simple blue text link', cls: 'mx-link', icon: '', label: 'Download here' },
]
export const tplById = id => BUTTON_TEMPLATES.find(t => t.id === id) || BUTTON_TEMPLATES[0]
const REL = 'sponsored nofollow noopener noreferrer'
// Markup stored inside posts / listings. Clicking it opens the countdown screen (data-wait seconds) and then redirects.
export function buttonHtml({ tpl = 'dl-green', label, href, wait = 30, img = '', alt = '' }) {
  const t = tplById(tpl), url = escapeHtml(href), w = Math.max(0, Math.min(300, Number(wait) || 0))
  if (img) return `<p style="text-align:center"><a class="mx-btn-img" href="${url}" data-wait="${w}" target="_blank" rel="${REL}"><img src="${escapeHtml(img)}" alt="${escapeHtml(alt || label || 'Button')}"></a></p>`
  const inner = `${t.icon ? I[t.icon] : ''}<span>${escapeHtml(label || t.label)}</span>`
  return `<p style="text-align:center"><a class="${t.cls}" href="${url}" data-wait="${w}" target="_blank" rel="${REL}">${inner}</a></p>`
}
export const previewHtml = (tpl, label) => { const t = tplById(tpl); return `<span class="${t.cls}">${t.icon ? I[t.icon] : ''}<span>${escapeHtml(label || t.label)}</span></span>` }
