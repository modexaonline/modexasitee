import AdUnit from './AdUnit'
export default function AdBlock({ units = [], className = '' }) {
  if (!units.length) return null
  return <div className={`ad-block ${className}`}>{units.map(u => <AdUnit key={u.id} unit={u}/>)}</div>
}
