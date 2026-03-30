import { useState, useEffect } from 'react'
import { supabase, callClaude, SYSTEM_TUTOR } from '../lib/api'

const TYPES = [
  { id: 'fill',     label: 'Completar frase' },
  { id: 'translate',label: 'Traducción' },
  { id: 'quiz',     label: 'Múltiple opción' },
  { id: 'grammar',  label: 'Explicación gramatical' },
]

export default function Practice({ refreshKey, onDone }) {
  const [type, setType] = useState('quiz')
  const [vocab, setVocab] = useState([])
  const [loading, setLoading] = useState(false)
  const [exercise, setExercise] = useState(null)
  const [quizState, setQuizState] = useState(null)
  const [answered, setAnswered] = useState(false)

  useEffect(() => { loadVocab() }, [refreshKey])

  async function loadVocab() {
    const { data } = await supabase.from('vocabulary').select('*').order('created_at', { ascending: false }).limit(30)
    setVocab(data || [])
  }

  async function generate() {
    if (!vocab.length) return
    setLoading(true)
    setExercise(null)
    setQuizState(null)
    setAnswered(false)

    const sample = vocab.slice(0, 15).map(v => `${v.fr} (${v.es})`).join(', ')

    if (type === 'quiz') {
      const data = await callClaude(
        SYSTEM_TUTOR,
        `Con este vocabulario francés: ${sample}\nCrea 1 pregunta de opción múltiple (4 opciones). Mezcla español→francés y francés→español. JSON: {"pregunta":"...","opciones":["a","b","c","d"],"correcta":0,"explicacion":"..."}`,
        true
      )
      if (data) {
        setQuizState(data)
        setExercise({ type: 'quiz', data })
      }
    } else {
      const prompts = {
        fill: `Con este vocabulario: ${sample}\nCrea 3 ejercicios de completar frase (una palabra faltante marcada con ___). Incluye la respuesta entre paréntesis al final de cada frase. Formato simple, legible.`,
        translate: `Con este vocabulario: ${sample}\nCrea 4 ejercicios de traducción mezclando Español→Francés y Francés→Español. Escribe la respuesta al final de cada uno entre corchetes []. Formato simple.`,
        grammar: `Del siguiente vocabulario: ${sample}\nElige una palabra o expresión interesante y explica en español la regla gramatical que representa, con 2-3 ejemplos adicionales en francés con traducción. Sé pedagógico y conciso.`,
      }
      const text = await callClaude(SYSTEM_TUTOR, prompts[type])
      setExercise({ type, text })
    }
    setLoading(false)
  }

  async function recordResult(correct) {
    await supabase.from('exercises').insert({ type, correct })
    onDone()
  }

  async function checkQuiz(i) {
    if (answered) return
    setAnswered(true)
    const correct = i === quizState.correcta
    await recordResult(correct)
    setQuizState(q => ({ ...q, selected: i }))
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Ejercicios</div>
        <div className="card-sub">La IA genera ejercicios basados en tu vocabulario acumulado.</div>

        <div className="mode-row">
          {TYPES.map(t => (
            <button
              key={t.id}
              className={`btn btn-ghost ${type === t.id ? 'active' : ''}`}
              onClick={() => setType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={generate}
          disabled={loading || vocab.length === 0}
        >
          {loading
            ? <><span className="spinner" />Generando...</>
            : vocab.length === 0
              ? 'Primero ingresa una lección'
              : 'Generar ejercicio'}
        </button>
      </div>

      {exercise?.type === 'quiz' && quizState && (
        <div className="card">
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '1rem' }}>
            {quizState.pregunta}
          </div>
          {quizState.opciones.map((o, i) => {
            let cls = 'quiz-opt'
            if (quizState.selected !== undefined) {
              if (i === quizState.correcta) cls += ' correct'
              else if (i === quizState.selected && i !== quizState.correcta) cls += ' wrong'
            }
            return (
              <button key={i} className={cls} onClick={() => checkQuiz(i)} disabled={answered}>
                {o}
              </button>
            )
          })}
          {answered && (
            <div className="ai-box" style={{ marginTop: '1rem' }}>
              {quizState.selected === quizState.correcta ? '✓ Correcto. ' : '✗ Incorrecto. '}
              {quizState.explicacion}
            </div>
          )}
          {answered && (
            <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={generate}>
              Siguiente ejercicio →
            </button>
          )}
        </div>
      )}

      {exercise && exercise.type !== 'quiz' && (
        <div className="card">
          <div className="label">{TYPES.find(t => t.id === exercise.type)?.label}</div>
          <div className="ai-box">{exercise.text}</div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" onClick={() => recordResult(true)}>✓ Lo supe</button>
            <button className="btn btn-ghost" onClick={() => recordResult(false)}>✗ Me costó</button>
            <button className="btn btn-ghost" onClick={generate} style={{ marginLeft: 'auto' }}>
              Otro ejercicio →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
