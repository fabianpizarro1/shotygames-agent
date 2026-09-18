'use client';

// Hilo de WhatsApp del cliente, dentro del pedido. Solo ShotyGames: es el
// único número (`shotygames`) conectado a Evolution — ver whatsapp-chat.ts.
//
// Sin webhook ni tiempo real "de verdad": relee cada 8s mientras el panel
// está abierto. A propósito — ver el comentario en whatsapp-chat.ts sobre por
// qué el CRM anterior se sentía inconsistente.

import { useEffect, useRef, useState } from 'react';
import { fechaCorta } from '@/lib/fechas';

interface MensajeChat {
  id: string;
  direccion: 'in' | 'out';
  texto: string;
  fecha: string;
}

const INTERVALO_MS = 8000;

export function ChatPedido({ telefono, nombre }: { telefono: string; nombre: string }) {
  const [mensajes, setMensajes] = useState<MensajeChat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const ultimoId = useRef<string | null>(null);

  async function cargar() {
    try {
      const r = await fetch(`/api/chat?telefono=${encodeURIComponent(telefono)}`);
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Error leyendo el chat');
      setMensajes(data.mensajes);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error leyendo el chat');
    }
  }

  useEffect(() => {
    setMensajes(null);
    setError(null);
    cargar();
    const id = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telefono]);

  // Autoscroll solo cuando llega un mensaje nuevo de verdad, no en cada
  // repoll — si Fabián está leyendo hacia arriba, no lo interrumpe.
  useEffect(() => {
    if (!mensajes?.length) return;
    const ultimo = mensajes[mensajes.length - 1].id;
    if (ultimo !== ultimoId.current) {
      ultimoId.current = ultimo;
      listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
    }
  }, [mensajes]);

  async function enviar() {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch('/api/chat/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, texto: limpio }),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Error enviando el WhatsApp');
      setTexto('');
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error enviando el WhatsApp');
    } finally {
      setEnviando(false);
    }
  }

  if (!telefono) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-[var(--color-borde)]">
      <div
        ref={listaRef}
        className="max-h-72 space-y-2 overflow-y-auto bg-[var(--color-fondo)] p-3"
      >
        {mensajes === null && !error && (
          <p className="py-4 text-center text-xs text-[var(--color-texto-tenue)]">Cargando…</p>
        )}
        {mensajes?.length === 0 && (
          <p className="py-4 text-center text-xs text-[var(--color-texto-tenue)]">
            Todavía no hay mensajes con {nombre || 'este cliente'}.
          </p>
        )}
        {mensajes?.map((m) => (
          <div key={m.id} className={`flex ${m.direccion === 'out' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                m.direccion === 'out'
                  ? 'bg-[var(--color-verde-tenue)] text-[var(--color-texto)]'
                  : 'bg-[var(--color-superficie-alta)] text-[var(--color-texto)]'
              }`}
            >
              <p className="prosa whitespace-pre-wrap break-words">{m.texto}</p>
              <p className="mt-0.5 text-right text-[10px] text-[var(--color-texto-tenue)]">
                {fechaCorta(m.fecha)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="prosa border-t border-[var(--color-borde)] bg-[var(--color-rojo-tenue)] px-3 py-2 text-xs text-[var(--color-rojo)]">
          ❌ {error}
        </p>
      )}

      <div className="flex items-end gap-2 border-t border-[var(--color-borde)] bg-[var(--color-superficie)] p-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          rows={1}
          placeholder="Escribir…"
          className="min-h-11 flex-1 resize-none rounded-lg border border-[var(--color-borde)] bg-[var(--color-fondo)] px-3 py-2 text-sm outline-none focus:border-[var(--color-verde)]"
        />
        <button
          type="button"
          disabled={!texto.trim() || enviando}
          onClick={enviar}
          className="pulsable min-h-11 shrink-0 rounded-lg bg-[var(--color-verde)] px-4 text-sm font-semibold text-[#08110c] disabled:opacity-40"
        >
          {enviando ? '…' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
