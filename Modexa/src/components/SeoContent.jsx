import AnswerBox from './AnswerBox'
import ContentSections from './ContentSections'
import FaqSection from './FaqSection'

// Rich, crawlable content block placed under listing pages so they are never "thin".
export default function SeoContent({ data, heading }) {
  if (!data) return null
  return <section className="seo-content" aria-label="About this page"><div className="container">
    <div className="seo-content-inner">
      {heading && <h2 className="seo-content-title">{heading}</h2>}
      <AnswerBox {...data.answer}/>
      <ContentSections sections={data.sections}/>
      <FaqSection faqs={data.faqs}/>
    </div>
  </div></section>
}
