import { useEffect } from 'react'

// Any link with data-wait="30" (listing Download button, buttons made in the editor) counts down ON THE BUTTON ITSELF
// ("Please wait 12s…"), then redirects automatically. No popup, no overlay, no blur, the page and its ads stay fully visible.
export default function DownloadGate() {
  useEffect(() => {
    const running = new Set()
    const onClick = e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
      const a = e.target.closest?.('a[data-wait]'); if (!a) return
      const href = a.getAttribute('href') || '', wait = parseInt(a.getAttribute('data-wait') || '0', 10)
      if (!/^https?:\/\//i.test(href) || !(wait > 0)) return
      e.preventDefault()
      if (running.has(a)) return // already counting down
      running.add(a)
      const tag = document.createElement('span'); tag.className = 'mx-wait'; tag.setAttribute('aria-live', 'polite')
      a.classList.add('is-waiting'); a.setAttribute('aria-disabled', 'true'); a.style.setProperty('--wait-pct', '0%'); a.appendChild(tag)
      let left = wait
      const paint = () => { tag.textContent = left > 0 ? `Please wait ${left}s…` : 'Redirecting…'; a.style.setProperty('--wait-pct', Math.round(((wait - left) / wait) * 100) + '%') }
      paint()
      const stop = () => { clearInterval(id); running.delete(a); tag.remove(); a.classList.remove('is-waiting'); a.removeAttribute('aria-disabled'); a.style.removeProperty('--wait-pct') }
      const id = setInterval(() => {
        if (!a.isConnected) return stop() // visitor navigated inside the site
        left -= 1; paint()
        if (left <= 0) { clearInterval(id); window.location.assign(href) }
      }, 1000)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}
