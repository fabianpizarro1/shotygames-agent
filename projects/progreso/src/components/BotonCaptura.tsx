'use client';

import { useEffect, useRef, useState } from 'react';
import { capturar, deshacerCaptura } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import { LABEL_CLASE_INBOX, type ClaseInbox } from '@/lib/tipos';

interface Capturado {
  clase: ClaseInbox;
  titulo: string;
  comentario: string;
  tareaId: string;
}

// Inbox: un campo, Enter, y la IA decide qué es. Capturar no puede costar más
// que el pensamiento que se está capturando.
export default function BotonCaptura() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [ultimo, setUltimo] = useState<Capturado | null>(null);
  const [deshecho, setDeshecho] = useState(false);
  const { pendiente, error, correr } = useAccion();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (abierto) ref.current?.focus();
  }, [abierto]);

  function enviar() {
    const t = texto.trim();
    if (!t || pendiente) return;
    correr(
      () => capturar(t),
      (r) => {
        setUltimo(r);
        setDeshecho(false);
        setTexto('');
      }
    );
  }

  function deshacer() {
    if (!ultimo) return;
    correr(() => deshacerCaptura(ultimo.tareaId, ultimo.titulo), () => setDeshecho(true));
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label="Capturar en el inbox"
        className="pulsable fixed right-5 z-20 flex size-14 items-center justify-center rounded-full bg-[var(--color-acento)] text-3xl leading-none text-white shadow-lg"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        +
      </button>

      {abierto && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={() => setAbierto(false)}>
          <div
            className="animar-subir w-full max-w-lg rounded-t-3xl border-t border-[var(--color-borde)] bg-[var(--color-superficie)] p-4 pad-abajo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Inbox — escribe y suelta</p>
              <button onClick={() => setAbierto(false)} className="pulsable rounded-lg px-2 py-1 text-[var(--color-texto-tenue)]">
                ✕
              </button>
            </div>
            <textarea
              ref={ref}
              rows={2}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              placeholder="Preguntar a Marcelo por dados · Idea anuncio: pareja aburrida Netflix…"
              className="campo resize-none"
            />
            <button onClick={enviar} disabled={pendiente || !texto.trim()} className="pulsable boton-primario mt-2 w-full">
              {pendiente ? 'Clasificando…' : 'Capturar'}
            </button>

            {error && <p className="mt-2 text-sm text-[var(--color-rojo)]">{error}</p>}

            {ultimo && (
              <div className="animar-aparecer mt-3 rounded-xl bg-[var(--color-superficie-alta)] px-3 py-2 text-sm">
                {deshecho ? (
                  <p className="text-[var(--color-texto-tenue)]">Deshecho.</p>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold text-[var(--color-acento)]">{LABEL_CLASE_INBOX[ultimo.clase]}</span>{' '}
                      {ultimo.titulo}
                    </p>
                    {ultimo.comentario && <p className="mt-0.5 text-xs text-[var(--color-texto-suave)]">{ultimo.comentario}</p>}
                    <button onClick={deshacer} disabled={pendiente} className="mt-1 text-xs font-medium text-[var(--color-texto-tenue)] underline">
                      Deshacer
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
