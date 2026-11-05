// Runs ad / embed code inside a container like a normal page would, including scripts that call document.write
// (Adsterra-style atOptions + invoke.js). Scripts run one after another; runs are serialised because document.write is patched while a script runs.
let chain = Promise.resolve()
export function postscribe(container, html, { timeout = 8000 } = {}) {
  const job = chain.then(() => run(container, html, timeout)).catch(() => {})
  chain = job
  return job
}
async function run(container, html, timeout) {
  if (!container.isConnected) return
  const tpl = document.createElement('template'); tpl.innerHTML = html
  await runNodes(container, [...tpl.content.childNodes], timeout)
}
async function runNodes(parent, nodes, timeout) {
  for (const n of nodes) {
    if (n.nodeType !== 1) { parent.appendChild(n.cloneNode(true)); continue }
    if (n.tagName === 'SCRIPT') { await runScript(parent, n, timeout); continue }
    const shell = n.cloneNode(false); parent.appendChild(shell)
    await runNodes(shell, [...n.childNodes], timeout)
  }
}
function runScript(parent, n, timeout) {
  return new Promise(resolve => {
    const realWrite = document.write, realWriteln = document.writeln, pending = []
    const s = document.createElement('script')
    for (const a of n.attributes) s.setAttribute(a.name, a.value)
    let done = false
    const finish = async () => {
      if (done) return; done = true
      document.write = realWrite; document.writeln = realWriteln
      if (pending.length) await runNodes(parent, pending, timeout)
      resolve()
    }
    const write = (...a) => { const t = document.createElement('template'); t.innerHTML = a.join(''); pending.push(...t.content.childNodes) }
    document.write = write; document.writeln = write
    try {
      if (n.getAttribute('src')) { s.async = false; s.onload = finish; s.onerror = finish; parent.appendChild(s); setTimeout(finish, timeout) }
      else { s.text = n.textContent; parent.appendChild(s); finish() }
    } catch { finish() }
  })
}
