import RichText from './RichText'

export default function ContentSections({ sections = [], numbered = false, level = 2 }) {
  const H = `h${level}`
  return <>{sections.map((s, n) => <section className="prose-section" id={s.id} key={s.id}>
    <H className="prose-heading">{numbered && <span className="prose-num">{n + 1}</span>}{s.h}</H>
    {(s.p || []).map((t, i) => <p key={i}><RichText text={t}/></p>)}
    {s.ul && <ul>{s.ul.map((t, i) => <li key={i}><RichText text={t}/></li>)}</ul>}
    {s.ol && <ol>{s.ol.map((t, i) => <li key={i}><RichText text={t}/></li>)}</ol>}
    {s.table && <div className="table-scroll"><table className="data-table"><thead><tr>{s.table.head.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th scope="row" key={j}><code>{c}</code></th> : <td key={j} data-label={s.table.head[j]}>{c}</td>)}</tr>)}</tbody></table></div>}
    {s.note && <p className="prose-note"><RichText text={s.note}/></p>}
  </section>)}</>
}
