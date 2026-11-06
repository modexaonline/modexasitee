import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://modexa.online').replace(/\/$/, '')
const siteUrl = () => ({ name: 'modexa-site-url', transformIndexHtml: { order: 'post', handler: html => html.split('__SITE_URL__').join(SITE) } })

export default defineConfig({
  plugins: [react(), siteUrl()],
  build: {
    target: 'es2020',
    cssMinify: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Long-lived vendor files are cached by the browser across deploys, so repeat visits download less.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/react-router|@remix-run/.test(id)) return 'router'
          if (/[\\/]react(-dom)?[\\/]|scheduler/.test(id)) return 'react'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('dompurify')) return 'purify'
        },
      },
    },
  },
})
