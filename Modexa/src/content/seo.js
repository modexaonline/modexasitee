// Pure data. Used by React pages (SeoContent / FaqSection) and by scripts/prerender.mjs.
export const LISTING = {
  home: {
    path: '/', seoTitle: 'Modexa: Android Game Guides, Tips & Game Pages',
    description: 'Modexa is an Android game hub: clear game pages with version and requirements, step-by-step guides, tips and honest writing. Find your next game.',
    h1: 'Discover Android games.',
    answer: { q: 'What is Modexa?', a: 'Modexa is an independent hub for Android games. Every game page explains what the game is, its version, platform and requirements, and links to related guides and tips. Modexa does not host game files: download buttons open the original source.' },
    steps: [
      { t: 'Search or browse games', d: 'Find a game by name or category, or open a guide if you want tips before you play.' },
      { t: 'Read the game page', d: 'Check the summary, version, requirements, features and FAQs so you know what to expect.' },
      { t: 'Use the guides', d: 'Follow our step-by-step guides for setup, controls, settings and smarter play.' },
    ],
    values: [
      { t: 'Game-first', d: 'Every page is about one thing: helping you pick, set up and enjoy an Android game.' },
      { t: 'Clear, honest details', d: 'Version, platform, requirements and FAQs are shown up front, so you know what you are getting.' },
      { t: 'Guides that help', d: 'Plain-language guides with real steps, tips and internal links to the games they cover.' },
      { t: 'Safer by habit', d: 'We teach a simple routine: check the source, back up your data and install one thing at a time.' },
      { t: 'Works on every device', d: 'A fast, responsive experience on phones, tablets and desktops, with no account needed.' },
      { t: 'Independent', d: 'Written and maintained by an independent team that is not affiliated with game publishers.' },
    ],
    sections: [
      { id: 'what-is-modexa', h: 'What kind of games are on Modexa?', p: ['Modexa focuses on popular Android games: [driving and simulation](/guide) games, football and sports games, racing, pool and casual adventures. Each game has its own page with a summary, version, requirements and answers to common questions.', 'Browse the full list on the [Games page](/games) or start with a [guide](/guide) if you are new to a game.'] },
      { id: 'how-to-choose', h: 'How to choose a game that suits your phone', ul: ['Check the Android version and free storage listed on the game page.', 'Prefer a lighter game or lower graphics settings if your phone has 3 GB of RAM or less.', 'Read the FAQs on the game page before you install.', 'Install from the original source and keep your data backed up.'], p: ['Our [guide to making Android games run smoothly](/guide/fix-lag-android-games) covers settings that help on almost any phone.'] },
    ],
    faqs: [
      { q: 'Is Modexa free to use?', a: 'Yes. You can browse game pages and read guides without an account or payment.' },
      { q: 'Does Modexa host game downloads?', a: 'No. Download buttons open the original source page, so updates and licences stay with the creator or publisher.' },
      { q: 'Which games does Modexa cover?', a: 'Popular Android games such as racing, driving simulators, football and pool games. The Games page always shows what is currently listed.' },
      { q: 'Are the games safe to install?', a: 'No third-party file can be guaranteed safe. Install from the original source, back up your data, keep Play Protect on and never enter account passwords in unofficial tools.' },
      { q: 'Does Modexa have game guides?', a: 'Yes. The Guide section has step-by-step tips for popular games and general guides such as fixing lag, and each guide links to the games it covers.' },
      { q: 'Can I submit a game?', a: 'Yes. Use the Submit a Game page. Our team reviews every submission before it is published.' },
    ],
  },
  apps: {
    path: '/apps', seoTitle: 'Apps: Android Apps, Mods & Downloads | Modexa',
    description: 'Browse Android apps with clear details, version, requirements and simple downloads. Search, filter and find the app you need.',
    h1: 'Apps',
    answer: { q: 'How do I find the right app?', a: 'Search by name, pick a category chip, then open an app to read its details, version and requirements before you download. Newest and most downloaded sorting helps you decide quickly.' },
    sections: [
      { id: 'how-it-works', h: 'How Modexa app listings work', p: ['Every app page shows a short summary, the version, the platform and the creator, followed by a full description written for people. When a download button is available, it takes you to the original source after a short countdown.'] },
      { id: 'before-you-install', h: 'Before you install any app', ul: ['Check that the version and Android requirements match your phone.', 'Read the full description and the steps provided on the page.', 'Back up important data first.', 'Install one app at a time and test it.'] },
    ],
    faqs: [
      { q: 'Are the apps free to download?', a: 'Most are. Each listing shows its source, where you can check pricing and licence terms.' },
      { q: 'Why is there a short countdown before a download?', a: 'The countdown screen prepares your link and then redirects you automatically to the source.' },
      { q: 'How do I save an app for later?', a: 'Use the bookmark button on any card. Saved apps are kept in your browser.' },
    ],
  },
  games: {
    path: '/games', seoTitle: 'Android Games: Details, Versions & Guides | Modexa',
    description: 'Browse Android games with clear details, versions, requirements and FAQs. Search by name, filter by category and read guides for each game.',
    h1: 'Android Games',
    answer: { q: 'Where can I find Android games on Modexa?', a: 'This page lists every game on Modexa. Search by name, filter by category and open a game to see its summary, version, requirements, FAQs and related guides.' },
    sections: [
      { id: 'what-you-get', h: 'What you get on a game page', ul: ['A plain-language summary of the game.', 'Version, platform and requirements.', 'FAQs that answer common questions.', 'Links to related guides and similar games.'] },
      { id: 'game-types', h: 'Popular types of Android games', ul: ['Driving and parking simulators', 'Football and sports games', 'Racing and street-tuning games', 'Pool and casual multiplayer games', 'Open adventure and platform games'], p: ['New to a game? Start with the [guides](/guide), they link back to each game page.'] },
    ],
    faqs: [
      { q: 'Do you list Android games only?', a: 'Yes. Modexa is focused on Android games, and every page states the platform clearly.' },
      { q: 'Can I read a guide for a game?', a: 'Yes. Guides for popular games are in the [Guide section](/guide) and linked from the game page when available.' },
      { q: 'How do I know a game will run on my phone?', a: 'Compare the version and requirements on the game page with your Android version and free storage, and use lower graphics settings on older phones.' },
    ],
  },
  guide: {
    path: '/guide', seoTitle: 'Game Guides: Tips, How-To & Walkthroughs | Modexa',
    description: 'Step-by-step Android game guides: beginner tips, settings, controls and fixes for popular games, written in plain language.',
    h1: 'Game Guides',
    answer: { q: 'What are Modexa game guides?', a: 'Modexa guides are practical, step-by-step articles for Android games. They explain basics, settings, controls, tips and fixes, and link to the game pages they cover.' },
    sections: [{ id: 'topics', h: 'Topics we cover', ul: ['Beginner guides and first-day tips', 'Controls and graphics settings', 'Fixing lag, crashes and storage problems', 'Safer downloading and install habits'] }],
    faqs: [
      { q: 'Are the guides free?', a: 'Yes. All guides are free to read and need no account.' },
      { q: 'How often are new guides added?', a: 'New guides are added regularly. Check this page or the game pages for related guides.' },
    ],
  },
  blog: {
    path: '/blog', seoTitle: 'Gaming Blog: News, Updates & Stories | Modexa',
    description: 'News, updates and stories about Android games from the Modexa team: comparisons, lists and announcements.',
    h1: 'Gaming Blog',
    answer: { q: 'What will I find on the Modexa blog?', a: 'Short, readable posts about Android games: updates, comparisons, lists and announcements from Modexa.' },
    sections: [{ id: 'topics', h: 'What we write about', ul: ['New releases and updates', 'Game comparisons and lists', 'Announcements from Modexa'] }],
    faqs: [
      { q: 'What is the difference between the blog and the guides?', a: 'Guides are step-by-step help for playing and setting up a game. The blog has news, lists and opinion pieces.' },
    ],
  },
  search: {
    path: '/search', seoTitle: 'Search Game Mods', description: 'Search Modexa for mods by name, game, category or creator.', h1: 'Search mods',
    answer: { q: 'How does search work?', a: 'Type a mod name, game, category or creator. Results include any listing whose title, game, category, creator or summary contains your words.' },
    sections: [{ id: 'tips', h: 'Search tips', ul: ['Try the game name first, for example “Skyrim”.', 'Use short keywords such as “lighting” or “skins”.', 'Open Filters on the Explore page for more control.'] }],
    faqs: [],
  },
  saved: {
    path: '/saved', seoTitle: 'Saved Mods', description: 'Your saved Modexa mods, stored privately in this browser.', h1: 'Your saved mods',
    answer: { q: 'Where are my saved mods stored?', a: 'Saved mods are stored only in your browser on this device. They are not uploaded to a server and no account is required.' },
    sections: [{ id: 'tips', h: 'Good to know', ul: ['Clearing your browser data removes the list.', 'Saved mods do not sync between devices.', 'Remove an item any time with the bookmark button.'] }],
    faqs: [],
  },
  submit: {
    path: '/submit-mod', seoTitle: 'Submit a Game: Share Your Game with Players | Modexa',
    description: 'Submit a game to Modexa. Provide the original source link and a clear description; every submission is reviewed before publishing.',
    h1: 'Submit a game',
    answer: { q: 'How do I submit a game to Modexa?', a: 'Fill in the submission form with the game title, category, platform, your name, the original source link and a short description. Our team reviews every submission before it is published.' },
    sections: [
      { id: 'requirements', h: 'What you need', ul: ['A working link to the original page for the game.', 'A clear description of the game.', 'Confirmation that you own the work or have permission to share it.'] },
      { id: 'process', h: 'What happens next', ol: ['We check the source, description and rights.', 'We approve, ask for changes or decline.', 'Approved games are published with a link to the original page.'] },
    ],
    faqs: [
      { q: 'Does it cost anything to submit?', a: 'No. Submitting a game to Modexa is free.' },
      { q: 'Will you host my files?', a: 'No. Listings link to the original page so you stay in control of updates and licences.' },
      { q: 'How long does review take?', a: 'Usually a few business days, depending on volume.' },
    ],
  },
}

