import { useMemo } from 'react'
import { useModsState } from './useMods'
import { usePostsState } from './usePosts'
import { prepare } from './search'
import { htmlToPlain } from './formatText'
import { toHtml } from './contentHtml'

export const TYPE_LABEL = { app: 'App', game: 'Game', guide: 'Guide', blog: 'Blog' }
export const postHref = p => (p.post_type === 'guide' ? '/guide/' : '/blog/') + p.slug
export function useSearchItems() {
  const { items: mods, loading: ml } = useModsState(), { items: posts, loading: pl } = usePostsState()
  const items = useMemo(() => [
    ...mods.map(m => prepare({ id: 'm' + m.id, type: m.type, title: m.title, subtitle: m.short, game: m.game, category: m.category, href: m.href, image: m.image, text: htmlToPlain(toHtmlSafe(m.content || m.description)) })),
    ...posts.map(p => prepare({ id: 'p' + p.id, type: p.post_type === 'guide' ? 'guide' : 'blog', title: p.title, subtitle: p.excerpt, category: p.category, href: postHref(p), image: p.cover_image, text: htmlToPlain(toHtmlSafe(p.content)) })),
  ], [mods, posts])
  return { items, loading: ml || pl }
}
const toHtmlSafe = c => { try { return toHtml(c || '') } catch { return '' } }
