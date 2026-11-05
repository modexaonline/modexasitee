import { supabase } from './supabase'
// Sends plain text to the `ai-format` Supabase Edge Function (Gemini). Returns clean HTML with the same words.
export async function aiFormatText(text) {
  if (!supabase) throw new Error('Supabase is not connected.')
  const { data, error } = await supabase.functions.invoke('ai-format', { body: { text } })
  if (error) {
    let msg = error.message
    try { const t = await error.context?.text?.(); try { const j = JSON.parse(t); if (j?.error) msg = j.error; else if (t) msg = t.slice(0, 300) } catch { if (t) msg = t.slice(0, 300) } } catch {}
    throw new Error(msg || 'AI format failed.')
  }
  if (!data?.html) throw new Error(data?.error || 'AI returned nothing.')
  return data.html
}
