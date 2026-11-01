import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import { mergeContent } from '../content/merge.js'

let cache = null, inflight = null
const listeners = new Set()
function load() {
  if (cache || inflight || !supabaseConfigured) return
  inflight = supabase.from('site_content').select('key,data,updated_at').then(({ data, error }) => {
    if (error) console.error('Modexa: could not load site content', error.message)
    const next = {}; (data || []).forEach(r => { next[r.key] = { ...(r.data || {}), __updated: r.updated_at } })
    cache = next; listeners.forEach(f => f(cache))
  })
}
export function useSiteContent() {
  const [c, setC] = useState(cache || {})
  useEffect(() => { listeners.add(setC); if (cache) setC(cache); load(); return () => { listeners.delete(setC) } }, [])
  return c
}
export function useHiddenPaths() { const c = useSiteContent(); return useMemo(() => (Array.isArray(c.visibility?.hidden) ? c.visibility.hidden : []), [c.visibility]) }
// true once the site settings have been fetched (so a hidden page is never flashed before it is hidden)
export function useContentReady() {
  const [r, setR] = useState(cache !== null || !supabaseConfigured)
  useEffect(() => { const f = () => setR(true); listeners.add(f); if (cache) setR(true); load(); return () => { listeners.delete(f) } }, [])
  return r
}
// Call after saving from admin so the public site updates instantly.
export function setContentCache(key, data) { cache = { ...(cache || {}) }; if (data) cache[key] = { ...data, __updated: new Date().toISOString() }; else delete cache[key]; listeners.forEach(f => f(cache)) }
export function usePageContent(key, defaults) {
  const c = useSiteContent()
  const merged = mergeContent(defaults, c[key])
  return { ...merged, __custom: Boolean(c[key]), __updated: c[key]?.__updated || '' }
}
