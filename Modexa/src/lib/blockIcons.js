import { Zap, Shield, Download, Star, Heart, Smartphone, Gamepad2, Gift, Check, Clock, Globe, Lock, Users, Trophy, Sparkles, Rocket } from 'lucide-react'
export const ICON_MAP = { zap: Zap, shield: Shield, download: Download, star: Star, heart: Heart, phone: Smartphone, game: Gamepad2, gift: Gift, check: Check, clock: Clock, globe: Globe, lock: Lock, users: Users, trophy: Trophy, sparkles: Sparkles, rocket: Rocket }
export const ICON_NAMES = Object.keys(ICON_MAP)

// Turns a YouTube / Vimeo / direct video link into something safe to embed. Returns null for anything else.
export function parseVideo(url = '') {
  let u; try { u = new URL(String(url).trim()) } catch { return null }
  if (u.protocol !== 'https:') return null
  const host = u.hostname.replace(/^www\./, ''), ok = id => /^[\w-]{6,20}$/.test(id || '') ? id : null
  if (host === 'youtu.be') { const id = ok(u.pathname.slice(1)); return id ? { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` } : null }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const id = ok(u.searchParams.get('v')) || ok((u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/) || [])[1])
    return id ? { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` } : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') { const id = (u.pathname.match(/(\d{5,12})/) || [])[1]; return id ? { type: 'iframe', src: `https://player.vimeo.com/video/${id}` } : null }
  if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return { type: 'video', src: u.href }
  return null
}
export const safeColor = c => /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : ''
export const safeUrl = u => /^https:\/\//i.test(u || '') ? String(u).replace(/["'()\\\s]/g, encodeURIComponent) : ''
export const safeClass = c => String(c || '').replace(/[^a-zA-Z0-9_ -]/g, '').trim().slice(0, 60)
export const safeAnchor = a => String(a || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)
