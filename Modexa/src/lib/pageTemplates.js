const uid = () => Math.random().toString(36).slice(2, 9)
const B = (type, data, style) => ({ id: uid(), type, data, ...(style ? { style } : {}) })

// Ready-made page layouts, like WordPress patterns. Everything is editable after choosing one.
export const PAGE_TEMPLATES = [
  { id: 'blank', name: 'Blank page', desc: 'Start from nothing and add your own sections.', make: () => [] },
  { id: 'landing', name: 'Landing page', desc: 'Hero, features, how it works and a call to action.', make: () => [
    B('hero', { title: 'Your headline goes here', subtitle: 'One clear sentence about what visitors get.', buttonLabel: 'Get started', buttonUrl: '/apps', image: '', align: 'center' }),
    B('features', { title: 'Why choose us', cols: 3, items: [{ icon: 'zap', title: 'Fast', text: 'Short description.' }, { icon: 'shield', title: 'Safe', text: 'Short description.' }, { icon: 'gift', title: 'Free', text: 'Short description.' }] }),
    B('steps', { title: 'How it works', items: [{ title: 'Pick an app or game', text: '' }, { title: 'Press download', text: '' }, { title: 'Install and enjoy', text: '' }] }, { bg: 'soft', pad: 'lg' }),
    B('cta', { title: 'Ready to start?', text: '', buttonLabel: 'Browse apps', buttonUrl: '/apps' }) ] },
  { id: 'download', name: 'Download center', desc: 'Latest apps and games with a safety note and FAQ.', make: () => [
    B('heading', { text: 'Download center', level: 'h1', align: 'center', sub: 'Our newest apps and games in one place.' }),
    B('notice', { kind: 'info', title: 'Good to know', text: 'Always back up your data before installing anything new.' }),
    B('listing', { kind: 'app', count: 6, title: 'Latest apps' }),
    B('listing', { kind: 'game', count: 6, title: 'Latest games' }),
    B('faq', { title: 'Frequently asked questions', items: [{ q: 'Are downloads free?', a: 'Yes.' }] }) ] },
  { id: 'about', name: 'About us', desc: 'Story, numbers and a team message.', make: () => [
    B('heading', { text: 'About us', level: 'h1', align: 'center', sub: 'Who we are and what we do.' }),
    B('imagetext', { image: '', title: 'Our story', text: 'Tell visitors how the site started.\n\nShare what you care about.', side: 'left', buttonLabel: '', buttonUrl: '' }),
    B('stats', { items: [{ value: '100+', label: 'Apps' }, { value: '50+', label: 'Games' }, { value: '24/7', label: 'Updates' }] }, { bg: 'green', pad: 'lg' }),
    B('cta', { title: 'Questions? Get in touch.', text: '', buttonLabel: 'Contact us', buttonUrl: '/contact' }) ] },
  { id: 'faq', name: 'FAQ page', desc: 'Heading with questions and answers.', make: () => [
    B('heading', { text: 'Frequently asked questions', level: 'h1', align: 'center', sub: '' }),
    B('faq', { title: '', items: [{ q: 'Question one?', a: 'Answer one.' }, { q: 'Question two?', a: 'Answer two.' }] }),
    B('cta', { title: 'Still need help?', text: '', buttonLabel: 'Contact us', buttonUrl: '/contact' }) ] },
  { id: 'contact', name: 'Contact page', desc: 'Short intro with the contact form.', make: () => [
    B('heading', { text: 'Contact us', level: 'h1', align: 'center', sub: 'We usually reply within a few days.' }),
    B('contact', { title: '' }) ] },
]
export const newBlockId = uid
