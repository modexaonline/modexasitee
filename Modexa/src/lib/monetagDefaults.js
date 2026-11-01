// Your Monetag codes, built in. They are used automatically until you save your own list in Admin → Ads → Monetag.
// Format "smartlink" is not a script: it is your Monetag direct link, shown as “Advertisement” cards on every page and inside posts.
export const MONETAG_DIRECT_LINK = 'https://uplcm.com/4/12169598'

export const MONETAG_DEFAULTS = [
  { id: 'mt-push', format: 'push', on: true, code: '<script src="https://5gvci.com/act/files/tag.min.js?z=12169600" data-cfasync="false" async></script>' },
  { id: 'mt-inpage', format: 'inpage', on: true, code: `<script>(function(s){s.dataset.zone='12169599',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>` },
  { id: 'mt-vignette', format: 'vignette', on: true, code: `<script>(function(s){s.dataset.zone='12169597',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>` },
  { id: 'mt-popunder', format: 'popunder', on: true, code: `<script>(function(s){s.dataset.zone='12169594',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>` },
  { id: 'mt-multitag', format: 'multitag', on: true, code: '<script src="https://quge5.com/88/tag.min.js" data-zone="304526" async data-cfasync="false"></script>' },
  { id: 'mt-smartlink', format: 'smartlink', on: true, code: MONETAG_DIRECT_LINK },
]

// Short, honest copy for the automatic direct-link cards (rotated per page so they do not all look the same).
export const AUTO_AD_COPY = [
  { title: 'Recommended for you', text: 'Sponsored link · tap to explore' },
  { title: 'Today’s top offers', text: 'Sponsored · hand-picked deals' },
  { title: 'Check this out', text: 'Sponsored · opens in a new tab' },
  { title: 'Popular right now', text: 'Sponsored · see what others are opening' },
]
