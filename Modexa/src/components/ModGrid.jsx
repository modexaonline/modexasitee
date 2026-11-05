import ModCard from './ModCard'
import { CardSkeletons } from './Skeleton'
import { useModsState } from '../lib/useMods'
import { SearchX } from 'lucide-react'

export default function ModGrid({ mods, savedIds, onToggleSave }) {
  const { loading } = useModsState()
  if (loading && !mods.length) return <CardSkeletons count={6}/>
  if (!mods.length) return <div className="empty-state"><span className="empty-icon"><SearchX size={25}/></span><h3>No mods found</h3><p>Try another search or clear some filters to discover more.</p></div>
  return <div className="mods-grid">{mods.map(mod => <ModCard key={mod.id} mod={mod} saved={savedIds.includes(mod.id)} onToggleSave={onToggleSave}/>)}</div>
}
