// Pure helper shared by the React app and the prerender script.
// Admin > Website editor stores edited fields in the `site_content` table; they override the built-in defaults.
export function mergeContent(defaults, override) {
  if (!override || typeof override !== 'object') return defaults
  const out = { ...defaults }
  for (const [k, v] of Object.entries(override)) { if (k.startsWith('__') || v === undefined || v === null) continue; out[k] = v }
  return out
}
export const NAV_DEFAULT = {
  header: [{ label: 'Apps', to: '/apps' }, { label: 'Games', to: '/games' }, { label: 'Guide', to: '/guide' }, { label: 'Blog', to: '/blog' }],
  footer: [
    { title: 'Explore', links: [{ label: 'Apps', to: '/apps' }, { label: 'Games', to: '/games' }, { label: 'Guide', to: '/guide' }, { label: 'Blog', to: '/blog' }] },
    { title: 'Community', links: [{ label: 'Submit a Game', to: '/submit-mod' }, { label: 'Community Guidelines', to: '/guidelines' }, { label: 'FAQ', to: '/faq' }, { label: 'About', to: '/about' }] },
    { title: 'Information', links: [{ label: 'Contact', to: '/contact' }, { label: 'Privacy Policy', to: '/privacy' }, { label: 'Terms of Use', to: '/terms' }, { label: 'Cookie Policy', to: '/cookies' }, { label: 'Copyright & DMCA', to: '/copyright' }] },
  ],
}
export const HOME_DEFAULT = {
  hero: { eyebrow: 'Android games, guides and tips', line1: 'Discover games.', line2: 'Play smarter.', description: 'Find Android games with clear details, step-by-step guides and honest tips, all in one place.', searchPlaceholder: 'Search games and guides...' },
  headings: { featured: { title: 'Featured', accent: 'apps', text: 'Standout apps worth a closer look.' }, games: { title: 'Popular', accent: 'games', text: 'Tap a game to see details, FAQs and guides.' }, categories: { title: 'Explore by', accent: 'category', text: 'Find exactly the kind of game you want.' }, how: { title: 'How Modexa', accent: 'works', text: 'Three steps from curiosity to a confident install.' }, why: { title: 'Built on', accent: 'trust and clarity', text: 'The principles behind every page.' } },
  cta: { title: 'Made a game? Share it with players.', text: 'Submit your game for review. It is free, credited and linked to your original page.', buttonText: 'Submit a game', buttonLink: '/submit-mod' },
}
