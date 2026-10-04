'use client';

import { useEffect, useRef, useState } from 'react';
import TextoIA from './TextoIA';

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
}

const RAPIDAS = ['¿Qué debería hacer ahora?', '¿Cómo voy esta semana?', 'Estoy saturado, ¿qué hago?', '¿Qué puedo dejar de hacer yo?'];

// El chat vive en el teléfono (localStorage, uno por día): el estado real ya
// lo trae la foto del momento en cada pregunta, el historial no necesita servidor.
export default function ChatIA({ fecha }: { fecha: string }) {
  const clave = `progreso-chat-${fecha}`;
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setMensajes(JSON.parse(localStorage.getItem(clave) ?? '[]'));
    } catch {}
  }, [clave]);

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(mensajes));
    } catch {}
    fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, clave]);

  async function enviar(pregunta: string) {
    const q = pregunta.trim();
    if (!q || enviando) return;
    const historial: Mensaje[] = [...mensajes, { role: 'user', content: q }];
    setMensajes([...historial, { role: 'assistant', content: '' }]);
    setTexto('');
    setEnviando(true);
    try {
      const r = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mensajes: historial }),
      });
      if (!r.ok || !r.body) throw new Error(r.status === 401 ? 'Sesión vencida, vuelve a entrar.' : `Error ${r.status}`);
      const lector = r.body.getReader();
      const dec = new TextDecoder();
      let acumulado = '';
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        acumulado += dec.decode(value, { stream: true });
        setMensajes([...historial, { role: 'assistant', content: acumulado }]);
      }
    } catch (e) {
      setMensajes([...historial, { role: 'assistant', content: `⚠️ ${e instanceof Error ? e.message : 'Error'}` }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!mensajes.length && (
        <p className="text-sm text-[var(--color-texto-suave)]">
          Conoce tu agenda, tus proyectos, tus tareas y cómo vas en la semana. No te va a dar la razón por darla.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {mensajes.map((m, i) =>
          m.role === 'user' ? (
            <p key={i} className="ml-10 self-end rounded-2xl rounded-br-md bg-[var(--color-acento)] px-3.5 py-2 text-sm text-white">
              {m.content}
            </p>
          ) : (
            <div key={i} className="tarjeta mr-4 px-3.5 py-2.5">
              {m.content ? <TextoIA texto={m.content} /> : <p className="text-sm text-[var(--color-texto-tenue)]">Pensando…</p>}
            </div>
          )
        )}
        <div ref={fin} />
      </div>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">
        {RAPIDAS.map((q) => (
          <button
            key={q}
            onClick={() => enviar(q)}
            disabled={enviando}
            className="pulsable shrink-0 rounded-full border border-[var(--color-borde)] px-3 py-1.5 text-xs disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="flex gap-2"
      >
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pregúntale lo que sea…" className="campo flex-1" />
        <button type="submit" disabled={enviando || !texto.trim()} className="pulsable boton-primario">
          {enviando ? '…' : 'Enviar'}
        </button>
      </form>

      {mensajes.length > 0 && !enviando && (
        <button onClick={() => setMensajes([])} className="self-center text-xs text-[var(--color-texto-tenue)] underline">
          Nueva conversación
        </button>
      )}
    </div>
  );
}