// Generated (still honest, non-fabricated) content for dynamic game / category pages.
export function gameContent(name, count = 0) {
  return {
    answer: { q: `How do I find ${name} mods?`, a: `This page lists the ${name} mods published on Modexa${count ? ` (${count} right now)` : ''}. Check each card’s version and platform, open the listing for requirements and installation notes, then download from the creator’s original page.` },
    sections: [
      { id: 'before-you-install', h: `Before installing ${name} mods`, ul: [`Confirm the mod supports your current version of ${name}.`, 'Read the requirements, some mods need a loader or framework first.', 'Back up your save files and, if possible, the game folder.', 'Install one mod at a time and test the game after each change.'] },
      { id: 'after-updates', h: `${name} updates and compatibility`, p: [`Game updates can change files that mods rely on. After ${name} is patched, check the creator’s page for a matching update before re-enabling a mod.`] },
    ],
    faqs: [
      { q: `Are ${name} mods safe?`, a: 'Mods from trusted creators on their original pages are usually fine, but no third-party file can be guaranteed. Back up saves and scan downloads before installing.' },
      { q: `How do I install a ${name} mod?`, a: 'Open the mod listing, follow its installation notes and the creator’s instructions, and test the game. Our blog has general step-by-step guides.' },
      { q: `Can I submit a ${name} game?`, a: 'Yes. Use the Submit a Game page and include your original source link.' },
    ],
  }
}
const CAT_INFO = {
  'Graphics & Visuals': 'Graphics and visual mods change lighting, textures, shaders and the overall look of a game. They can be demanding on hardware, so check requirements and start with lighter options if your device is modest.',
  'Gameplay': 'Gameplay mods change how a game plays, new mechanics, systems, difficulty or balance. Read the creator’s notes carefully, because they can affect saves and online eligibility.',
  'Characters & Skins': 'Character and skin mods add outfits, models and appearance options. They are usually cosmetic and easier to remove than deep gameplay changes.',
  'Maps & Worlds': 'Map and world mods add new locations, structures and landscapes. They are often large files, so check storage space and loading instructions.',
  'Vehicles': 'Vehicle mods add or replace cars, bikes, aircraft and boats. Make sure the vehicle matches your game version and any required frameworks.',
  'Tools & Utilities': 'Tools and utilities include editors, helpers and launchers that make modding easier. Download only from the original creator and keep them updated.',
  'Quality of Life': 'Quality-of-life mods improve interfaces, convenience and performance without changing the core experience. They are a great first step for new modders.',
}
export function categoryContent(name, count = 0) {
  const intro = CAT_INFO[name] || `${name} mods are grouped here so you can compare similar changes side by side.`
  return {
    answer: { q: `What are ${name} mods?`, a: intro },
    sections: [
      { id: 'how-to-choose', h: `Choosing ${name} mods`, ul: ['Match the mod to the exact game and version you play.', 'Read features and requirements before downloading.', 'Check the update date, recent updates usually mean better compatibility.', 'Use the creator’s original page for the latest files and notes.'], p: [count ? `There ${count === 1 ? 'is' : 'are'} ${count} published listing${count === 1 ? '' : 's'} in this category right now.` : 'New listings appear here as soon as they are published.'] },
    ],
    faqs: [
      { q: `Where can I find more ${name} mods?`, a: 'Use the Explore page filters or search by game. You can also submit your own mod for review.' },
      { q: 'How do I know a mod is compatible?', a: 'Compare the supported game version on the listing with your installed version, and read the creator’s notes.' },
    ],
  }
}
