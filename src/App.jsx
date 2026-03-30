import { useState, useEffect } from 'react'
import { supabase } from './lib/api'
import Ingest from './components/Ingest'
import Vocabulary from './components/Vocabulary'
import Practice from './components/Practice'
import Progress from './components/Progress'
import './App.css'

const VIEWS = [
  { id: 'ingest',   label: 'Lección de hoy' },
  { id: 'vocab',    label: 'Vocabulario' },
  { id: 'practice', label: 'Practicar' },
  { id: 'progress', label: 'Progreso' },
]

export default function App() {
  const [view, setView] = useState('ingest')
  const [stats, setStats] = useState({ lessons: 0, words: 0, exercises: 0 })
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { loadStats() }, [refreshKey])

  async function loadStats() {
    const [{ count: lessons }, { count: words }, { count: exercises }] = await Promise.all([
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('vocabulary').select('*', { count: 'exact', head: true }),
      supabase.from('exercises').select('*', { count: 'exact', head: true }),
    ])
    setStats({ lessons: lessons || 0, words: words || 0, exercises: exercises || 0 })
  }

  function onLessonSaved() {
    setRefreshKey(k => k + 1)
    setTimeout(() => setView('practice'), 600)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-fr">français</span>
            <span className="brand-dot">·</span>
            <span className="brand-sub">companion</span>
          </div>
          <div className="header-stats">
            <span>{stats.lessons} <em>lecciones</em></span>
            <span>{stats.words} <em>palabras</em></span>
            <span>{stats.exercises} <em>ejercicios</em></span>
          </div>
        </div>
      </header>

      <nav className="nav">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={`nav-btn ${view === v.id ? 'active' : ''}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {view === 'ingest'   && <Ingest onSaved={onLessonSaved} />}
        {view === 'vocab'    && <Vocabulary refreshKey={refreshKey} />}
        {view === 'practice' && <Practice refreshKey={refreshKey} onDone={() => setRefreshKey(k => k+1)} />}
        {view === 'progress' && <Progress refreshKey={refreshKey} />}
      </main>
    </div>
  )
}
