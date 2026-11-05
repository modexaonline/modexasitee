import { Lightbulb } from 'lucide-react'
import RichText from './RichText'

// Answer-first summary (helps featured snippets, voice answers and AI assistants quote the page accurately).
export default function AnswerBox({ q, a }) {
  if (!q || !a) return null
  return <aside className="answer-box" aria-label="Quick answer"><span className="answer-icon"><Lightbulb size={18}/></span><div><b>{q}</b><p><RichText text={a}/></p></div></aside>
}
