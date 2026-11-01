import { useEffect, useMemo, useRef, useState } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, Image as ImageIcon, MousePointerClick, Megaphone, Code2, Undo2, Redo2, RemoveFormatting, Wand2, Sparkles, Search, X, Upload, Type } from 'lucide-react'
import { toHtml, wrapEmbeds, embedHtml, guessSize, decodeCode } from '../lib/contentHtml'
import { autoFormatText, escapeHtml, wordCount } from '../lib/formatText'
import { cleanPastedHtml } from '../lib/cleanPaste'
import { aiFormatText } from '../lib/aiFormat'
import { BUTTON_TEMPLATES, buttonHtml, previewHtml } from '../lib/buttonTemplates'
import { uploadImage } from './fields'
import '../content.css'
import './admin-extra.css'

const decorate = (html, ads) => {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html')
  doc.body.querySelectorAll('.mx-ad').forEach(n => { const k = (n.getAttribute('data-ad') || '').toLowerCase(), u = ads.find(a => a.slot_key === k); n.setAttribute('contenteditable', 'false'); n.setAttribute('data-label', u ? `${u.name} · ${u.kind === 'direct_link' ? 'direct link' : u.kind === 'popunder' || u.kind === 'social_bar' ? 'site-wide script' : u.size}  [${k}]` : `${k}, ad not found (check Ads manager)`) })
  doc.body.querySelectorAll('.mx-embed').forEach(n => { const code = decodeCode(n.getAttribute('data-code')); n.setAttribute('contenteditable', 'false'); n.setAttribute('data-label', `Custom code · ${n.getAttribute('data-w') || 'auto'}×${n.getAttribute('data-h') || 250} · ${code.replace(/\s+/g, ' ').slice(0, 60)}…`) })
  return doc.body.innerHTML
}
const serialize = el => { const c = el.cloneNode(true); c.querySelectorAll('.mx-ad,.mx-embed').forEach(n => { n.innerHTML = ''; n.removeAttribute('contenteditable'); n.removeAttribute('data-label') }); return c.innerHTML.replace(/<div><br><\/div>/g, '').trim() }
const prettyHtml = h => h.replace(/(<\/(?:p|h2|h3|ul|ol|li|blockquote|table|div|figure)>)(?!\n)/g, '$1\n').replace(/(<(?:ul|ol)>)(?!\n)/g, '$1\n').trim()

