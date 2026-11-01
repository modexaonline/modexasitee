// Admin login protection. Only these two accounts may sign in. (The database enforces the same list, so this is a second lock.)
export const ADMIN_EMAILS = ['cybersentinel23@gmail.com', 'hanzlaworkspace@gmail.com']
export const isAllowedAdmin = email => ADMIN_EMAILS.includes(String(email || '').trim().toLowerCase())

// Strict rate limit: 5 wrong attempts in 15 minutes locks login. Each further lockout is longer (15 min, 1 h, 6 h, 24 h).
// Stored in the browser, plus a small delay on every attempt, so it slows scripts and guessing.
const KEY = 'modexa-admin-guard', MAX_FAILS = 5, WINDOW = 15 * 60e3, LOCKS = [15 * 60e3, 60 * 60e3, 6 * 60 * 60e3, 24 * 60 * 60e3]
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }

export function lockRemainingMs() {
  const s = read(); return s.lockedUntil && s.lockedUntil > Date.now() ? s.lockedUntil - Date.now() : 0
}
export function recordFailure() {
  const now = Date.now(), s = read()
  const fails = (s.windowStart && now - s.windowStart < WINDOW ? (s.fails || 0) : 0) + 1
  const next = { fails, windowStart: fails === 1 ? now : s.windowStart, strikes: s.strikes || 0, lockedUntil: s.lockedUntil || 0 }
  if (fails >= MAX_FAILS) { next.lockedUntil = now + LOCKS[Math.min(next.strikes, LOCKS.length - 1)]; next.strikes += 1; next.fails = 0; next.windowStart = 0 }
  write(next); return next
}
export function recordSuccess() { write({}) }
export const attemptsLeft = () => { const s = read(); return Math.max(0, MAX_FAILS - (s.windowStart && Date.now() - s.windowStart < WINDOW ? (s.fails || 0) : 0)) }
export const fmtWait = ms => { const m = Math.ceil(ms / 60e3); return m >= 60 ? `${Math.ceil(m / 60)} hour${m > 60 ? 's' : ''}` : `${m} minute${m === 1 ? '' : 's'}` }
export const sleep = ms => new Promise(r => setTimeout(r, ms))
