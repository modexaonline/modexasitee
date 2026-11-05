import { useSiteContent } from './siteContent'
import { useSettings } from './useSettings'
import { useConsent } from './consent'
import { useAdsControl, consentOk } from './adsControl'

// Adsterra, saved by Admin → Ads manager → Adsterra in the existing `site_content` table under key `adsterra`:
//   { enabled: true, items: [{ id, format, code, on }] }
// Until you save your own list, the built-in codes below are used.
export const ADSTERRA_DEFAULTS = [
  { id: 'at-popunder', format: 'popunder', on: true, code: '<script data-cfasync="false" src="https://afders.org/1/7b59e7835738c3d8f535a426b874d96b"></script>' },
  { id: 'at-social', format: 'socialbar', on: true, code: '<script data-cfasync="false" src="https://bicea.org/14/503102231c2b2da1eb4f8ac3bbb96f3d"></script>' },
  { id: 'at-smartlink', format: 'smartlink', on: true, code: 'https://arwf.org/4/03cedba61da043e0a8a1e2f934b85a41' },
  { id: 'at-b728', format: 'banner728x90', on: true, code: `<script>\n  atOptions = {\n    'key' : '715be2ee930eae98b61403f0a4b521a9',\n    'format' : 'iframe',\n    'height' : 90,\n    'width' : 728,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/715be2ee930eae98b61403f0a4b521a9"></script>` },
  { id: 'at-b300', format: 'banner300x250', on: true, code: `<script>\n  atOptions = {\n    'key' : '407b9b95b6094f2fbec2c8a1494e091a',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/407b9b95b6094f2fbec2c8a1494e091a"></script>` },
  { id: 'at-b160', format: 'banner160x300', on: true, code: `<script>\n  atOptions = {\n    'key' : '9ad11074c21aae43a865f84db7408d70',\n    'format' : 'iframe',\n    'height' : 300,\n    'width' : 160,\n    'params' : {}\n  };\n</script>\n<script src="https://bicea.org/22/9ad11074c21aae43a865f84db7408d70"></script>` },
  { id: 'at-native', format: 'native', on: true, code: '<script async="async" data-cfasync="false" src="https://bicea.org/21/c911dacb229a74ee3eda927a5e1a8e6a"></script>\n<div id="container-c911dacb229a74ee3eda927a5e1a8e6a"></div>' },
]
export const ADSTERRA_FORMATS = [
  { id: 'popunder', label: 'Popunder', hint: 'Opens an ad in a new tab after a click. Loaded once, site-wide.' },
  { id: 'socialbar', label: 'Social bar', hint: 'Floating notification-style ad. Loaded once, site-wide.' },
  { id: 'smartlink', label: 'Direct link (Smartlink)', hint: 'Your Adsterra direct link (a URL, not a script). Shown automatically as “Advertisement” cards on every page and inside posts.' },
  { id: 'banner728x90', label: 'Banner 728×90', hint: 'Leaderboard. Placed automatically at the top of pages on desktop.' },
  { id: 'banner300x250', label: 'Banner 300×250', hint: 'Placed automatically inside posts, at the bottom of pages and at the end of articles.' },
  { id: 'banner160x300', label: 'Banner 160×300', hint: 'Placed automatically in the sidebar of app and game pages.' },
  { id: 'native', label: 'Native banner', hint: 'Widget with its container. Placed once inside posts and mod descriptions.' },
  { id: 'other', label: 'Other Adsterra script', hint: 'Any other Adsterra script. Loaded once, site-wide.' },
]
export const BANNER_SIZES = { banner728x90: [728, 90], banner300x250: [300, 250], banner160x300: [160, 300] }
const isUrl = v => /^https?:\/\/\S+$/i.test(String(v || '').trim())

export function adsterraItems(row) {
  const saved = Array.isArray(row?.items) ? row.items.filter(i => i && String(i.code || '').trim()) : []
  return (saved.length ? saved : ADSTERRA_DEFAULTS).filter(i => i.on !== false)
}

export function useAdsterra() {
  const c = useSiteContent(), ctl = useAdsControl(), consent = useConsent()
  const row = c.adsterra, enabled = ctl.ready && row?.enabled !== false
  const items = adsterraItems(row), scriptsOk = enabled && consentOk(ctl.scripts, consent), cardsOk = enabled && consentOk(ctl.cards, consent)
  const code = f => String(items.find(i => i.format === f)?.code || '').trim()
  const link = code('smartlink')
  return {
    enabled,
    scripts: scriptsOk ? items.filter(i => ['popunder', 'socialbar', 'other'].includes(i.format)).map(i => String(i.code).trim()) : [],
    link: cardsOk && isUrl(link) ? link : '',
    banners: scriptsOk ? { b728: code('banner728x90'), b300: code('banner300x250'), b160: code('banner160x300') } : {},
    native: scriptsOk ? code('native') : '',
  }
}

// Which networks are switched on (used by the cookie banner: it is needed only while some network is on).
export function useAdNetworksOn() {
  const s = useSettings(), c = useSiteContent()
  const monetag = s.monetag_enabled !== false, adsterra = c.adsterra?.enabled !== false, manual = Boolean(s.ads_enabled)
  return { monetag, adsterra, manual, any: monetag || adsterra || manual }
}
