import { Link } from 'react-router-dom'

// Tiny inline renderer for content strings: **bold**, [label](/internal), [label](https://external)
export default function RichText({ text = '' }) {
  const out = []; let rest = String(text), i = 0
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/
  while (rest) {
    const m = re.exec(rest)
    if (!m) { out.push(rest); break }
    if (m.index) out.push(rest.slice(0, m.index))
    const k = i++
    if (m[1]) out.push(<strong key={k}>{m[1]}</strong>)
    else if (m[3].startsWith('/')) out.push(<Link key={k} to={m[3]}>{m[2]}</Link>)
    else out.push(<a key={k} href={m[3]} target="_blank" rel="noopener noreferrer nofollow">{m[2]}</a>)
    rest = rest.slice(m.index + m[0].length)
  }
  return <>{out}</>
}
