import { useState, useEffect } from 'react'
import { supabase, CAT_COLORS } from '../lib/api'

export default function Progress({ refreshKey }) {
  const [stats, setStats] = useState(null)

  useEffect(() => { load() }, [refreshKey])

  async function load() {
    const [
      { data: vocab },
      { data: lessons },
      { data: exercises },
    ] = await Promise.all([
      supabase.from('vocabulary').select('categoria,times_seen,times_correct'),
      supabase.from('lessons').select('topic,created_at,structures').order('created_at', { ascending: false }),
      supabase.from('exercises').select('type,correct,created_at').order('created_at', { ascending: false }),
    ])

    const catCounts = {}
    ;(vocab || []).forEach(w => {
      const c = (w.categoria || '').toLowerCase()
      let key = 'expresión'
      for (const k of Object.keys(CAT_COLORS)) if (c.includes(k)) { key = k; break }
      catCounts[key] = (catCounts[key] || 0) + 1
    })

    const total = (exercises || []).length
    const correct = (exercises || []).filter(e => e.correct).length
    const accuracy = total > 0 ? Math.round(correct / total * 100) : 0

    const typeCount = {}
    ;(exercises || []).forEach(e => { typeCount[e.type] = (typeCount[e.type] || 0) + 1 })

    setStats({ vocab: vocab || [], lessons: lessons || [], exercises: exercises || [], catCounts, accuracy, total, correct, typeCount })
  }

  if (!stats) return <div style={{ color: 'var(--text3)', fontSize: '14px' }}><span className="spinner" />Cargando...</div>

  const maxCat = Math.max(...Object.values(stats.catCounts), 1)
  const catColors = {
    verbo: '#7c6fff', sustantivo: '#34d399', pronombre: '#60a5fa',
    adjetivo: '#fbbf24', adverbio: '#f472b6', expresión: '#fb923c',
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-n">{stats.lessons.length}</div>
          <div className="stat-l">Lecciones</div>
        </div>
        <div className="stat-box">
          <div className="stat-n">{stats.vocab.length}</div>
          <div className="stat-l">Palabras</div>
        </div>
        <div className="stat-box">
          <div className="stat-n">{stats.total}</div>
          <div className="stat-l">Ejercicios</div>
        </div>
        <div className="stat-box">
          <div className="stat-n" style={{ color: stats.accuracy >= 70 ? 'var(--green)' : 'var(--amber)' }}>
            {stats.accuracy}%
          </div>
          <div className="stat-l">Precisión</div>
        </div>
      </div>

      <div className="card">
        <div className="label">Vocabulario por categoría</div>
        {Object.entries(stats.catCounts).map(([cat, n]) => (
          <div key={cat} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text2)', textTransform: 'capitalize' }}>{cat}</span>
              <span style={{ color: 'var(--text3)' }}>{n} palabras</span>
            </div>
            <div className="prog-wrap">
              <div className="prog-fill" style={{ width: `${Math.round(n / maxCat * 100)}%`, background: catColors[cat] || '#888' }} />
            </div>
          </div>
        ))}
        {Object.keys(stats.catCounts).length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: '14px' }}>Aún no hay datos. Ingresa tu primera lección.</div>
        )}
      </div>

      <div className="card">
        <div className="label">Últimas lecciones</div>
        {stats.lessons.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '14px' }}>Sin lecciones aún.</div>
        ) : stats.lessons.slice(0, 10).map((l, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{l.topic}</span>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{new Date(l.created_at).toLocaleDateString('es-CO')}</span>
            </div>
            {(l.structures || []).slice(0, 2).map((s, j) => (
              <div key={j} style={{ fontSize: '12px', color: 'var(--text3)' }}>— {s}</div>
            ))}
          </div>
        ))}
      </div>

      {stats.total > 0 && (
        <div className="card">
          <div className="label">Ejercicios completados por tipo</div>
          {Object.entries(stats.typeCount).map(([t, n]) => (
            <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text2)', textTransform: 'capitalize' }}>{t}</span>
              <span style={{ color: 'var(--text3)' }}>{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
