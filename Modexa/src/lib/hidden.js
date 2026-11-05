// Temporary page hiding (Admin → Website editor). Pure helpers, shared by the React app, admin and scripts/prerender.mjs.
// The hidden list lives in the `site_content` table under key `visibility` → { hidden: ['/apps', '/about', …] }.
// Hiding a listing section (/apps, /games, /guide, /blog) also hides every page inside it (/apps/<slug> …).
export const SECTION_PATHS = ['/apps', '/games', '/guide', '/blog']
export const norm = p => { const x = '/' + String(p || '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, ''); return x }
export function isPathHidden(list, path) {
  if (!Array.isArray(list) || !list.length) return false
  const p = norm(path)
  if (p === '/') return false
  return list.some(h => { const q = norm(h); return q !== '/' && (p === q || (SECTION_PATHS.includes(q) && p.startsWith(q + '/'))) })
}
export const hrefOfMod = m => (m.listing_type === 'game' || m.type === 'game' ? '/games/' : '/apps/') + m.slug
export const hrefOfPost = p => (p.post_type === 'guide' ? '/guide/' : '/blog/') + p.slug

// Home page blocks the admin can switch off (Admin → Website editor → Home page → "Show / hide sections").
// Saved as `hiddenSections: ['featured', …]` on the home row of site_content. `part: true` = a small piece inside a bigger section.
export const HOME_SECTIONS = [
  { k: 'hero', label: 'Hero (top banner with big heading and search)' },
  { k: 'hero_links', label: 'Browse links under the search box (Apps · Games · Guides)', part: true },
  { k: 'hero_visual', label: 'Hero picture with floating cards (right side)', part: true },
  { k: 'featured', label: 'Featured apps' },
  { k: 'games', label: 'Games section' },
  { k: 'creator', label: '“Built something awesome?” submit banner' },
  { k: 'how', label: '“How it works” steps' },
  { k: 'why', label: '“Why Modexa” cards' },
  { k: 'answer', label: 'Quick answer box', part: true },
  { k: 'content', label: 'Text sections (SEO content)', part: true },
  { k: 'faq', label: 'FAQs', part: true },
  { k: 'cta', label: 'Bottom call-to-action band' },
]
export const homeHidden = home => (Array.isArray(home?.hiddenSections) ? home.hiddenSections : [])
