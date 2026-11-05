import { useState } from 'react'
import { X, Megaphone } from 'lucide-react'
import { useSettings } from '../lib/useSettings'

// where: 'top' (above header) | 'below_header' | 'bottom' (fixed at the bottom). Admin > Site & brand chooses the position.
export default function AnnouncementBar({ where = 'top' }) {
  const s = useSettings()
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem('modexa-ann') === s.announcement } catch { return false } })
  if (!s.announcement_active || !s.announcement || hidden || (s.announcement_position || 'top') !== where) return null
  const body = <><Megaphone size={15}/><span>{s.announcement}</span></>
  return <div className={`announcement-bar ann-${where}`} role="status">
    {s.announcement_link ? <a href={s.announcement_link} target={/^https?:/.test(s.announcement_link) ? '_blank' : undefined} rel="noopener noreferrer">{body}</a> : <div>{body}</div>}
    <button aria-label="Dismiss announcement" onClick={() => { try { sessionStorage.setItem('modexa-ann', s.announcement) } catch {} setHidden(true) }}><X size={15}/></button>
  </div>
}
