import { Plus } from 'lucide-react'
import RichText from './RichText'

export default function FaqSection({ faqs = [], title = 'Frequently asked questions', id = 'faq' }) {
  if (!faqs.length) return null
  return <section className="faq-section" id={id} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="prose-heading">{title}</h2>
    <div className="faq-list">{faqs.map(f => <details className="faq-item" key={f.q}><summary><span>{f.q}</span><Plus size={18} aria-hidden="true"/></summary><div className="faq-answer"><p><RichText text={f.a}/></p></div></details>)}</div>
  </section>
}
