import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  'Genera 3 ángulos de venta para la Torre de Shots Normal enfocados en grupos de amigos',
  'Quiero un ad para parejas que se aburren en casa los fines de semana',
  'Crea una estrategia para audiencia fría que nunca ha oído de Shotygames',
  'Dame ideas de ads para la temporada de cumpleaños, estilo transformación'
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className="copy-btn" onClick={copy}>
      {copied ? '✓ Copiado' : '⎘ Copiar'}
    </button>
  )
}

function PromptCard({ prompt, index }) {
  return (
    <div className="prompt-card">
      <div className="prompt-card-header">
        <strong>#{index + 1} — {prompt.angulo}</strong>
        <span className="badge badge-purple">{prompt.formato}</span>
      </div>
      <div className="prompt-field">
        <label>Headline</label>
        <p>"{prompt.copy_headline}"</p>
      </div>
      <div className="prompt-field">
        <label>Prompt para imagen</label>
        <div className="prompt-image-block">{prompt.prompt_imagen}</div>
        <CopyButton text={prompt.prompt_imagen} />
      </div>
    </div>
  )
}

function ResponseCard({ data }) {
  const e = data.estrategia || {}
  return (
    <div className="response-card">
      <div className="research-block">
        <h4>🔍 Investigación del agente</h4>
        <p>{data.investigacion}</p>
      </div>

      {e.objetivo && (
        <div className="strategy-block">
          <h4>Estrategia</h4>
          <div className="strategy-grid">
            <div className="strategy-field">
              <label>Objetivo</label>
              <p>{e.objetivo}</p>
            </div>
            <div className="strategy-field">
              <label>Producto</label>
              <p>{e.producto}</p>
            </div>
            <div className="strategy-field">
              <label>Audiencia</label>
              <p>{e.audiencia}</p>
            </div>
            <div className="strategy-field">
              <label>Nivel de consciencia</label>
              <p>{e.nivel_consciencia}</p>
            </div>
          </div>
          {e.descripcion && (
            <div className="strategy-field">
              <label>Descripción</label>
              <p>{e.descripcion}</p>
            </div>
          )}
          {e.formatos_sugeridos?.length > 0 && (
            <div className="strategy-field" style={{ marginTop: 10 }}>
              <label>Formatos sugeridos</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {e.formatos_sugeridos.map(f => (
                  <span key={f} className="badge badge-gray">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="prompts-section">
        <h4>Prompts generados ({data.prompts?.length || 0})</h4>
        <div className="prompt-cards">
          {(data.prompts || []).map((p, i) => (
            <PromptCard key={i} prompt={p} index={i} />
          ))}
        </div>
      </div>

      {data.estrategiaId && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          ✓ Guardado en Google Sheets — ID: {data.estrategiaId}
        </p>
      )}
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    setLoading(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'agent', content: data }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: 'Error conectando con el agente.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="chat-layout">
      <div className="chat-messages">
        {isEmpty && !loading && (
          <div className="welcome-message">
            <h3>Agente de Marketing — Shotygames</h3>
            <p>
              Soy tu experto en Meta Ads y estrategia creativa. Conozco Shotygames de pies a cabeza.
              Antes de darte ideas, analizo competencia y contexto para que nada sea genérico.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-btn" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: 'var(--radius)',
                  padding: '12px 16px',
                  maxWidth: 600,
                  fontSize: 14,
                  lineHeight: 1.5
                }}>
                  {msg.content}
                </div>
              </div>
            )}
            {msg.role === 'agent' && <ResponseCard data={msg.content} />}
            {msg.role === 'error' && (
              <p style={{ color: 'var(--red)', fontSize: 13 }}>{msg.content}</p>
            )}
          </div>
        ))}

        {loading && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              Investigando y generando estrategia...
            </p>
            <div className="loading-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          className="input"
          placeholder="Describe qué tipo de ad o estrategia necesitas para Shotygames..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Generar'}
        </button>
      </div>
    </div>
  )
}
