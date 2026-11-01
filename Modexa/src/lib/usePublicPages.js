import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'

export default function usePublicPages(placement = 'show_in_footer') {
  const [pages, setPages] = useState([])
  useEffect(() => {
    if (!supabaseConfigured) return
    let active = true
    supabase.from('pages').select('title,slug,show_in_menu,show_in_footer').eq('status', 'published').eq(placement, true).order('title', { ascending: true }).then(({ data, error }) => {
      if (!active) return
      if (error) { console.error('Modexa: could not load navigation pages', error.message); return }
      setPages(data || [])
    })
    return () => { active = false }
  }, [placement])
  return pages
}
