import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase, callClaude, SYSTEM_TUTOR } from '../lib/api'

const TYPES = [
  { id: 'fill',     label: 'Completar frase' },
  { id: 'translate',label: 'Traducción' },
  { id: 'quiz',     label: 'Múltiple opción' },
  { id: 'grammar',  label: 'Explicación gramatical' },
]

export default function Practice({ refreshKey, onDone }) {
  const [type, setType] = useState('quiz')
  const [lessons, setLessons] = useState([])
  const [selectedLesson, setSelectedLesson] = useState('all')
  const [vocab, setVocab] = useState([])
  const [loading, setLoading] = useState(false)
  const [exercise, setExercise] = useState(null)
  const [quizState, setQuizState] = useState(null)
  const [answered, setAnswered] = useState(false)

  useEffect(() => { loadLessons() }, [refreshKey])
  useEffect(() => { loadVocab() }, [selectedLesson, refreshKey])

  async function loadLessons() {
    const { data } = await supabase
      .from('lessons')
      .select('id, topic, created_at')
      .order('created_at', { ascending: false })
    setLessons(data || [])
  }

  async function loadVocab() {
    let query = supabase.from('vocabulary').select('*')
    if (selectedLesson !== 'all') {
      query = query.eq('lesson_id', selectedLesson)
    } else {
      query = query.order('created_at', { ascending: false }).limit(30)
    }
    const { data } = await query
    setVocab(data || [])
  }

  async function generate() {
    if (!vocab.length) return
    setLoading(true)
    setExercise(null)
    setQuizState(null)
    setAnswered(false)

    const lessonLabel = selectedLesson === 'all'
      ? 'vocabulario general'
      : lessons.find(l => l.id === selectedLesson)?.topic || 'esta lección'

    const sample = vocab.map(v => `${v.fr} (${v.es})`).join(', ')

    if (type === 'quiz') {
      const data = await callClaude(
        SYSTEM_TUTOR,
        `Lección: "${lessonLabel}". Vocabulario: ${sample}\nCrea 1 pregunta de opción múltiple (4 opciones). Mezcla español→francés y francés→español. JSON: {"pregunta":"...","opciones":["a","b","c","d"],"correcta":0,"explicacion":"..."}`,
        true
      )
      if (data) {
        setQuizState(data)
        setExercise({ type: 'quiz', data })
      }
    } else {
      const prompts = {
        fill:      `Lección: "${lessonLabel}". Vocabulario: ${sample}\nCrea 3 ejercicios de completar frase (una palabra faltante marcada con ___). Incluye la respuesta entre paréntesis al final. Formato simple.`,
        translate: `Lección: "${lessonLabel}". Vocabulario: ${sample}\nCrea 4 ejercicios de traducción mezclando Español→Francés y Francés→Español. Respuesta al final entre corchetes [].`,
        grammar:   `Lección: "${lessonLabel}". Vocabulario: ${sample}\nElige la estructura gramatical más interesante de esta lección y explícala en español con 2-3 ejemplos prácticos en francés con traducción.`,
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

  const currentLessonLabel = selectedLesson === 'all'
    ? 'Todo el vocabulario'
    : lessons.find(l => l.id === selectedLesson)?.topic || ''

  return (
    <div>
      <div className="card">
        <div className="card-title">Practicar</div>
        <div className="card-sub">Elige una lección específica o practica con todo tu vocabulario.</div>

        <div className="label" style={{ marginBottom: '8px' }}>Lección</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' }}>
          <button
            className={`btn btn-ghost ${selectedLesson === 'all' ? 'active' : ''}`}
            style={{ fontSize: '12px', padding: '5px 12px' }}
            onClick={() => setSelectedLesson('all')}
          >
            Todo
          </button>
          {lessons.map(l => (
            <button
              key={l.id}
              className={`btn btn-ghost ${selectedLesson === l.id ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '5px 12px' }}
              onClick={() => setSelectedLesson(l.id)}
            >
              {l.topic}
            </button>
          ))}
        </div>

        {vocab.length > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '1rem' }}>
            {vocab.length} palabras disponibles
            {selectedLesson !== 'all' && ` · ${currentLessonLabel}`}
          </div>
        )}

        <div className="label" style={{ marginBottom: '8px' }}>Tipo de ejercicio</div>
        <div className="mode-row" style={{ marginBottom: '1rem' }}>
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
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {currentLessonLabel}
          </div>
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
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {currentLessonLabel} · {TYPES.find(t => t.id === exercise.type)?.label}
          </div>
          <div className="ai-box">
            <ReactMarkdown>{exercise.text}</ReactMarkdown>
          </div>
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
