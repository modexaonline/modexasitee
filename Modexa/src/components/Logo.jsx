import { Gamepad2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSettings } from '../lib/useSettings'

export default function Logo({ compact = false }) {
  const s = useSettings()
  const name = (s.site_name || 'Modexa').toLowerCase()
  return (
    <Link to="/" className="brand" aria-label={`${s.site_name || 'Modexa'} home`}>
      {s.logo_url ? <img className="brand-logo" src={s.logo_url} alt="" height="37"/> : <span className="brand-mark"><Gamepad2 size={22} strokeWidth={2.2} /></span>}
      {!compact && <span className="brand-name">{name}<span>.</span></span>}
    </Link>
  )
}
