import { useState, useEffect } from 'react'
import { supabase, getCatStyle } from '../lib/api'

const CATS = ['todas', 'verbo', 'sustantivo', 'pronombre', 'adjetivo', 'adverbio', 'expresión']

export default function Vocabulary({ refreshKey }) {
  const [words, setWords] = useState([])
  const [lessons, setLessons] = useState([])
  const [filter, setFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [refreshKey])

  async function load() {
    setLoading(true)
    const [{ data: v }, { data: l }] = await Promise.all([
      supabase.from('vocabulary').select('*').order('created_at', { ascending: false }),
      supabase.from('lessons').select('id,topic,created_at').order('created_at', { ascending: false }),
    ])
    setWords(v || [])
    setLessons(l || [])
    setLoading(false)
  }

  const filtered = (words || []).filter(w => {
    const catMatch = filter === 'todas' || (w.categoria || '').toLowerCase().includes(filter)
    const searchMatch = !search || w.fr.toLowerCase().includes(search.toLowerCase()) || w.es.toLowerCase().includes(search.toLowerCase())
    return catMatch && searchMatch
  })

  const counts = {}
  CATS.slice(1).forEach(c => {
    counts[c] = (words || []).filter(w => (w.categoria || '').toLowerCase().includes(c)).length
  })

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
        <div className="stat-box">
          <div className="stat-n">{words.length}</div>
          <div className="stat-l">Total</div>
        </div>
        <div className="stat-box">
          <div className="stat-n">{lessons.length}</div>
          <div className="stat-l">Lecciones</div>
        </div>
        <div className="stat-box">
          <div className="stat-n">{counts['verbo'] || 0}</div>
          <div className="stat-l">Verbos</div>
        </div>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Buscar en français o español..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />

        <div className="mode-row" style={{ marginBottom: '1rem' }}>
          {CATS.map(c => (
            <button
              key={c}
              className={`btn btn-ghost ${filter === c ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '5px 12px' }}
              onClick={() => setFilter(c)}
            >
              {c}{c !== 'todas' && counts[c] ? ` (${counts[c]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text3)', fontSize: '14px' }}><span className="spinner" />Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '14px' }}>
            {words.length === 0 ? 'Aún no has ingresado ninguna lección.' : 'No hay palabras con ese filtro.'}
          </div>
        ) : (
          filtered.map(w => {
            const s = getCatStyle(w.categoria)
            const acc = w.times_seen > 0 ? Math.round(w.times_correct / w.times_seen * 100) : null
            return (
              <div key={w.id} className="vocab-row">
                <div>
                  <div className="vocab-fr">{w.fr}</div>
                  <div className="vocab-es">{w.es}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {acc !== null && (
                    <span style={{ fontSize: '12px', color: acc >= 70 ? 'var(--green)' : 'var(--amber)' }}>
                      {acc}%
                    </span>
                  )}
                  <span className="tag" style={{ background: s.bg, color: s.text, borderColor: s.border }}>
                    {w.categoria}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {lessons.length > 0 && (
        <div className="card">
          <div className="label">Historial de lecciones</div>
          {lessons.map(l => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
              <span style={{ color: 'var(--text)' }}>{l.topic}</span>
              <span style={{ color: 'var(--text3)' }}>{new Date(l.created_at).toLocaleDateString('es-CO')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
