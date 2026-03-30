import { useState } from 'react'
import { supabase, callClaude, getCatStyle, SYSTEM_CLASSIFY } from '../lib/api'

export default function Ingest({ onSaved }) {
  const [mode, setMode] = useState('phrase')
  const [phraseInput, setPhraseInput] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  async function analyze() {
    const input = mode === 'phrase' ? phraseInput.trim() : topicInput.trim()
    if (!input) return
    setLoading(true)
    setResult(null)
    setSaved(false)

    const prompt = mode === 'phrase'
      ? `Analiza estas frases en francés y extrae vocabulario clave. Para cada palabra devuelve: "fr" (en francés), "es" (español), "categoria" (verbo/sustantivo/pronombre/adjetivo/adverbio/expresión). Identifica también las "estructuras" gramaticales presentes (máx 3, descritas en español) y un "tema" breve para la lección. JSON: {"tema":"...","estructuras":["..."],"palabras":[{"fr":"...","es":"...","categoria":"..."}]}\n\nFrases:\n${input}`
      : `El estudiante aprendió este tema de francés: "${input}". Genera vocabulario representativo de 8-10 palabras. Para cada una: "fr", "es", "categoria". También "estructuras" (2-3 reglas del tema) y "tema" (título breve). JSON: {"tema":"...","estructuras":["..."],"palabras":[{"fr":"...","es":"...","categoria":"..."}]}`

    const data = await callClaude(SYSTEM_CLASSIFY, prompt, true)
    setResult(data)
    setLoading(false)
  }

  async function saveLesson() {
    if (!result) return
    setLoading(true)
    const { data: lesson, error } = await supabase.from('lessons').insert({
      topic: result.tema || 'Lección',
      source: mode,
      raw_input: mode === 'phrase' ? phraseInput : topicInput,
      structures: result.estructuras || [],
    }).select().single()

    if (!error && lesson) {
      const vocabRows = (result.palabras || []).map(p => ({
        lesson_id: lesson.id,
        fr: p.fr,
        es: p.es,
        categoria: p.categoria,
      }))
      await supabase.from('vocabulary').insert(vocabRows)
      setSaved(true)
      setPhraseInput('')
      setTopicInput('')
      setLoading(false)
      onSaved()
    } else {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">¿Qué aprendiste hoy?</div>
        <div className="card-sub">Ingresa tu lección de Duolingo y la IA clasificará todo automáticamente.</div>

        <div className="mode-row">
          <button
            className={`btn btn-ghost ${mode === 'phrase' ? 'active' : ''}`}
            onClick={() => setMode('phrase')}
          >
            Pegar frases
          </button>
          <button
            className={`btn btn-ghost ${mode === 'topic' ? 'active' : ''}`}
            onClick={() => setMode('topic')}
          >
            Describir tema
          </button>
        </div>

        {mode === 'phrase' ? (
          <textarea
            value={phraseInput}
            onChange={e => setPhraseInput(e.target.value)}
            placeholder={"Pega aquí las frases de tu lección. Ej:\nJe mange une pomme.\nTu bois de l'eau.\nIl fait beau aujourd'hui."}
          />
        ) : (
          <input
            type="text"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            placeholder="Ej: Los números del 1 al 20, el verbo avoir, los colores..."
          />
        )}

        <div style={{ marginTop: '12px' }}>
          <button
            className="btn btn-primary"
            onClick={analyze}
            disabled={loading || (mode === 'phrase' ? !phraseInput.trim() : !topicInput.trim())}
          >
            {loading ? <><span className="spinner" />Analizando...</> : 'Analizar con IA'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card">
          <div className="card-title">{result.tema}</div>
          <div className="card-sub">{(result.palabras || []).length} palabras identificadas</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
            {(result.palabras || []).map((p, i) => {
              const s = getCatStyle(p.categoria)
              return (
                <span key={i} className="tag" style={{ background: s.bg, color: s.text, borderColor: s.border }} title={p.es}>
                  {p.fr}
                </span>
              )
            })}
          </div>

          {result.estructuras?.length > 0 && (
            <>
              <div className="label">Estructuras gramaticales</div>
              {result.estructuras.map((e, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text2)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  — {e}
                </div>
              ))}
              <div style={{ marginTop: '1rem' }} />
            </>
          )}

          {!saved ? (
            <button className="btn btn-primary" onClick={saveLesson} disabled={loading}>
              {loading ? <><span className="spinner" />Guardando...</> : 'Guardar lección y practicar →'}
            </button>
          ) : (
            <div style={{ color: 'var(--green)', fontSize: '14px' }}>
              ✓ Lección guardada. Redirigiendo a práctica...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
