// Pure data (no JSX) so both the React app and the build-time prerender script can use it.
export const SITE = {
  name: 'Modexa',
  tagline: 'Discover Android games. Play smarter.',
  description: 'Modexa is an independent hub for Android games: clear game pages, step-by-step guides and tips. Every download button points to the original source.',
  updated: '2026-10-24',
  updatedLabel: 'October 24, 2026',
  locale: 'en',
}
export const NAV = [
  { to: '/apps', label: 'Apps' }, { to: '/games', label: 'Games' }, { to: '/guide', label: 'Guide' }, { to: '/blog', label: 'Blog' }, { to: '/submit-mod', label: 'Submit a Game' },
]
export const LEGAL_LINKS = [
  { to: '/about', label: 'About' }, { to: '/contact', label: 'Contact' }, { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Use' }, { to: '/cookies', label: 'Cookie Policy' }, { to: '/copyright', label: 'Copyright & DMCA' },
  { to: '/guidelines', label: 'Community Guidelines' }, { to: '/faq', label: 'FAQ' },
]
