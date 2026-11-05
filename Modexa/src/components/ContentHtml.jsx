import { useMemo } from 'react'
import AdBlock from './AdBlock'
import AdUnit from './AdUnit'
import { buildParts } from '../lib/contentHtml'

// Public renderer for posts, apps, games and page text: HTML or legacy markdown; ad shortcodes, embeds and buttons all work.
export default function ContentHtml({ content, ads = [], inContent = [], adsOn = true, className = '' }) {
  const parts = useMemo(() => buildParts(content || '', { inContent: adsOn ? inContent : [] }), [content, adsOn, inContent.map(u => u.id).join(',')])
  return <div className={`mx-content ${className}`}>{parts.map((p, i) => {
    if (p.html) return <div key={i} className="mx-html" dangerouslySetInnerHTML={{ __html: p.html }}/>
    if (p.ad) { if (!adsOn) return null; const u = ads.find(x => x.slot_key === p.ad); return u ? <AdBlock key={i} units={[u]}/> : null }
    if (p.units) return <AdBlock key={i} units={p.units}/>
    if (p.embed) { if (!adsOn) return null; return <div key={i} className="ad-block"><AdUnit unit={{ id: 'embed-' + i, slot_key: 'embed', name: 'Embedded code', kind: 'script', render_mode: 'isolated', code: p.embed.code, size: p.embed.w ? 'custom' : 'responsive', custom_width: p.embed.w || 300, custom_height: p.embed.h || 250, label: '' }}/></div> }
    return null
  })}</div>
}
