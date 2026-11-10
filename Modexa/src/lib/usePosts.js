import { useEffect, useMemo, useState } from 'react'
import { useHiddenPaths } from './siteContent'
import { isPathHidden, hrefOfPost } from './hidden'
import { useLang, useTrMap, overlayPost } from './i18n'
import { supabase, supabaseConfigured } from './supabase'
import { demoPosts } from '../data/demoPosts'

let state = supabaseConfigured ? { items: [], loading: true } : { items: demoPosts, loading: false }
let started = false
const listeners = new Set()
const emit = next => { state = next; listeners.forEach(f => f(state)) }
function load() {
  if (started || !supabaseConfigured) return
  started = true
  supabase.from('posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).then(({ data, error }) => {
    if (error) console.error('Modexa: could not load posts', error.message)
    emit({ items: error ? [] : (data || []), loading: false })
  })
}
export function refreshPosts() { started = false; load() }
export function usePostsState() {
  const [s, setS] = useState(state), hidden = useHiddenPaths(), lang = useLang(), tr = useTrMap(lang)
  useEffect(() => { listeners.add(setS); setS(state); load(); return () => { listeners.delete(setS) } }, [])
  return useMemo(() => {
    let items = hidden.length ? s.items.filter(p => !isPathHidden(hidden, hrefOfPost(p))) : s.items
    if (lang !== 'en') items = items.map(p => overlayPost(p, tr?.['post:' + p.id]))
    return items === s.items ? s : { ...s, items }
  }, [s, hidden, lang, tr])
}
