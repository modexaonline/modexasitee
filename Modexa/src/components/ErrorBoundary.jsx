import { Component } from 'react'

// Errors that mean "an old cached page is asking for a JS file that no longer exists" (happens after a new deploy).
const isChunkError = err => /dynamically imported module|Importing a module script failed|error loading dynamically|Failed to fetch dynamically|Unable to preload CSS|ChunkLoadError/i.test(String(err?.message || err))

export function reloadOnce() {
  try {
    const key = 'modexa-reloaded-at', last = Number(sessionStorage.getItem(key) || 0)
    if (Date.now() - last < 15000) return false
    sessionStorage.setItem(key, String(Date.now()))
  } catch {}
  window.location.reload()
  return true
}

export default class ErrorBoundary extends Component {
  state = { failed: false, message: '' }
  static getDerivedStateFromError(err) { return { failed: true, message: String(err?.message || err || '') } }
  componentDidUpdate(prev) { if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false, message: '' }) }
  componentDidCatch(err) {
    console.error('Modexa UI error:', err)
    if (isChunkError(err)) reloadOnce()
  }
  render() {
    if (!this.state.failed) return this.props.children
    const { fullscreen } = this.props
    const box = <div className={fullscreen ? 'admin-center' : 'container not-found-page'} style={fullscreen ? { padding: 24, textAlign: 'center' } : undefined}>
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 26, margin: '0 0 10px' }}>Something went wrong</h1>
        <p>{isChunkError(this.state.message) ? 'Site ka naya version aa gaya hai. Page reload karein.' : 'Page reload karke dobara try karein. Agar problem rahe to neeche wala error message screenshot karke bhej dein.'}</p>
        {this.state.message && <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: 12, fontSize: 12, color: '#b42318' }}>{this.state.message}</pre>}
        <button className="button button-primary" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>Reload page</button>
      </div>
    </div>
    return box
  }
}
