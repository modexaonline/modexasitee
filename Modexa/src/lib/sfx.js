// Tiny sound effects made with the Web Audio API (no audio files). Browsers only allow sound after a tap/click,
// so sfxInit() is called from the button that starts the scratch card.
let ctx = null, noise = null
const KEY = 'modexa-sfx'
export const sfxOn = () => { try { return localStorage.getItem(KEY) !== '0' } catch { return true } }
export const setSfx = on => { try { localStorage.setItem(KEY, on ? '1' : '0') } catch {} }
export function sfxInit() {
  try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; if (!ctx) ctx = new AC(); if (ctx.state === 'suspended') ctx.resume(); return ctx } catch { return null }
}
function noiseBuf(c) {
  if (noise && noise.sampleRate === c.sampleRate) return noise
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return (noise = b)
}
function blip(freq, at, dur, vol, type = 'sine') {
  const c = ctx; if (!c) return
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at
  o.type = type; o.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05)
}
export const tick = () => { if (sfxOn() && sfxInit()) blip(1200, 0, 0.05, 0.06) }
export const ready = () => { if (sfxOn() && sfxInit()) { blip(660, 0, 0.12, 0.08, 'triangle'); blip(990, 0.1, 0.18, 0.08, 'triangle') } }
export const chime = () => { if (sfxOn() && sfxInit()) { blip(784, 0, 0.5, 0.12, 'triangle'); blip(1175, 0.12, 0.55, 0.12, 'triangle'); blip(1568, 0.26, 0.8, 0.1, 'triangle') } }

// Spoken cue ("Please wait 30 seconds...") using the browser's built-in voice. Silent if the browser blocks it or sound is off.
export function speak(text) {
  try {
    if (!sfxOn() || !('speechSynthesis' in window)) return
    const syn = window.speechSynthesis; syn.cancel()
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.95; u.volume = 1
    syn.speak(u)
  } catch {}
}
export function stopSpeak() { try { window.speechSynthesis?.cancel() } catch {} }

// Scratch rasp: looped noise, louder and brighter the faster the finger moves.
export function createScratch() {
  let src = null, g = null, f = null
  const build = () => {
    const c = sfxInit(); if (!c || src) return !!src
    src = c.createBufferSource(); src.buffer = noiseBuf(c); src.loop = true
    f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.9
    g = c.createGain(); g.gain.value = 0
    src.connect(f).connect(g).connect(c.destination); src.start(); return true
  }
  return {
    move(speed) {                                          // speed in px per ms
      if (!sfxOn() || !build()) return
      const t = ctx.currentTime, s = Math.min(speed, 3), j = 0.75 + Math.random() * 0.5
      g.gain.setTargetAtTime(Math.min(0.24, (0.04 + s * 0.1) * j), t, 0.02)
      f.frequency.setTargetAtTime(1600 + s * 1000, t, 0.03)
    },
    stop() { if (g) g.gain.setTargetAtTime(0, ctx.currentTime, 0.05) },
    dispose() { try { src?.stop(); src?.disconnect(); g?.disconnect(); f?.disconnect() } catch {} src = g = f = null },
  }
}
