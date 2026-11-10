import { useEffect, useRef, useState } from 'react'
import { Share2, Link2, Check } from 'lucide-react'
import { PUBLIC_SITE_URL } from '../lib/publicConfig'

export const siteOrigin = () => ((PUBLIC_SITE_URL || (typeof location !== 'undefined' ? location.origin : '')) + '').replace(/\/$/, '')
export const fullUrl = path => siteOrigin() + (String(path || '/').startsWith('/') ? path : '/' + path)
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true } catch {
    try { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok } catch { return false }
  }
}

// Share menu for any page: copy the link (https://modexa.online/blog/your-slug), WhatsApp, Facebook, X, Telegram, LinkedIn, Email, or the phone's own share sheet.
export default function ShareLinkButton({ path, title = '', small = true, label = 'Share', onNotice }) {
  const [open, setOpen] = useState(false), [copied, setCopied] = useState(false), box = useRef(null)
  const url = fullUrl(path), text = encodeURIComponent(title), u = encodeURIComponent(url)
  useEffect(() => {
    if (!open) return
    const off = e => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', off); return () => document.removeEventListener('mousedown', off)
  }, [open])
  const copy = async () => { const ok = await copyText(url); setCopied(ok); onNotice?.(ok ? `Link copied: ${url}` : 'Could not copy. Select the link and copy it by hand.'); setTimeout(() => setCopied(false), 1800) }
  const links = [['WhatsApp', `https://wa.me/?text=${text}%20${u}`], ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`], ['X (Twitter)', `https://twitter.com/intent/tweet?text=${text}&url=${u}`], ['Telegram', `https://t.me/share/url?url=${u}&text=${text}`], ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`], ['Email', `mailto:?subject=${text}&body=${u}`]]
  return <span className="adm-share" ref={box} style={{ position: 'relative', display: 'inline-block' }}>
    <button type="button" className={`adm-btn ${small ? 'sm' : ''}`} onClick={() => setOpen(v => !v)} aria-expanded={open}><Share2 size={14}/> {label}</button>
    {open && <div className="adm-share-menu" role="menu">
      <div className="adm-share-url"><input readOnly value={url} onFocus={e => e.target.select()} aria-label="Page link"/></div>
      <button type="button" className="adm-share-item" onClick={copy}>{copied ? <Check size={14}/> : <Link2 size={14}/>} {copied ? 'Copied' : 'Copy link'}</button>
      {links.map(([n, h]) => <a key={n} className="adm-share-item" href={h} target="_blank" rel="noopener noreferrer">{n}</a>)}
      {typeof navigator !== 'undefined' && navigator.share && <button type="button" className="adm-share-item" onClick={() => navigator.share({ title, url }).catch(() => {})}>More…</button>}
    </div>}
  </span>
}
