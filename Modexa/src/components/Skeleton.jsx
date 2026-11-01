export function CardSkeletons({ count = 3 }) {
  return <div className="mods-grid" aria-busy="true" aria-label="Loading">{Array.from({ length: count }).map((_, i) => <div className="skeleton-card" key={i}><div className="sk sk-img"/><div className="sk sk-line w60"/><div className="sk sk-line"/><div className="sk sk-line w80"/></div>)}</div>
}
export function PageSkeleton() {
  return <div className="container" style={{ padding: '60px 0' }} aria-busy="true"><div className="sk sk-line w40" style={{ height: 34 }}/><div className="sk sk-line w80" style={{ marginTop: 18 }}/><div className="sk sk-img" style={{ marginTop: 28, height: 280 }}/></div>
}
