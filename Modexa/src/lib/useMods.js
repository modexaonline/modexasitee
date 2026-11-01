import { useEffect, useMemo, useState } from 'react'
import { useHiddenPaths } from './siteContent'
import { isPathHidden } from './hidden'
import { mods as rawDemo } from '../data/mods'
const demoMods = rawDemo.map(m => ({ ...m, type: 'app', content: '', href: '/apps/' + m.slug }))
import { supabase, supabaseConfigured } from './supabase'

export function normalize(row) {
  return {
    id: row.id, slug: row.slug, title: row.title, game: row.game || 'Uncategorized',
    category: row.category || 'Gameplay', platform: row.platform || 'PC', version: row.version || '',
    creator: row.creator || 'Community creator', updated: String(row.published_at || row.updated_at || row.created_at || '').slice(0, 10),
    downloads: Number(row.downloads || 0), image: row.cover_image || '', short: row.excerpt || '',
    description: row.description || row.content || row.excerpt || '', features: Array.isArray(row.features) ? row.features : [],
    requirements: Array.isArray(row.requirements) ? row.requirements : [], install: Array.isArray(row.install) ? row.install : [],
    featured: Boolean(row.featured), badge: row.badge || '', downloadUrl: row.download_url || '',
    passwordMode: row.password_mode || 'default', downloadPassword: row.download_password || '',
    unlockMode: row.unlock_mode || 'default', unlockSteps: Array.isArray(row.unlock_steps) ? row.unlock_steps : [],
    type: row.listing_type === 'game' ? 'game' : 'app', content: row.content || '', href: (row.listing_type === 'game' ? '/games/' : '/apps/') + row.slug,
    faqs: Array.isArray(row.faqs) ? row.faqs.filter(f => f && f.q && f.a) : [],
    seo_title: row.seo_title || '', seo_description: row.seo_description || '', canonical_url: row.canonical_url || '', noindex: Boolean(row.noindex),
  }
}

// One shared fetch for the whole app (no refetch on every page change).
let state = supabaseConfigured ? { items: [], loading: true, error: '' } : { items: demoMods, loading: false, error: '' }
let started = false
const listeners = new Set()
const emit = next => { state = next; listeners.forEach(fn => fn(state)) }

function load() {
  if (started || !supabaseConfigured) return
  started = true
  supabase.from('mods').select('*').eq('status', 'published').order('published_at', { ascending: false }).then(({ data, error }) => {
    if (error) { console.error('Modexa: could not load mods', error.message); emit({ items: [], loading: false, error: error.message }); return }
    emit({ items: (data || []).map(normalize), loading: false, error: '' })
  })
}

export function refreshMods() { started = false; if (supabaseConfigured) emit({ ...state, loading: true }); load() }

export function useModsState() {
  const [s, setS] = useState(state), hidden = useHiddenPaths()
  useEffect(() => { listeners.add(setS); setS(state); load(); return () => { listeners.delete(setS) } }, [])
  return useMemo(() => hidden.length ? { ...s, items: s.items.filter(m => !isPathHidden(hidden, m.href)) } : s, [s, hidden])
}

export default function useModsData() { return useModsState().items }
