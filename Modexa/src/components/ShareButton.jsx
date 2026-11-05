import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export default function ShareButton({ title, text, className = 'button button-outline' }) {
  const [done, setDone] = useState(false)
  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) { await navigator.share({ title, text, url }); return }
      await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000)
    } catch { /* cancelled */ }
  }
  return <button type="button" className={className} onClick={share}>{done ? <Check size={16}/> : <Share2 size={16}/>} {done ? 'Link copied' : 'Share'}</button>
}
