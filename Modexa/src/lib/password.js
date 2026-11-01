// 4-digit download password gate. This is a flow, not security: the download link is public in the page data.
export const isPin = v => /^\d{4}$/.test(String(v || ''))
export function autoPassword(slug) {                       // stable per listing, so no one has to set it by hand
  let h = 2166136261; const s = 'modexa:' + String(slug || '')
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return String(1000 + (h % 9000))
}
export const passwordFor = mod => isPin(mod?.downloadPassword) ? mod.downloadPassword : autoPassword(mod?.slug)
export const passwordActive = (mod, settings) => Boolean(mod?.downloadUrl && settings?.password_enabled && mod.passwordMode !== 'off')
export const DEFAULT_HINT = 'The 4-digit password is shown in the “Download password” box lower down this page.'
const key = slug => `modexa-pw-${slug}`
export function grantAccess(slug) { try { sessionStorage.setItem(key(slug), '1') } catch {} }
export function hasAccess(slug) { try { return sessionStorage.getItem(key(slug)) === '1' } catch { return false } }
