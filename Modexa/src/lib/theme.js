import { useEffect, useState } from 'react'
// Light / dark mode. The choice is saved in this browser (localStorage) and applied as <html data-theme="dark|light">.
// Default is light. index.html applies the saved choice before the page paints, so there is no white flash.
const KEY = 'modexa-theme'
export function getTheme() { try { const v = localStorage.getItem(KEY); if (v === 'dark' || v === 'light') return v } catch {} return 'light' }
export function applyTheme(t) {
  const r = document.documentElement; r.setAttribute('data-theme', t); r.style.colorScheme = t
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', t)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0b0d0c' : '#ffffff')
}
export function setTheme(t) { try { localStorage.setItem(KEY, t) } catch {} applyTheme(t); window.dispatchEvent(new Event('modexa-theme')) }
export function useTheme() {
  const [t, setT] = useState(getTheme)
  useEffect(() => { const on = () => setT(getTheme()); window.addEventListener('modexa-theme', on); window.addEventListener('storage', on); return () => { window.removeEventListener('modexa-theme', on); window.removeEventListener('storage', on) } }, [])
  return [t, v => setTheme(v || (t === 'dark' ? 'light' : 'dark'))]
}
