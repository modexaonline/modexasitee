// Shared by the public site and the admin Ads manager.
export const AD_SIZES = [
  { id: '300x250', label: 'Medium Rectangle', w: 300, h: 250, note: 'Best all-rounder (inside articles, sidebars)' },
  { id: '336x280', label: 'Large Rectangle', w: 336, h: 280, note: 'Big mobile/desktop in-content' },
  { id: '728x90', label: 'Leaderboard', w: 728, h: 90, note: 'Desktop top / bottom' },
  { id: '970x90', label: 'Large Leaderboard', w: 970, h: 90, note: 'Wide desktop header' },
  { id: '970x250', label: 'Billboard', w: 970, h: 250, note: 'Premium wide desktop' },
  { id: '468x60', label: 'Banner', w: 468, h: 60, note: 'Small desktop / tablet' },
  { id: '320x50', label: 'Mobile Banner', w: 320, h: 50, note: 'Standard phone banner / sticky' },
  { id: '320x100', label: 'Large Mobile Banner', w: 320, h: 100, note: 'Bigger phone banner' },
  { id: '300x600', label: 'Half Page', w: 300, h: 600, note: 'Tall sidebar' },
  { id: '160x600', label: 'Wide Skyscraper', w: 160, h: 600, note: 'Narrow sidebar' },
  { id: '300x50', label: 'Mobile Mini', w: 300, h: 50, note: 'Compact phone banner' },
  { id: '250x250', label: 'Square', w: 250, h: 250, note: 'Small square' },
  { id: '200x200', label: 'Small Square', w: 200, h: 200, note: 'Compact square' },
  { id: 'responsive', label: 'Responsive / Auto', w: 0, h: 0, note: 'Fills the width; set a height below' },
  { id: 'custom', label: 'Custom size', w: 0, h: 0, note: 'Enter any width × height' },
]
export const AD_KINDS = [
  { id: 'banner', label: 'Banner / display ad', code: true, global: false, help: 'Paste the banner code from your ad network (script or iframe). Choose its exact size below.' },
  { id: 'native', label: 'Native / widget ad', code: true, global: false, help: 'Paste the native or “recommended” widget code. Use Inline rendering if the network asks for it.' },
  { id: 'popunder', label: 'Pop-under / on-click script', code: true, global: true, help: 'Network script that opens a window on click. Loaded once per page, site-wide. Use sparingly: it hurts user experience.' },
  { id: 'social_bar', label: 'Social bar / floating script', code: true, global: true, help: 'Floating notification-style ad script. Loaded once per page, site-wide.' },
  { id: 'direct_link', label: 'Direct link (smartlink)', code: false, global: false, help: 'No code needed. Paste your direct/smart link and choose how it looks (button, card or text).' },
  { id: 'script', label: 'Custom HTML / JavaScript', code: true, global: false, help: 'Any HTML or script (for example Google AdSense, affiliate widgets, verification snippets).' },
]
export const AD_PLACEMENTS = [
  { id: 'blog_top', label: 'Blog: top of article', help: 'Right below the article title and cover image.' },
  { id: 'blog_in_content', label: 'Blog: inside the content', help: 'After paragraph N (and optionally repeated every N paragraphs).' },
  { id: 'blog_bottom', label: 'Blog: end of article', help: 'After the last paragraph.' },
  { id: 'mod_sidebar', label: 'Mod page: sidebar', help: 'Sidebar of every mod page.' },
  { id: 'mod_bottom', label: 'Mod page: bottom', help: 'Below mod details.' },
  { id: 'home_middle', label: 'Home: between sections', help: 'Between the featured mods and the games section.' },
  { id: 'sticky_bottom', label: 'Sticky footer bar (all pages)', help: 'A closable bar fixed to the bottom of the screen. Best with 320x50 or 728x90.' },
  { id: 'download_gate', label: 'Download steps & download page', help: 'Shown above the unlock steps and twice on the /download page, and on the countdown screen before a download button redirects. Great for 300×250 or 336×280.' },
  { id: 'global_head', label: 'Site-wide script (head)', help: 'Loaded on every public page, in <head>. For ad-network loaders.' },
  { id: 'global_body', label: 'Site-wide script (end of body)', help: 'Loaded on every public page, end of <body>. For pop-under and social bar scripts.' },
]
export const GLOBAL_PLACEMENTS = ['global_head', 'global_body']
export function unitDims(u) {
  if (u.size === 'custom') return { w: Number(u.custom_width) || 300, h: Number(u.custom_height) || 250, fluid: false }
  if (u.size === 'responsive') return { w: 0, h: Number(u.custom_height) || 250, fluid: true }
  const s = AD_SIZES.find(x => x.id === u.size)
  return { w: s?.w || 300, h: s?.h || 250, fluid: false }
}
export const slugKey = v => String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60)
