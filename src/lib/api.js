import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function callClaude(systemPrompt, userPrompt, jsonMode = false) {
  const system = jsonMode
    ? systemPrompt + '\n\nResponde ÚNICAMENTE con JSON válido. Sin texto adicional, sin bloques markdown.'
    : systemPrompt
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  if (jsonMode) {
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()) }
    catch { return null }
  }
  return text
}

export const SYSTEM_CLASSIFY = `Eres un lingüista especializado en francés para hispanohablantes. 
Clasifica vocabulario y estructuras gramaticales con precisión. Responde siempre en español.`

export const SYSTEM_TUTOR = `Eres un tutor de francés para hispanohablantes de nivel A1-B1. 
Eres conciso, pedagógico y motivador. Usas ejemplos prácticos. Respondes en español a menos que el ejercicio requiera francés.`

export const CAT_COLORS = {
  verbo:      { bg: '#1a1a2e', text: '#a78bfa', border: '#4c1d95' },
  sustantivo: { bg: '#0f2417', text: '#34d399', border: '#064e3b' },
  pronombre:  { bg: '#0c1a2e', text: '#60a5fa', border: '#1e3a5f' },
  adjetivo:   { bg: '#2a1a0a', text: '#fbbf24', border: '#78350f' },
  adverbio:   { bg: '#1a0a1a', text: '#f472b6', border: '#6b21a8' },
  expresión:  { bg: '#1a0f0a', text: '#fb923c', border: '#7c2d12' },
}

export function getCatStyle(cat) {
  const key = (cat || '').toLowerCase()
  for (const k in CAT_COLORS) if (key.includes(k)) return CAT_COLORS[k]
  return CAT_COLORS['expresión']
}