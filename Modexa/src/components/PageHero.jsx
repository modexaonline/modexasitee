export default function PageHero({ eyebrow, title, description, children }) {
  return <section className="page-hero"><div className="container"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p>{children}</div></section>
}