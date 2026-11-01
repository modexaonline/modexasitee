import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAdsDebug, detectAdBlock, disableAdsDebug } from '../lib/adsDebug'
import { useAdsRaw, useAdsAllowed } from '../lib/useAds'
import { useSettings } from '../lib/useSettings'
import { useConsent, setConsent } from '../lib/consent'

export default function AdsDebugPanel() {
  const on = useAdsDebug(), s = useSettings(), consent = useConsent(), allowed = useAdsAllowed(), raw = useAdsRaw()
  const [blocked, setBlocked] = useState(null), [open, setOpen] = useState(true), [tick, setTick] = useState(0)
  useEffect(() => { if (on) detectAdBlock().then(setBlocked) }, [on])
  useEffect(() => { if (!on) return; const t = setInterval(() => setTick(x => x + 1), 2000); return () => clearInterval(t) }, [on])
  if (!on || !open) return on ? <button className="ads-debug-open" onClick={() => setOpen(true)}>Ads debug</button> : null
  const injected = id => !!document.querySelector(`[data-modexa-global="${id}"]`)
  const row = (ok, text) => <li className={ok === true ? 'ok' : ok === false ? 'bad' : ''}><b>{ok === true ? '✓' : ok === false ? '✕' : '•'}</b> {text}</li>
  return <div className="ads-debug" role="dialog" aria-label="Ads debug">
    <div className="ads-debug-head"><b>Ads debug</b><span><button onClick={() => setOpen(false)} aria-label="Minimise">–</button><button onClick={disableAdsDebug} aria-label="Turn off"><X size={14}/></button></span></div>
    <ul>
      {row(!!s.ads_enabled, `Master switch (Admin → Site & brand / Ads manager): ${s.ads_enabled ? 'ON' : 'OFF, nothing will load'}`)}
      {row(!s.ads_require_consent || consent === 'all', `Cookie consent: ${s.ads_require_consent ? (consent === 'all' ? 'accepted' : consent === 'essential' ? 'visitor chose “Essential only”, ads blocked' : 'not chosen yet, ads blocked') : 'not required'}`)}
      {blocked === null ? row(null, 'Checking for an ad blocker…') : row(!blocked, blocked ? 'Ad blocker DETECTED in this browser, it blocks most ad networks. Test in a private window with extensions off.' : 'No ad blocker detected')}
      {row(raw.length > 0, `Active ads loaded from database: ${raw.length}`)}
    </ul>
    {!allowed && s.ads_enabled && s.ads_require_consent && consent !== 'all' && <button className="button button-primary button-small" onClick={() => setConsent('all')}>Accept cookies for this test</button>}
    <div className="ads-debug-list">{raw.map(u => <div key={u.id}><b>{u.name}</b><small>{u.kind} · {u.placement} · {u.render_mode === 'inline' ? 'inline' : u.render_mode === 'strict' ? 'strict' : 'frame'} · {u.devices}{['global_head', 'global_body'].includes(u.placement) ? ` · script ${injected(u.id) ? 'injected ✓' : 'NOT injected'}` : ''}</small></div>)}</div>
    <p className="ads-debug-tip">Blank slot with “✓ content loaded” missing usually means: the network has not approved this domain yet, there is no ad to serve (low fill), or an ad blocker blocked it. Pop-unders open only after a click and are limited to once per visitor per day.</p>
  </div>
}
