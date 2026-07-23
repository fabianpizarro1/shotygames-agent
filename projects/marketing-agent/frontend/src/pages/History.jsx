import { useState, useEffect, useRef } from 'react'

function PromptHistoryCard({ prompt, onImageUploaded, onFeedback }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('image', file)
    try {
      const res = await fetch(`/api/image/${prompt.ID}`, { method: 'POST', body: form })
      const data = await res.json()
      onImageUploaded(prompt.ID, data.imageUrl)
    } catch (err) {
      alert('Error subiendo imagen')
    } finally {
      setUploading(false)
    }
  }

  const sendFeedback = async (feedback) => {
    try {
      await fetch(`/api/feedback/${prompt.ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      })
      onFeedback(prompt.ID, feedback)
    } catch (err) {
      alert('Error guardando feedback')
    }
  }

  const hasImage = !!prompt['Imagen URL']
  const feedback = prompt['Feedback']

  return (
    <div className={`history-prompt-card ${hasImage ? 'has-image' : ''}`}>
      <div>
        <div className="prompt-meta">
          <span className="badge badge-purple">{prompt['Angulo']}</span>
          <span className="badge badge-gray">{prompt['Formato']}</span>
          <span className="prompt-date">{prompt['Fecha']}</span>
          {feedback === 'me gustó' && <span className="badge badge-green">✓ Me gustó</span>}
          {feedback === 'no me gustó' && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}>✗ No gustó</span>}
        </div>

        {prompt['Headline'] && (
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            "{prompt['Headline']}"
          </p>
        )}

        <div className="prompt-text">{prompt['Prompt Imagen']}</div>

        {!feedback && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-sm btn-green" onClick={() => sendFeedback('me gustó')}>
              ✓ Me gustó
            </button>
            <button className="btn btn-sm btn-red" onClick={() => sendFeedback('no me gustó')}>
              ✗ No gustó
            </button>
          </div>
        )}
      </div>

      <div className="prompt-actions">
        {hasImage ? (
          <img
            src={prompt['Imagen URL']}
            alt="Creatividad generada"
            className="prompt-image-preview"
            onClick={() => window.open(prompt['Imagen URL'], '_blank')}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <>
            <div
              className="upload-area"
              onClick={() => fileRef.current?.click()}
              style={{ width: 100 }}
            >
              {uploading ? '...' : '+ Subir imagen'}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function History() {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/history/prompts')
      setPrompts(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleImageUploaded = (id, url) => {
    setPrompts(prev => prev.map(p => p.ID === id ? { ...p, 'Imagen URL': url } : p))
  }

  const handleFeedback = (id, feedback) => {
    setPrompts(prev => prev.map(p => p.ID === id ? { ...p, 'Feedback': feedback } : p))
  }

  const filtered = prompts.filter(p => {
    if (filter === 'con-imagen') return !!p['Imagen URL']
    if (filter === 'sin-imagen') return !p['Imagen URL']
    if (filter === 'me-gusto') return p['Feedback'] === 'me gustó'
    return true
  })

  return (
    <div className="page">
      <div className="page-header">
        <h2>Historial de Prompts</h2>
        <p>Todos los prompts generados — sube la imagen cuando la tengas lista</p>
      </div>

      <div className="history-filters">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'sin-imagen', label: 'Sin imagen' },
          { key: 'con-imagen', label: 'Con imagen' },
          { key: 'me-gusto', label: 'Me gustaron' }
        ].map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <button className="btn btn-sm btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>
          ↻ Actualizar
        </button>
      </div>

      {loading ? (
        <div className="loading-dots"><span /><span /><span /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>Sin prompts aún</h3>
          <p>Ve a Generar y pídele una estrategia al agente</p>
        </div>
      ) : (
        <div className="prompts-grid">
          {filtered.map(p => (
            <PromptHistoryCard
              key={p.ID}
              prompt={p}
              onImageUploaded={handleImageUploaded}
              onFeedback={handleFeedback}
            />
          ))}
        </div>
      )}
    </div>
  )
}
