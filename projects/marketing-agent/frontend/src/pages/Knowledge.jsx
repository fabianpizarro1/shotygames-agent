import { useState, useEffect, useRef } from 'react'

export default function Knowledge() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('Artículo')
  const [contenido, setContenido] = useState('')
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  const loadItems = async () => {
    try {
      const res = await fetch('/api/knowledge')
      setItems(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadItems() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titulo || !contenido) return
    setUploading(true)
    setResult(null)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, tipo, contenido })
      })
      const data = await res.json()
      setResult(data.resumen)
      setTitulo('')
      setContenido('')
      loadItems()
    } catch (err) {
      alert('Error guardando conocimiento')
    } finally {
      setUploading(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    setContenido(text)
    if (!titulo) setTitulo(file.name.replace(/\.[^.]+$/, ''))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Base de Conocimiento</h2>
        <p>Sube artículos, estudios o notas — el agente los analiza y aprende cómo aplicarlos a Shotygames</p>
      </div>

      <div className="card knowledge-upload-card">
        <h3>Agregar nuevo conocimiento</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Título</label>
              <input
                className="input"
                placeholder="Ej: Masterclass Static Ads 2026"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
                <option>Artículo</option>
                <option>Transcripción</option>
                <option>Estudio</option>
                <option>Estrategia competidor</option>
                <option>Nota propia</option>
                <option>Otro</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Contenido</label>
            <textarea
              className="input"
              placeholder="Pega aquí el texto del artículo, transcripción, o lo que quieras que el agente aprenda..."
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              style={{ minHeight: 120 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={uploading || !titulo || !contenido}>
              {uploading ? 'Analizando...' : '⚡ Subir y analizar'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              📎 Cargar archivo .txt
            </button>
            <input ref={fileRef} type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={handleFile} />
          </div>
        </form>

        {result && (
          <div className="research-block" style={{ marginTop: 16 }}>
            <h4>Cómo aplicar esto a Shotygames</h4>
            <p>{result}</p>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-dim)' }}>
        Documentos guardados ({items.length})
      </h3>

      {loading ? (
        <div className="loading-dots"><span /><span /><span /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📚</div>
          <h3>Sin documentos aún</h3>
          <p>Sube artículos, estudios o notas para que el agente aprenda</p>
        </div>
      ) : (
        <div className="knowledge-list">
          {items.map(item => (
            <div key={item.ID} className="knowledge-item">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <h4>{item['Titulo']}</h4>
                <span className="badge badge-gray">{item['Tipo']}</span>
                <span className="prompt-date" style={{ marginLeft: 'auto' }}>{item['Fecha']}</span>
              </div>
              {item['Resumen Aplicacion'] && (
                <p><strong style={{ color: 'var(--accent-light)' }}>Aplicación:</strong> {item['Resumen Aplicacion']}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
