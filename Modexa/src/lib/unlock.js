// Download unlock steps: a short checklist (subscribe, join Telegram, view a sponsor…) shown before the download button.
export const STEP_TYPES = [
  { id: 'youtube_subscribe', label: 'Subscribe on YouTube', btn: 'Subscribe', wait: 8, platform: 'youtube' },
  { id: 'youtube_like', label: 'Like the video', btn: 'Open video', wait: 6, platform: 'youtube' },
  { id: 'youtube_comment', label: 'Comment on the video', btn: 'Open video', wait: 10, platform: 'youtube' },
  { id: 'telegram', label: 'Join our Telegram', btn: 'Join Telegram', wait: 6, platform: 'telegram' },
  { id: 'x', label: 'Follow on X', btn: 'Follow', wait: 6, platform: 'x' },
  { id: 'instagram', label: 'Follow on Instagram', btn: 'Follow', wait: 6, platform: 'instagram' },
  { id: 'discord', label: 'Join our Discord', btn: 'Join Discord', wait: 6, platform: 'discord' },
  { id: 'sponsored', label: 'Visit our sponsor', btn: 'View offer', wait: 10, platform: 'website', sponsored: true },
  { id: 'custom', label: 'Visit this page', btn: 'Open', wait: 6, platform: 'website' },
]
export const stepType = id => STEP_TYPES.find(t => t.id === id) || STEP_TYPES[STEP_TYPES.length - 1]
const isUrl = u => /^https:\/\/\S+$/i.test(String(u || '').trim())

export function detectType(url) {
  let h = '', p = ''
  try { const u = new URL(url); h = u.hostname.replace(/^www\./, '').toLowerCase(); p = u.pathname } catch { return 'custom' }
  if (h === 'youtu.be' || (/youtube\.com$/.test(h) && /^\/(watch|shorts|live)/.test(p))) return 'youtube_like'
  if (/youtube\.com$/.test(h)) return 'youtube_subscribe'
  if (h === 't.me' || /telegram\.(me|org)$/.test(h)) return 'telegram'
  if (h === 'x.com' || h === 'twitter.com') return 'x'
  if (/instagram\.com$/.test(h)) return 'instagram'
  if (h === 'discord.gg' || /discord\.com$/.test(h)) return 'discord'
  return 'custom'
}
export function makeStep(type, url = '') { const t = stepType(type); return { type: t.id, label: t.label, btn: t.btn, url, wait: t.wait } }

// Paste a pile of links (one per line, or a messy block) and get ready-made steps.
export function stepsFromLinks(text) {
  const urls = (String(text || '').match(/https?:\/\/[^\s<>"')]+/gi) || []).map(u => u.replace(/[.,;]+$/, ''))
  return [...new Set(urls)].filter(isUrl).map(u => makeStep(detectType(u), u))
}
export function cleanSteps(list) {
  return (Array.isArray(list) ? list : []).filter(s => s && isUrl(s.url)).map(s => {
    const t = stepType(s.type)
    return { type: t.id, label: String(s.label || t.label).trim().slice(0, 80), btn: String(s.btn || t.btn).trim().slice(0, 30), url: s.url.trim(), wait: Math.max(0, Math.min(60, Number(s.wait) || 0)) }
  })
}
export const hasBadStep = list => (Array.isArray(list) ? list : []).some(s => s && String(s.url || '').trim() && !isUrl(s.url))

// Which steps apply to this listing? [] means a direct download button.
export function resolveUnlock(mod, settings) {
  if (!mod?.downloadUrl) return []
  const mode = mod.unlockMode || 'default'
  if (mode === 'off') return []
  if (mode === 'custom') return cleanSteps(mod.unlockSteps)
  return settings?.unlock_enabled ? cleanSteps(settings.unlock_steps) : []
}
export const unlockKey = slug => `modexa-unlock-${slug}`
export function readProgress(slug) { try { return Math.max(0, parseInt(localStorage.getItem(unlockKey(slug)) || '0', 10) || 0) } catch { return 0 } }
export function writeProgress(slug, n) { try { n > 0 ? localStorage.setItem(unlockKey(slug), String(n)) : localStorage.removeItem(unlockKey(slug)) } catch {} }
