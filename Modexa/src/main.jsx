import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'
import './polish.css'
import './theme.css'
import './content.css'
import './dark.generated.css'
import './dark.css'
import { reloadOnce } from './components/ErrorBoundary'

// After a new deploy, an old cached page may request JS files that no longer exist. Reload once to get the new version.
window.addEventListener('vite:preloadError', e => { e.preventDefault(); reloadOnce() })

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)