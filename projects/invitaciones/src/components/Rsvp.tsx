'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

type Estado = 'pendiente' | 'confirmado' | 'no_asiste';

interface Props {
  token: string;
  cupos: number;
  inicial: { estado: Estado; asistentes: number; mensaje: string };
  limite: string;
  deshabilitado?: boolean;
  onEstado?: (e: Estado) => void;
}

const campo = 'w-full rounded-md border bg-white/70 px-3 py-2.5 text-[1.12rem] outline-none transition-colors focus:bg-white';

export function Rsvp({ token, cupos, inicial, limite, deshabilitado = false, onEstado }: Props) {
  const [estado, setEstado] = useState<Estado>(inicial.estado);
  const [editando, setEditando] = useState(inicial.estado === 'pendiente');
  const [elegido, setElegido] = useState<'confirmado' | 'no_asiste' | null>(
    inicial.estado === 'pendiente' ? null : inicial.estado,
  );
  const [asistentes, setAsistentes] = useState(Math.max(1, inicial.asistentes || 1));
  const [mensaje, setMensaje] = useState(inicial.mensaje);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar() {
    if (!elegido || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const r = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, estado: elegido, asistentes, mensaje }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'No se pudo guardar');
      setEstado(j.estado);
      onEstado?.(j.estado);
      setEditando(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setEnviando(false);
    }
  }

  const gracias = estado === 'confirmado' ? '¡Te esperamos!' : 'Gracias por avisar';
  const detalle =
    estado === 'confirmado'
      ? `Quedó confirmada tu asistencia${cupos > 1 ? ` (${asistentes} ${asistentes === 1 ? 'persona' : 'personas'})` : ''}.`
      : 'Te vamos a extrañar.';

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {!editando ? (
          <motion.div
            key="listo"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="text-center"
          >
            <p className="f-script text-[3.36rem] leading-none">{gracias}</p>
            <p className="mt-3 text-[17.36px] opacity-80">{detalle}</p>
            <button type="button" onClick={() => setEditando(true)} className="mt-4 block w-full text-[15.12px] underline underline-offset-4 opacity-70">
              Cambiar mi respuesta
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {([
                ['confirmado', 'Sí, voy'],
                ['no_asiste', 'No puedo'],
              ] as const).map(([valor, texto]) => {
                const activo = elegido === valor;
                return (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setElegido(valor)}
                    aria-pressed={activo}
                    className="boton rounded-md border-2 py-3.5 text-[17.36px] font-semibold"
                    style={{
                      borderColor: 'var(--texto)',
                      background: activo ? 'var(--texto)' : 'transparent',
                      color: activo ? 'var(--papel)' : 'var(--texto)',
                    }}
                  >
                    {texto}
                  </button>
                );
              })}
            </div>

            {elegido === 'confirmado' && cupos > 1 && (
              <label className="block text-[17.36px]">
                <span className="mb-1.5 block text-[15.12px] font-semibold uppercase tracking-widest opacity-70">¿Cuántos asisten? (máx. {cupos})</span>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setAsistentes((n) => Math.max(1, n - 1))} className="boton size-10 rounded-full border-2 text-[1.26rem]" style={{ borderColor: 'var(--texto)' }} aria-label="Menos">−</button>
                  <span className="f-serif w-6 text-center text-[1.68rem] font-semibold">{asistentes}</span>
                  <button type="button" onClick={() => setAsistentes((n) => Math.min(cupos, n + 1))} className="boton size-10 rounded-full border-2 text-[1.26rem]" style={{ borderColor: 'var(--texto)' }} aria-label="Más">+</button>
                </div>
              </label>
            )}

            {elegido && (
              <label className="block text-[17.36px]">
                <span className="mb-1.5 block text-[15.12px] font-semibold uppercase tracking-widest opacity-70">Un mensaje para la cumpleañera (opcional)</span>
                <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={500} rows={3} className={campo} style={{ borderColor: 'color-mix(in srgb, var(--texto) 35%, transparent)' }} />
              </label>
            )}

            {error && <p role="alert" className="text-center text-[17.36px] font-semibold">{error}</p>}

            <button
              type="button"
              onClick={enviar}
              disabled={!elegido || enviando || deshabilitado}
              className="boton w-full rounded-full py-3.5 text-[17.36px] font-semibold uppercase tracking-widest disabled:opacity-40"
              style={{ background: 'var(--texto)', color: 'var(--papel)' }}
            >
              {deshabilitado ? 'Vista previa (no envía)' : enviando ? 'Guardando…' : 'Enviar respuesta'}
            </button>
            {limite && <p className="text-center text-[15.12px] opacity-60">Confirma antes del {limite}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
