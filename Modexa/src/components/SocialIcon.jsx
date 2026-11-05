import { Twitter, Youtube, Facebook, Instagram, Send, Linkedin, Github, Globe, MessageCircle, Music2, Phone, Mail } from 'lucide-react'
const MAP = { x: Twitter, youtube: Youtube, facebook: Facebook, instagram: Instagram, telegram: Send, whatsapp: Phone, tiktok: Music2, discord: MessageCircle, github: Github, linkedin: Linkedin, email: Mail, website: Globe }
export default function SocialIcon({ item, size = 16 }) {
  if (item.icon_url) return <img src={item.icon_url} alt="" width={size + 4} height={size + 4} loading="lazy" style={{ objectFit: 'contain', borderRadius: 4 }}/>
  const I = MAP[item.platform] || Globe; return <I size={size}/>
}
