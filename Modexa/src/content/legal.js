import { SITE } from './site.js'
const U = SITE.updated

// Section = { id, h, p: [], ul: [], ol: [], table: { head, rows }, note }
// Inline markup in strings: **bold**, [text](/internal) , [text](https://external)
export const PAGES = {
  about: {
    slug: 'about', eyebrow: 'ABOUT MODEXA', title: 'About Modexa', h1: 'A clearer, safer way to discover game mods.',
    seoTitle: 'About Modexa: Independent Game Mod Discovery Hub',
    description: 'Learn what Modexa is, how listings are reviewed, how we credit creators, and the principles behind our independent game mod discovery site.',
    updated: U, type: 'AboutPage',
    answer: { q: 'What is Modexa?', a: 'Modexa is an independent website that helps players discover game mods, custom content and modding guides. Each listing explains what a mod does, who made it and which game and platform it targets, then links to the creator’s own page. Modexa is not affiliated with game publishers.' },
    sections: [
      { id: 'mission', h: 'Our mission', p: ['Finding a good mod usually means jumping between forums, video descriptions and scattered download pages. Modexa puts the essentials in one consistent place: what the mod changes, which game and version it supports, who created it and where the original source lives.', 'We want players to make informed choices and creators to be credited properly. That is why every listing is built around the original source rather than re-hosting someone else’s work.'] },
      { id: 'what-we-do', h: 'What Modexa does', ul: ['**Curated listings**, each mod has a plain-language summary, features, requirements and installation notes.', '**Browse your way**, explore [apps](/apps) and [games](/games), or read our [guides](/guide) and [blog](/blog).', '**Practical guides**, our [guides](/guide) cover installation, settings and safer downloading.', '**Creator submissions**, creators can [submit a mod](/submit-mod) for review.'] },
      { id: 'how-listings-work', h: 'How listings are reviewed', p: ['Every submission goes through a manual review before anything is published. We check that the listing has a working source link, a clear description, an identified creator and an honest statement of what the mod does.', 'We do not host mod files ourselves. Download buttons open the creator’s original page, so updates, licences and permissions stay under the creator’s control. See our [Community Guidelines](/guidelines) for the full standard.'] },
      { id: 'creator-first', h: 'A creator-first approach', p: ['Mods are creative work. We always credit the creator by name, link to their original page, and remove listings quickly when a rights holder asks. If you believe a listing infringes your rights, follow the steps on our [Copyright & DMCA](/copyright) page.'] },
      { id: 'independence', h: 'Independence and transparency', p: ['Modexa is independent. Game names, logos and trademarks belong to their respective owners and are used only to describe compatibility. Any sponsored or affiliate relationship will be clearly labelled if it is ever introduced.', 'Some images and counts shown while the catalog is being built are illustrative. Live listings always show information supplied by the creator and reviewed by our team.'] },
      { id: 'safety', h: 'Our approach to safety', p: ['No third-party file can be guaranteed safe. We encourage players to back up saves, scan downloads, read the creator’s notes and install from original sources. Our [guide on safer mod discovery](/blog) explains a simple checklist you can follow every time.'] },
      { id: 'contact', h: 'Get in touch', p: ['Questions, corrections or partnership ideas are welcome, visit our [Contact page](/contact).'] },
    ],
    faqs: [
      { q: 'Who runs Modexa?', a: 'Modexa is run by an independent editorial team that reviews listings and writes guides. You can reach the team through the Contact page.' },
      { q: 'Does Modexa host mod files?', a: 'No. Modexa links to the creator’s original page. Files stay with the creator, so updates and licences remain under their control.' },
      { q: 'Is Modexa free to use?', a: 'Yes. Browsing listings and reading guides is free and does not require an account.' },
    ],
  },

  contact: {
    slug: 'contact', eyebrow: 'CONTACT', title: 'Contact Modexa', h1: 'Let’s talk, questions, corrections and partnerships.',
    seoTitle: 'Contact Modexa: Support, Listings, Copyright & Business',
    description: 'Contact the Modexa team about a listing, a copyright concern, a creator submission or a business enquiry. Use the form for the fastest reply.',
    updated: U, type: 'ContactPage',
    answer: { q: 'How do I contact Modexa?', a: 'Use the contact form on this page and choose the topic that fits, general question, listing problem, copyright or business. Every message goes straight to the Modexa team, and we usually reply within two to three business days.' },
    sections: [
      { id: 'topics', h: 'What we can help with', ul: ['**General questions** about how Modexa works.', '**A problem with a listing**, a broken link, wrong game/version or missing credit.', '**Copyright or takedown requests**, see [Copyright & DMCA](/copyright) first for the details we need.', '**Creator support**, questions about [submitting a mod](/submit-mod).', '**Business and press**, partnerships, sponsorships and media enquiries.'] },
      { id: 'before-you-write', h: 'Before you write', p: ['Many answers are already published. Check the [FAQ](/faq), the [Community Guidelines](/guidelines) or the [blog](/blog). If your question is about a specific mod, include the link to the listing so we can find it quickly.'] },
      { id: 'response-times', h: 'Response times', p: ['We read every message. Typical replies arrive within two to three business days. Copyright and safety reports are prioritised and handled first.'] },
      { id: 'what-to-include', h: 'What to include in your message', ul: ['The **URL of the page or listing** you are writing about.', 'A clear description of the issue and what you expected to happen.', 'For copyright claims: the details listed on our [Copyright & DMCA](/copyright) page.', 'A valid email address so we can reply, we only use it to answer you.'] },
      { id: 'privacy', h: 'How we handle your message', p: ['Your name, email and message are stored securely and used only to respond to you. Read the [Privacy Policy](/privacy) for retention and your rights.'] },
    ],
    faqs: [
      { q: 'Can I get a mod removed from Modexa?', a: 'Yes. If you are the rights holder, send a copyright request with the listing URL and proof of ownership. We review these promptly.' },
      { q: 'Do you offer support for installing mods?', a: 'We publish installation guides on the blog, but we cannot provide one-to-one technical support for third-party files. Contact the mod creator for file-specific help.' },
    ],
  },

  privacy: {
    slug: 'privacy', eyebrow: 'LEGAL', title: 'Privacy Policy', h1: 'Privacy Policy',
    seoTitle: 'Privacy Policy: How Modexa Handles Your Data',
    description: 'Read how Modexa collects, uses, stores and protects personal data, which services process it, and how you can access or delete your information.',
    updated: U, type: 'WebPage',
    answer: { q: 'What data does Modexa collect?', a: 'Visitors can browse Modexa without an account. We only receive personal data you choose to send us, such as a contact message or a mod submission, plus basic technical logs created by our hosting providers. We do not sell personal data.' },
    sections: [
      { id: 'scope', h: 'Who we are and scope', p: ['This policy explains how Modexa (“Modexa”, “we”, “us”) handles personal data when you use this website. It applies to all pages on the site, including our forms. For questions about this policy, use the [Contact page](/contact).'] },
      { id: 'data-we-collect', h: 'Information we collect', p: ['**Information you give us**'], ul: ['**Contact messages:** your name, email address, topic, subject, message and an optional listing URL.', '**Mod submissions:** mod title, game, category, platform, creator name, source URL and description.'] },
      { id: 'automatic', h: 'Information collected automatically', ul: ['**Technical logs:** our hosting, content delivery and database providers may record IP address, browser type, device information, requested page and time of request for security and reliability.', '**Browser storage on your device:** the site stores a few small items in your browser, for example your saved mods list. See our [Cookie Policy](/cookies) for the complete list.'], p: ['We do not require visitors to create accounts, and we do not collect payment details, precise location or sensitive categories of personal data.'] },
      { id: 'how-we-use', h: 'How we use information', ul: ['To reply to your messages and support requests.', 'To review and moderate mod submissions and publish approved listings.', 'To investigate copyright, safety and abuse reports.', 'To keep the website secure, prevent spam and fix technical problems.', 'To improve content and usability using aggregated, non-identifying information.'] },
      { id: 'legal-bases', h: 'Legal bases (where GDPR or similar laws apply)', ul: ['**Consent**, when you submit a form and choose to send us information.', '**Legitimate interests**, running and securing the site, preventing abuse and improving our service.', '**Legal obligation**, handling lawful requests such as copyright notices.'] },
      { id: 'sharing', h: 'Who we share data with', p: ['We do not sell your personal data. We use trusted service providers (“processors”) that handle data only on our instructions:'], ul: ['**Supabase**, database, file storage and administrator authentication.', '**Our hosting / CDN provider**, serves the website and may keep technical logs.', '**Email or analytics providers**, only if and when we add them; this policy will be updated first.'], note: 'We may also disclose information when required by law, to protect our rights, or to prevent fraud and abuse.' },
      { id: 'retention', h: 'How long we keep data', p: ['We keep contact messages and submissions only as long as needed to respond, moderate and maintain a record of decisions, then delete or anonymise them. Technical logs are kept by our providers for short, security-focused periods. You can ask us to delete your messages at any time.'] },
      { id: 'transfers', h: 'International transfers', p: ['Our providers may process data in countries other than your own. Where required, we rely on appropriate safeguards such as standard contractual clauses offered by those providers.'] },
      { id: 'security', h: 'Security', p: ['Data is transmitted over HTTPS. Access to submissions and messages is limited to authorised administrators protected by authentication and database-level access rules. No online service can be completely secure, but we work to protect your information.'] },
      { id: 'rights', h: 'Your rights', p: ['Depending on where you live, you may have the right to:'], ul: ['access the personal data we hold about you;', 'correct inaccurate data or request deletion;', 'object to or restrict certain processing;', 'receive your data in a portable format;', 'withdraw consent at any time; and', 'lodge a complaint with your local data protection authority.'], note: 'Residents of California and other U.S. states with privacy laws may also request to know, delete or correct their data. We do not sell or share personal data for cross-context behavioural advertising. To exercise any right, contact us through the [Contact page](/contact).' },
      { id: 'children', h: 'Children’s privacy', p: ['Modexa is not directed to children under 13 (or under 16 where local law requires). We do not knowingly collect their personal data. If you believe a child has sent us information, contact us and we will delete it.'] },
      { id: 'third-party', h: 'Third-party links', p: ['Mod listings link to creator pages and other external sites. We do not control those sites and are not responsible for their privacy practices. Please read their policies before sharing information.'] },
      { id: 'changes', h: 'Changes to this policy', p: ['We may update this policy as the site evolves. The “last updated” date at the top shows the latest revision, and significant changes will be highlighted on the site.'] },
    ],
    faqs: [
      { q: 'Does Modexa sell my data?', a: 'No. Modexa does not sell personal data and does not share it for advertising purposes.' },
      { q: 'How do I delete my message or submission?', a: 'Contact us with the email address you used and we will delete the related records.' },
    ],
  },

  terms: {
    slug: 'terms', eyebrow: 'LEGAL', title: 'Terms of Use', h1: 'Terms of Use',
    seoTitle: 'Terms of Use: Rules for Using Modexa',
    description: 'The terms that apply when you browse Modexa, submit a mod or use third-party links, including acceptable use, content rights, disclaimers and limits of liability.',
    updated: U, type: 'WebPage',
    answer: { q: 'What are the key terms of using Modexa?', a: 'Modexa is a discovery directory. You may browse and share it for personal use, you must have the rights to anything you submit, and you download third-party files at your own risk because they come from independent creators and are not hosted or guaranteed by Modexa.' },
    sections: [
      { id: 'acceptance', h: 'Acceptance of these terms', p: ['By accessing or using Modexa you agree to these Terms of Use and our [Privacy Policy](/privacy) and [Cookie Policy](/cookies). If you do not agree, please do not use the site.'] },
      { id: 'service', h: 'What Modexa provides', p: ['Modexa is an independent directory of game mods, custom content and guides. We describe third-party content and link to the creator’s original source. We do not host, sell or distribute mod files, and we are not affiliated with game publishers or platform holders.'] },
      { id: 'eligibility', h: 'Eligibility', p: ['You must be old enough to form a binding agreement where you live, or have a parent or guardian’s permission. Some mods target mature audiences; check each creator’s notes and your game’s age rating.'] },
      { id: 'acceptable-use', h: 'Acceptable use', p: ['You agree not to:'], ul: ['break any law or infringe anyone’s rights;', 'upload or link malware, spyware, cheats that harm others, or deceptive files;', 'scrape, overload or attempt to disrupt the site;', 'submit false, misleading or spam content; or', 'attempt to access admin areas or data you are not authorised to use.'] },
      { id: 'submissions', h: 'Mod submissions and your content', p: ['When you submit a mod listing or message you confirm that the information is accurate and that you own the content or have permission to share it. You grant Modexa a non-exclusive, worldwide, royalty-free licence to display your listing information (title, summary, images you provide and links) on the site for as long as the listing is published.', 'We may edit for clarity, reject or remove any submission at our discretion, including for safety or rights concerns.'] },
      { id: 'third-party', h: 'Third-party mods and links', p: ['Mods are created by independent people and may change at any time. We cannot guarantee that a mod is safe, compatible, legal in your region or permitted by a game’s terms. Before installing, back up your saves, scan files and follow the creator’s instructions. Using mods may affect game stability or online-play eligibility, you do this at your own risk.'] },
      { id: 'intellectual-property', h: 'Intellectual property', p: ['Modexa’s design, text, logo and original guides are protected by copyright and trademark law. Game titles, logos and other marks belong to their owners and appear only to describe compatibility. Rights holders can request removal under our [Copyright & DMCA](/copyright) policy.'] },
      { id: 'disclaimer', h: 'Disclaimer of warranties', p: ['Modexa is provided “as is” and “as available”, without warranties of any kind, express or implied, including accuracy, availability, fitness for a particular purpose and non-infringement.'] },
      { id: 'liability', h: 'Limitation of liability', p: ['To the fullest extent permitted by law, Modexa and its team are not liable for indirect, incidental or consequential damages, including data loss, lost saves or device damage, arising from your use of the site or any third-party file. Nothing in these terms limits liability that cannot be limited by law.'] },
      { id: 'indemnity', h: 'Indemnity', p: ['You agree to indemnify Modexa against claims arising from content you submit or from your breach of these terms, to the extent permitted by law.'] },
      { id: 'termination', h: 'Removal and suspension', p: ['We may remove listings or restrict access to the site at any time, particularly for rights, safety or abuse reasons.'] },
      { id: 'law', h: 'Governing law and disputes', p: ['These terms are governed by the laws of the jurisdiction in which the Modexa operator is established, without regard to conflict-of-law rules. Mandatory consumer rights in your country of residence are not affected.'] },
      { id: 'changes', h: 'Changes to these terms', p: ['We may update these terms from time to time. Continued use of the site after an update means you accept the revised terms.'] },
      { id: 'contact', h: 'Contact', p: ['Questions about these terms? Reach us via the [Contact page](/contact).'] },
    ],
    faqs: [
      { q: 'Is it safe to download mods from Modexa links?', a: 'Modexa cannot guarantee any third-party file. Back up your saves, scan downloads and install only from the creator’s original source.' },
      { q: 'Who owns the mods listed on Modexa?', a: 'The creators. Modexa credits them and links to their original pages.' },
    ],
  },

  cookies: {
    slug: 'cookies', eyebrow: 'LEGAL', title: 'Cookie Policy', h1: 'Cookie Policy',
    seoTitle: 'Cookie Policy: Cookies & Local Storage on Modexa',
    description: 'See exactly which cookies and browser storage items Modexa uses, why they exist, how long they last and how to control or delete them.',
    updated: U, type: 'WebPage',
    answer: { q: 'Does Modexa use cookies?', a: 'Modexa does not use advertising or tracking cookies. It uses a few small browser-storage items, such as your saved mods list and a dismissed-notice flag, that make features work. Administrators who sign in also receive an authentication token.' },
    sections: [
      { id: 'what', h: 'What are cookies and local storage?', p: ['Cookies are small text files placed on your device by a website. Browsers also offer “local storage” and “session storage”, which work similarly but are kept in your browser and are not sent to the server on every request. For simplicity, this policy covers all of them.'] },
      { id: 'what-we-use', h: 'What Modexa uses today', p: ['The table lists every item currently used by the public website.'], table: { head: ['Name', 'Type', 'Purpose', 'Duration'], rows: [
        ['modexa-saved', 'Local storage', 'Remembers the mods you save in this browser.', 'Until you clear it'],
        ['modexa-cookie-notice', 'Local storage', 'Remembers that you dismissed the cookie notice.', 'Until you clear it'],
        ['modexa-ann', 'Session storage', 'Hides the announcement bar after you close it.', 'Browser session'],
        ['modexa-dl-*', 'Session storage', 'Prevents counting the same download click twice in one session.', 'Browser session'],
        ['modexa-contact-ts / modexa-submit-ts', 'Session storage', 'Short cooldown to reduce form spam.', 'Browser session'],
        ['sb-…-auth-token', 'Local storage', 'Keeps an administrator signed in. Not set for regular visitors.', 'Until sign-out'],
      ] } },
      { id: 'categories', h: 'Categories of cookies', ul: ['**Strictly necessary / functional:** items above that make features work. These do not require consent under most laws.', '**Analytics:** none at the moment. If we add privacy-friendly analytics, we will list it here and ask for consent where required.', '**Advertising / tracking:** none. Modexa does not use advertising cookies or sell your data.'] },
      { id: 'third-party', h: 'Third-party content', p: ['Fonts are served from our own domain. Listing images may load from image hosts chosen by creators or our storage provider, which can see standard request data such as your IP address. External links open sites with their own cookie policies.'] },
      { id: 'control', h: 'How to control or delete storage', ul: ['Use your browser settings to block or delete cookies and site data (Chrome, Edge, Safari, Firefox and others all provide this).', 'Clearing site data removes your saved mods list.', 'Blocking storage entirely may stop features such as “Save mod” from working.'] },
      { id: 'changes', h: 'Changes to this policy', p: ['If we add new cookies or analytics, this page will be updated first and, where required, you will be asked for consent. See also our [Privacy Policy](/privacy).'] },
    ],
    faqs: [
      { q: 'Do I need to accept cookies to use Modexa?', a: 'No. The site works without accepting anything because it uses only functional browser storage and no tracking cookies.' },
      { q: 'How do I remove my saved mods?', a: 'Clear site data for Modexa in your browser settings or remove each mod from the Saved page.' },
    ],
  },

  copyright: {
    slug: 'copyright', eyebrow: 'LEGAL', title: 'Copyright & DMCA', h1: 'Copyright & DMCA Policy',
    seoTitle: 'Copyright & DMCA Policy: Report Infringing Content',
    description: 'How rights holders can report copyright infringement on Modexa, what to include in a notice, how counter-notices work and how we treat repeat infringers.',
    updated: U, type: 'WebPage',
    answer: { q: 'How do I report copyright infringement on Modexa?', a: 'Send a notice through the Contact page (choose “Copyright / takedown”) that identifies the work, the listing URL, your contact details and a good-faith statement. We review notices promptly and remove content that infringes.' },
    sections: [
      { id: 'respect', h: 'Our position', p: ['Modexa respects creators and rights holders. Listings link to original sources and we do not host mod files. If you believe a listing, image or description infringes your rights, we want to hear from you.'] },
      { id: 'notice', h: 'How to submit a notice', p: ['Use the form on this page (or the [Contact page](/contact)) and include:'], ol: ['Your name, email address and, if applicable, your organisation.', 'A description of the copyrighted work you claim is infringed.', 'The exact URL(s) of the Modexa page(s) containing the material.', 'A statement that you have a good-faith belief the use is not authorised by the owner, its agent or the law.', 'A statement, under penalty of perjury, that the information is accurate and that you are the owner or authorised to act on the owner’s behalf.', 'Your physical or electronic signature (typing your full name is acceptable).'] },
      { id: 'our-response', h: 'What happens next', p: ['We acknowledge valid notices, remove or disable access to the material while we review, and may notify the person who submitted the listing. Incomplete notices may delay the process.'] },
      { id: 'counter-notice', h: 'Counter-notices', p: ['If you believe material was removed by mistake, contact us with the listing URL, a statement under penalty of perjury that you have a good-faith belief the removal was an error, and your contact details. We may restore the content unless the rights holder pursues legal action.'] },
      { id: 'repeat', h: 'Repeat infringers', p: ['We may suspend or block submitters who repeatedly infringe the rights of others.'] },
      { id: 'trademarks', h: 'Trademarks and game assets', p: ['Game titles, logos and artwork belong to their owners and are shown only to describe compatibility. If you believe a trademark is misused, report it using the same process.'] },
      { id: 'false-claims', h: 'False claims', p: ['Knowingly misrepresenting that content is infringing may have legal consequences. Please submit accurate notices only.'] },
    ],
    faqs: [
      { q: 'Do you host the files that were reported?', a: 'No. Modexa links to the creator’s source. We remove the listing; the creator’s own site is a separate matter.' },
    ],
  },

  guidelines: {
    slug: 'guidelines', eyebrow: 'COMMUNITY', title: 'Community Guidelines', h1: 'Community Guidelines for Mod Listings',
    seoTitle: 'Community Guidelines: Mod Listing Standards | Modexa',
    description: 'The standards every Modexa mod listing must meet: honest descriptions, original sources, creator credit, safety, and what content is not allowed.',
    updated: U, type: 'WebPage',
    answer: { q: 'What are Modexa’s listing standards?', a: 'A listing must be honest, credit its creator, link to the original source, state the supported game and version, and avoid malware, stolen work or illegal content. Submissions are reviewed manually before publishing.' },
    sections: [
      { id: 'principles', h: 'Core principles', ul: ['**Be honest.** Describe what the mod really does and any known issues.', '**Credit the creator.** Name the author and link to the original page.', '**Respect rights.** Only submit work you created or have permission to share.', '**Protect players.** No harmful files, deceptive downloads or hidden payloads.'] },
      { id: 'listing-requirements', h: 'What every listing needs', ul: ['A clear title and short summary.', 'The supported game, platform and version.', 'A working link to the creator’s original source.', 'Accurate requirements, features and installation notes.', 'Images you own or are allowed to use.'] },
      { id: 'not-allowed', h: 'What is not allowed', ul: ['Malware, spyware, credential stealers or obfuscated installers.', 'Re-uploads of other people’s work without permission.', 'Cheats or tools designed to harm other players in online games.', 'Illegal content, hate speech, harassment or sexual content involving minors.', 'Misleading claims such as “official”, “virus-free guaranteed” or fake download counts.'] },
      { id: 'review-process', h: 'How review works', ol: ['You submit the listing through the [Submit a Game](/submit-mod) form.', 'A team member checks the source link, description and rights.', 'We approve, request changes or decline. Approved listings are published.', 'You can ask for corrections or removal at any time via [Contact](/contact).'] },
      { id: 'safe-modding', h: 'A quick safe-modding checklist for players', ul: ['Back up your save files before installing anything.', 'Download only from the creator’s original page.', 'Read the version and requirements, mods break after game updates.', 'Scan files with up-to-date security software.', 'Install one mod at a time so problems are easy to trace.'] },
      { id: 'enforcement', h: 'Enforcement', p: ['We may edit, unpublish or remove listings that break these guidelines and block repeat offenders. Report a problem through the [Contact page](/contact).'] },
    ],
    faqs: [
      { q: 'How long does review take?', a: 'Most submissions are reviewed within a few business days, depending on volume and whether we need to ask for changes.' },
    ],
  },

  faq: {
    slug: 'faq', eyebrow: 'HELP CENTER', title: 'Frequently Asked Questions', h1: 'Frequently Asked Questions',
    seoTitle: 'FAQ: Game Mods, Safety & Using Modexa',
    description: 'Straight answers about game mods, safe downloading, installing, compatibility, submitting your own mod and how Modexa works.',
    updated: U, type: 'FAQPage',
    answer: { q: 'What can I find in the Modexa FAQ?', a: 'Quick answers about what mods are, whether they are safe, how to install and update them, why they sometimes break, and how creators can submit a listing.' },
    sections: [],
    faqs: [
      { q: 'What is a game mod?', a: 'A mod (short for modification) is a player-made change to a game. It can add visuals, characters, maps, tools or gameplay changes, and is usually installed on top of the original game.' },
      { q: 'Is Modexa affiliated with game publishers?', a: 'No. Modexa is independent. Game names and trademarks belong to their owners and are used only to describe compatibility.' },
      { q: 'Does Modexa host mod files?', a: 'No. Every listing links to the creator’s original page, so the creator controls updates, permissions and licences.' },
      { q: 'Are mods safe to download?', a: 'Mods from trusted creators on their original pages are generally safe, but no third-party file can be guaranteed. Back up your saves, scan downloads and read the creator’s notes before installing.' },
      { q: 'How do I install a mod?', a: 'Each listing includes installation notes. In general you download the file from the creator’s page, back up your game, follow the creator’s instructions and test the game. Our blog has step-by-step guides.' },
      { q: 'Why did a mod stop working after a game update?', a: 'Game updates change files and code that mods depend on. Check the creator’s page for a new version and make sure the listed game version matches yours.' },
      { q: 'Can mods get me banned in online games?', a: 'Some online games prohibit certain mods. Read the game’s terms and use mods in single-player or approved modes unless the publisher says otherwise.' },
      { q: 'Are mods free?', a: 'Many are free, but creators set their own terms. Modexa shows the creator’s link so you can see licensing and pricing there.' },
      { q: 'How do I submit my own mod?', a: 'Open the Submit a Game page, fill in the form with your original source link and description, and our team will review it before publishing.' },
      { q: 'How do I report a broken link or stolen work?', a: 'Use the Contact page and choose “Problem with a listing” or “Copyright / takedown”. Include the listing URL.' },
      { q: 'Does Modexa use cookies or track me?', a: 'Modexa uses only functional browser storage, for example to remember your saved mods. It does not use advertising or tracking cookies. See the Cookie Policy for the full list.' },
      { q: 'How can I save mods for later?', a: 'Use the bookmark button on any mod card. Saved mods are stored in your browser and appear on the Saved page.' },
    ],
  },
}
export const POLICY_SLUGS = ['about', 'contact', 'privacy', 'terms', 'cookies', 'copyright', 'guidelines', 'faq']

// Added automatically to the Privacy / Cookie pages when Admin > Site settings > "Ads enabled" is ON.
export const ADS_SECTIONS = {
  privacy: { id: 'advertising', h: 'Advertising', p: ['Modexa may show advertisements provided by third-party advertising partners. With your consent (where required), these partners may use cookies or similar technologies, and receive technical data such as your IP address and device information, to show, limit and measure ads and to prevent fraud.', 'We do not give advertising partners your name or message content. Ads are labelled, and links to sponsors use rel="sponsored". You can change your cookie choice at any time using “Cookie settings” in the footer. Each partner has its own privacy policy, please review it.'] },
  cookies: { id: 'advertising', h: 'Advertising cookies', p: ['When advertising is enabled, ad partners may place cookies or use local storage to show relevant ads, cap how often you see an ad, measure performance and detect invalid traffic. These items are loaded only after you choose “Accept all” in the cookie notice (where consent is required).'], ul: ['**Essential only:** no advertising cookies are loaded.', '**Accept all:** advertising partners may set cookies in addition to the essential items listed above.', 'You can change your choice any time via “Cookie settings” in the footer or by clearing site data in your browser.'] },
}
