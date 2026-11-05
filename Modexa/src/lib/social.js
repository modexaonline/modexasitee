export const SOCIAL_PRESETS = [
  { id: 'x', label: 'X / Twitter' }, { id: 'youtube', label: 'YouTube' }, { id: 'facebook', label: 'Facebook' }, { id: 'instagram', label: 'Instagram' },
  { id: 'telegram', label: 'Telegram' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'tiktok', label: 'TikTok' }, { id: 'discord', label: 'Discord' },
  { id: 'github', label: 'GitHub' }, { id: 'linkedin', label: 'LinkedIn' }, { id: 'email', label: 'Email' }, { id: 'website', label: 'Website / other' },
]
export function legacySocials(s) {
  return [s.twitter_url && { platform: 'x', label: 'X / Twitter', url: s.twitter_url }, s.youtube_url && { platform: 'youtube', label: 'YouTube', url: s.youtube_url }, s.discord_url && { platform: 'discord', label: 'Discord', url: s.discord_url }].filter(Boolean)
}
export function socialsOf(s) { return Array.isArray(s.social_links) && s.social_links.length ? s.social_links : legacySocials(s) }
