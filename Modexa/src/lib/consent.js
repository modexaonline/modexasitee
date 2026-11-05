import { useEffect, useState } from 'react'
const KEY = 'modexa-consent'
export const getConsent = () => { try { return localStorage.getItem(KEY) || '' } catch { return '' } }
export function setConsent(v) { try { localStorage.setItem(KEY, v) } catch {} window.dispatchEvent(new Event('modexa-consent')) }
export function clearConsent() { try { localStorage.removeItem(KEY) } catch {} window.dispatchEvent(new Event('modexa-consent')) }
export const openConsent = () => window.dispatchEvent(new Event('modexa-open-consent'))
export function useConsent() {
  const [v, setV] = useState(getConsent())
  useEffect(() => { const on = () => setV(getConsent()); window.addEventListener('modexa-consent', on); window.addEventListener('storage', on); return () => { window.removeEventListener('modexa-consent', on); window.removeEventListener('storage', on) } }, [])
  return v
}