export default function RichEditor({ value, onChange, ads = [], onError, onNotice, label = 'Content', waitDefault = 30, minHeight = 380 }) {
  const ref = useRef(null), taRef = useRef(null), sel = useRef(null), last = useRef(null), file = useRef(null)
  const [mode, setMode] = useState('compose'), [htmlText, setHtmlText] = useState(''), [dlg, setDlg] = useState(null), [auto, setAuto] = useState(true), [aiOn, setAiOn] = useState(true), [aiBusy, setAiBusy] = useState(false), [words, setWords] = useState(0)
  const [find, setFind] = useState(''), [repl, setRepl] = useState(''), [mc, setMc] = useState(false), [fr, setFr] = useState(false)
  const adsKey = ads.map(a => a.slot_key + a.name).join('|')

  // value -> compose (only when it changed from outside)
  useEffect(() => {
    if (mode !== 'compose' || !ref.current) return
    if (last.current === value) return
    ref.current.innerHTML = decorate(wrapEmbeds(toHtml(value || '')), ads); last.current = value; setWords(wordCount(value))
    try { document.execCommand('defaultParagraphSeparator', false, 'p') } catch {}
  }, [value, mode, adsKey])
  const emit = () => { if (!ref.current) return; const h = serialize(ref.current); last.current = h; onChange(h); setWords(wordCount(h)) }
  const saveSel = () => { const s = window.getSelection(); if (s && s.rangeCount && ref.current?.contains(s.anchorNode)) sel.current = s.getRangeAt(0).cloneRange() }
  const restore = () => { ref.current?.focus(); const s = window.getSelection(); if (sel.current) { s.removeAllRanges(); s.addRange(sel.current) } else { const r = document.createRange(); r.selectNodeContents(ref.current); r.collapse(false); s.removeAllRanges(); s.addRange(r) } }
  const exec = (cmd, val) => { restore(); document.execCommand(cmd, false, val); emit(); saveSel() }
  const insertHtml = html => { restore(); document.execCommand('insertHTML', false, html); setTimeout(() => { if (ref.current) { ref.current.innerHTML = decorate(ref.current.innerHTML, ads) } emit() }, 0) }
  const selectedText = () => (window.getSelection()?.toString() || '')

  function switchTo(m) {
    if (m === mode) return
    if (m === 'html') { const h = ref.current ? serialize(ref.current) : (value || ''); setHtmlText(prettyHtml(h)); setMode('html') }
    else { const norm = wrapEmbeds(htmlText); last.current = null; onChange(norm); setMode('compose') }
  }
  const onHtmlChange = v => { setHtmlText(v); onChange(v); setWords(wordCount(v)) }
  function onPaste(e) {
    const html = e.clipboardData.getData('text/html'), text = e.clipboardData.getData('text/plain')
    if (e.clipboardData.files?.length && e.clipboardData.files[0].type.startsWith('image/')) { e.preventDefault(); uploadImage(e.clipboardData.files[0]).then(u => insertHtml(`<p><img src="${u}" alt=""></p>`)).catch(er => onError?.(er.message)); return }
    e.preventDefault()
    let out
    if (!auto) out = text.split(/\n{2,}/).map(t => `<p>${escapeHtml(t.trim()).replace(/\n/g, '<br>')}</p>`).join('')
    else if (html && /<(h[1-6]|p|ul|ol|li|table|img|strong|b|em|a)\b/i.test(html)) out = cleanPastedHtml(html, text)
    else out = autoFormatText(text)
    if (auto && aiOn && text.trim().length >= 120 && !(html && /<h[1-6]\b/i.test(html))) {
      // Gemini adds headings / bullets / paragraphs (same words). Falls back to the built-in formatter on any problem.
      saveSel(); setAiBusy(true)
      aiFormatText(text).then(h => { insertHtml(h); onNotice?.('AI formatted your text, no words were changed.') })
        .catch(er => { insertHtml(out); onError?.(`AI format skipped: ${er.message} (normal formatting used)`) })
        .finally(() => setAiBusy(false))
      return
    }
    insertHtml(out)
  }
  async function aiFormatAll() {
    if (aiBusy) return
    const s = selectedText().trim()
    if (s.length > 20) { saveSel(); setAiBusy(true); try { insertHtml(await aiFormatText(s)); onNotice?.('Selection formatted by AI, no words were changed.') } catch (er) { onError?.(er.message) } setAiBusy(false); return }
    const el = ref.current; if (!el) return
    const blocks = [...el.children].filter(c => /^(P|DIV)$/.test(c.tagName) && !c.classList.contains('mx-ad') && !c.classList.contains('mx-embed') && !c.querySelector('img,a.mx-btn,a.mx-btn-img') && (c.textContent || '').trim().length > 200)
    if (!blocks.length) { onNotice?.('Nothing to format. Paste text, or select the part you want AI to structure.'); return }
    setAiBusy(true); let n = 0
    try {
      for (const c of blocks.slice(0, 12)) { const h = await aiFormatText(c.innerText || c.textContent); const t = document.createElement('template'); t.innerHTML = h; c.replaceWith(t.content); n++ }
      onNotice?.(`AI formatted ${n} block${n > 1 ? 's' : ''}, no words were changed.`)
    } catch (er) { onError?.(er.message) }
    emit(); setAiBusy(false)
  }
  function autoFormatAll() {
    const s = selectedText().trim()
    if (s.length > 20) { insertHtml(autoFormatText(s)); onNotice?.('Selection formatted, no words were changed.'); return }
    const el = ref.current; if (!el) return
    let n = 0
    ;[...el.children].forEach(c => { if (/^(P|DIV)$/.test(c.tagName) && !c.classList.contains('mx-ad') && !c.classList.contains('mx-embed') && !c.querySelector('img,a.mx-btn,a.mx-btn-img') && (c.textContent || '').trim().length > 350) { const t = document.createElement('template'); t.innerHTML = autoFormatText(c.innerText || c.textContent); c.replaceWith(t.content); n++ } })
    emit(); onNotice?.(n ? `Formatted ${n} long block${n > 1 ? 's' : ''} into headings and paragraphs, no words were changed.` : 'Nothing to format. Paste or select the text you want to tidy.')
  }
  // ---- find & replace (HTML view)
  const flags = mc ? 'g' : 'gi', esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = useMemo(() => find ? (htmlText.match(new RegExp(esc(find), flags)) || []).length : 0, [find, htmlText, mc])
  function findNext() {
    const ta = taRef.current; if (!ta || !find) return
    const hay = mc ? ta.value : ta.value.toLowerCase(), needle = mc ? find : find.toLowerCase()
    let i = hay.indexOf(needle, ta.selectionEnd); if (i < 0) i = hay.indexOf(needle, 0)
    if (i < 0) { onNotice?.('Not found.'); return }
    ta.focus(); ta.setSelectionRange(i, i + find.length)
    const lines = ta.value.slice(0, i).split('\n').length; ta.scrollTop = Math.max(0, (lines - 4) * 20)
  }
  function replaceOne() { const ta = taRef.current; if (!ta || !find) return; const cur = ta.value.slice(ta.selectionStart, ta.selectionEnd); if ((mc ? cur : cur.toLowerCase()) === (mc ? find : find.toLowerCase())) { const v = ta.value.slice(0, ta.selectionStart) + repl + ta.value.slice(ta.selectionEnd); onHtmlChange(v); setTimeout(() => { ta.setSelectionRange(0, 0); findNext() }, 0) } else findNext() }
  function replaceAll() { if (!find) return; const n = matches; onHtmlChange(htmlText.replace(new RegExp(esc(find), flags), () => repl)); onNotice?.(`Replaced ${n} match${n === 1 ? '' : 'es'}.`) }

  // ---- dialogs
  const openDlg = type => { saveSel(); setDlg({ type, text: type === 'link' ? selectedText() : '', url: '', alt: '', w: '100', align: 'center', tab: type === 'image' ? 'link' : 'tpl', tpl: 'dl-green', label: '', wait: waitDefault, img: '', code: '', cw: 0, ch: 250 }) }
  const D = (p) => setDlg(d => ({ ...d, ...p }))
  async function pickFile(e, forButton) { const f = e.target.files?.[0]; if (!f) return; D({ busy: true }); try { const u = await uploadImage(f); D(forButton ? { img: u, busy: false } : { url: u, busy: false }) } catch (er) { D({ busy: false }); onError?.(er.message) } e.target.value = '' }
  function confirmDlg() {
    const d = dlg
    if (d.type === 'link') { if (!/^(https?:\/\/|\/|mailto:)/i.test(d.url)) return onError?.('Link must start with https://'); insertHtml(`<a href="${escapeHtml(d.url)}"${/^https?:/.test(d.url) ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}>${escapeHtml(d.text || d.url)}</a>`) }
    if (d.type === 'image') { if (!/^https?:\/\//i.test(d.url)) return onError?.('Add an image link or upload a file first.'); insertHtml(`<p style="text-align:${d.align}"><img src="${escapeHtml(d.url)}" alt="${escapeHtml(d.alt)}" style="width:${d.w}%;max-width:100%"></p>`) }
    if (d.type === 'button') { if (!/^https?:\/\//i.test(d.url)) return onError?.('Button link must start with https://'); insertHtml(buttonHtml({ tpl: d.tpl, label: d.label, href: d.url, wait: d.wait, img: d.tab === 'img' ? d.img : '', alt: d.label })) }
    if (d.type === 'code') { if (!d.code.trim()) return onError?.('Paste your code first.'); const g = guessSize(d.code); insertHtml(embedHtml(d.code, +d.cw || g.w, +d.ch || g.h)) }
    setDlg(null)
  }
  const insertAd = key => { if (!key) return; insertHtml(`<div class="mx-ad" data-ad="${key}"></div><p><br></p>`) }
  const Btn = ({ onClick, title, children, active }) => <button type="button" title={title} aria-label={title} className={active ? 'on' : ''} onMouseDown={e => e.preventDefault()} onClick={onClick}>{children}</button>
  return <div className="adm-editor">
    <div className="adm-ed-top"><b>{label}</b>
      <div className="adm-ed-tabs" role="tablist"><button type="button" role="tab" aria-selected={mode === 'compose'} className={mode === 'compose' ? 'on' : ''} onClick={() => switchTo('compose')}>Compose</button><button type="button" role="tab" aria-selected={mode === 'html'} className={mode === 'html' ? 'on' : ''} onClick={() => switchTo('html')}>HTML</button></div></div>
    {mode === 'compose' ? <>
      <div className="adm-toolbar" role="toolbar" aria-label="Formatting">
        <Btn title="Undo" onClick={() => exec('undo')}><Undo2 size={15}/></Btn><Btn title="Redo" onClick={() => exec('redo')}><Redo2 size={15}/></Btn><span className="sep"/>
        <select aria-label="Text style" value="" onMouseDown={saveSel} onChange={e => { if (e.target.value) exec('formatBlock', e.target.value); e.target.value = '' }}><option value="">Text style</option><option value="p">Paragraph</option><option value="h2">Heading</option><option value="h3">Sub-heading</option><option value="blockquote">Quote</option></select><span className="sep"/>
        <Btn title="Bold" onClick={() => exec('bold')}><Bold size={15}/></Btn><Btn title="Italic" onClick={() => exec('italic')}><Italic size={15}/></Btn><Btn title="Underline" onClick={() => exec('underline')}><Underline size={15}/></Btn><span className="sep"/>
        <Btn title="Align left" onClick={() => exec('justifyLeft')}><AlignLeft size={15}/></Btn><Btn title="Center" onClick={() => exec('justifyCenter')}><AlignCenter size={15}/></Btn><Btn title="Align right" onClick={() => exec('justifyRight')}><AlignRight size={15}/></Btn><Btn title="Justify" onClick={() => exec('justifyFull')}><AlignJustify size={15}/></Btn><span className="sep"/>
        <Btn title="Bullet list" onClick={() => exec('insertUnorderedList')}><List size={15}/></Btn><Btn title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered size={15}/></Btn><Btn title="Quote" onClick={() => exec('formatBlock', 'blockquote')}><Quote size={15}/></Btn><span className="sep"/>
        <Btn title="Link" onClick={() => openDlg('link')}><Link2 size={15}/> Link</Btn><Btn title="Image" onClick={() => openDlg('image')}><ImageIcon size={15}/> Image</Btn><Btn title="Button" onClick={() => openDlg('button')}><MousePointerClick size={15}/> Button</Btn><Btn title="Custom code / embed" onClick={() => openDlg('code')}><Code2 size={15}/> Code</Btn>
        <select aria-label="Insert ad" value="" onMouseDown={saveSel} onChange={e => { insertAd(e.target.value); e.target.value = '' }}><option value="">＋ Ad…</option>{ads.length === 0 ? <option disabled>No ads yet</option> : ads.map(a => <option key={a.slot_key} value={a.slot_key}>{a.name} · {a.kind === 'direct_link' ? 'direct link' : a.size}</option>)}</select><span className="sep"/>
        <Btn title="Clear formatting" onClick={() => exec('removeFormat')}><RemoveFormatting size={15}/></Btn><Btn title="Auto-format text into headings & paragraphs (no words change)" onClick={autoFormatAll}><Wand2 size={15}/> Auto-format</Btn><Btn title="AI format: headings, sub-headings, bullets and paragraphs with Gemini (selected text, or the whole post). No words change." onClick={aiFormatAll}><Sparkles size={15}/> {aiBusy ? 'AI working…' : 'AI format'}</Btn>
        <label className="adm-ed-auto" title="When ON, anything you paste is cleaned and formatted automatically"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)}/> Clean on paste</label><label className="adm-ed-auto" title="When ON, pasted text is structured by Gemini AI (needs Clean on paste)"><input type="checkbox" checked={aiOn} onChange={e => setAiOn(e.target.checked)}/> AI on paste</label>
      </div>
      <div ref={ref} className="mx-compose adm-compose" contentEditable suppressContentEditableWarning spellCheck onInput={emit} onBlur={() => { saveSel(); emit() }} onKeyUp={saveSel} onMouseUp={saveSel} onPaste={onPaste} style={{ minHeight }}/>
    </> : <>
      <div className="adm-toolbar"><button type="button" className={fr ? 'on' : ''} onClick={() => setFr(v => !v)}><Search size={15}/> Find & replace</button><span className="adm-ed-hint">Paste your ad / tracking <code>&lt;script&gt;</code> anywhere in the HTML. In Compose it appears as a “CODE” block instead of text.</span></div>
      {fr && <div className="adm-pop"><div className="row" style={{ gridTemplateColumns: '1fr 1fr auto' }}><label className="adm-field"><span>Find</span><input value={find} onChange={e => setFind(e.target.value)} onKeyDown={e => e.key === 'Enter' && findNext()}/></label><label className="adm-field"><span>Replace with</span><input value={repl} onChange={e => setRepl(e.target.value)}/></label><div className="adm-actions"><button type="button" className="adm-btn sm" onClick={findNext}>Find next</button><button type="button" className="adm-btn sm" onClick={replaceOne}>Replace</button><button type="button" className="adm-btn sm primary" onClick={replaceAll}>Replace all</button></div></div><label className="adm-check"><input type="checkbox" checked={mc} onChange={e => setMc(e.target.checked)}/> Match case · <b>{matches}</b> match{matches === 1 ? '' : 'es'}</label></div>}
      <textarea ref={taRef} className="adm-htmlview" spellCheck={false} value={htmlText} onChange={e => onHtmlChange(e.target.value)} style={{ minHeight }}/>
    </>}
    <div className="adm-ed-foot"><span>{words.toLocaleString()} words{aiBusy ? ' · AI is formatting…' : ''}</span><span>{mode === 'compose' ? 'Compose view, what you see is what visitors see' : 'HTML view, switch to Compose to preview'}</span></div>
    {dlg && <div className="adm-modal" role="dialog" aria-modal="true"><div className="adm-modal-card">
      <div className="adm-modal-head"><b>{dlg.type === 'link' ? 'Insert link' : dlg.type === 'image' ? 'Insert image' : dlg.type === 'button' ? 'Insert button' : 'Insert custom code'}</b><button type="button" className="adm-btn sm" onClick={() => setDlg(null)} aria-label="Close"><X size={15}/></button></div>
      {dlg.type === 'link' && <div className="adm"><label className="adm-field"><span>Text</span><input value={dlg.text} onChange={e => D({ text: e.target.value })}/></label><label className="adm-field"><span>URL</span><input value={dlg.url} onChange={e => D({ url: e.target.value })} placeholder="https://"/></label></div>}
      {dlg.type === 'image' && <div className="adm">
        <div className="adm-tabs"><button type="button" className={dlg.tab === 'link' ? 'active' : ''} onClick={() => D({ tab: 'link' })}>From link</button><button type="button" className={dlg.tab === 'up' ? 'active' : ''} onClick={() => D({ tab: 'up' })}>Upload from device</button></div>
        {dlg.tab === 'link' ? <label className="adm-field"><span>Image URL</span><input value={dlg.url} onChange={e => D({ url: e.target.value })} placeholder="https://…/image.jpg"/></label> : <div className="adm-field"><span>Choose a file (max 5 MB)</span><button type="button" className="adm-btn" onClick={() => file.current?.click()} disabled={dlg.busy}><Upload size={15}/> {dlg.busy ? 'Uploading…' : dlg.url ? 'Choose another' : 'Choose file'}</button><input ref={file} type="file" accept="image/*" hidden onChange={e => pickFile(e, false)}/></div>}
        {dlg.url && <img src={dlg.url} alt="" style={{ maxHeight: 140, borderRadius: 10, justifySelf: 'start' }}/>}
        <div className="adm-grid3"><label className="adm-field"><span>Description (alt)</span><input value={dlg.alt} onChange={e => D({ alt: e.target.value })}/></label><label className="adm-field"><span>Width</span><select value={dlg.w} onChange={e => D({ w: e.target.value })}>{[25, 50, 75, 100].map(v => <option key={v} value={v}>{v}%</option>)}</select></label><label className="adm-field"><span>Align</span><select value={dlg.align} onChange={e => D({ align: e.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div></div>}
      {dlg.type === 'button' && <div className="adm">
        <div className="adm-tabs"><button type="button" className={dlg.tab === 'tpl' ? 'active' : ''} onClick={() => D({ tab: 'tpl' })}>Templates</button><button type="button" className={dlg.tab === 'img' ? 'active' : ''} onClick={() => D({ tab: 'img' })}>My own image</button></div>
        {dlg.tab === 'tpl' ? <div className="adm-btn-grid">{BUTTON_TEMPLATES.map(t => <button type="button" key={t.id} className={`adm-tpl ${dlg.tpl === t.id ? 'on' : ''}`} onClick={() => D({ tpl: t.id, label: '' })} title={t.name}><span dangerouslySetInnerHTML={{ __html: previewHtml(t.id, dlg.tpl === t.id && dlg.label ? dlg.label : t.label) }}/></button>)}</div>
          : <div className="adm"><div className="adm-field"><span>Button image, upload from device or paste a link</span><div className="adm-imgrow"><input value={dlg.img} onChange={e => D({ img: e.target.value })} placeholder="https://…/download-button.png"/><button type="button" className="adm-btn" onClick={() => file.current?.click()} disabled={dlg.busy}><Upload size={15}/> {dlg.busy ? '…' : 'Upload'}</button><input ref={file} type="file" accept="image/*" hidden onChange={e => pickFile(e, true)}/></div></div>{dlg.img && <img src={dlg.img} alt="" style={{ maxHeight: 70 }}/>}</div>}
        <div className="adm-grid2">{dlg.tab === 'tpl' && <label className="adm-field"><span>Button text</span><input value={dlg.label} onChange={e => D({ label: e.target.value })} placeholder={BUTTON_TEMPLATES.find(t => t.id === dlg.tpl)?.label}/></label>}<label className="adm-field"><span>Link (https://…)</span><input value={dlg.url} onChange={e => D({ url: e.target.value })} placeholder="https://"/></label></div>
        <label className="adm-field" style={{ maxWidth: 260 }}><span>Wait before redirect (seconds)</span><input type="number" min="0" max="300" value={dlg.wait} onChange={e => D({ wait: e.target.value })}/><span className="adm-hint">Visitors see a countdown screen (with your ad) and are then redirected. 0 = open immediately.</span></label></div>}
      {dlg.type === 'code' && <div className="adm"><label className="adm-field"><span>Paste ad / widget / tracking code</span><textarea className="adm-code" spellCheck={false} value={dlg.code} onChange={e => D({ code: e.target.value })} placeholder={'<script …></script>'}/></label><div className="adm-grid2"><label className="adm-field"><span>Width (px, 0 = auto)</span><input type="number" value={dlg.cw} onChange={e => D({ cw: e.target.value })}/></label><label className="adm-field"><span>Height (px)</span><input type="number" value={dlg.ch} onChange={e => D({ ch: e.target.value })}/></label></div><span className="adm-hint">Runs in a safe frame on your site. Size is auto-detected when the code contains width/height.</span></div>}
      <div className="adm-actions" style={{ marginTop: 16 }}><button type="button" className="adm-btn primary" onClick={confirmDlg} disabled={dlg.busy}>Insert</button><button type="button" className="adm-btn" onClick={() => setDlg(null)}>Cancel</button></div>
    </div></div>}
  </div>
}
