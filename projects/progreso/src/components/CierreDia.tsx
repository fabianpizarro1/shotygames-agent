'use client';

import Link from 'next/link';
import { useState } from 'react';
import { aplicarCierre, cerrarSinIA, proponerCierre, type RespuestasCierre } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import { IA_ACTIVA } from '@/lib/ia-activa';
import TextoIA from './TextoIA';

type Propuesta = Extract<Awaited<ReturnType<typeof proponerCierre>>, { ok: true }>['data'];

const PREGUNTAS: { campo: keyof RespuestasCierre; label: string; placeholder: string }[] = [
  { campo: 'terminado', label: '¿Qué terminaste?', placeholder: 'Lo que quedó hecho de verdad' },
  { campo: 'pendiente', label: '¿Qué quedó pendiente?', placeholder: '' },
  { campo: 'aprendido', label: '¿Qué aprendiste?', placeholder: '' },
  { campo: 'problema', label: '¿Qué problema apareció?', placeholder: '' },
  { campo: 'manana', label: '¿Algo importante para mañana?', placeholder: '' },
];

export default function CierreDia({ inicial, completadasHoy, yaCerrado }: {
  inicial: RespuestasCierre;
  completadasHoy: string[];
  yaCerrado: boolean;
}) {
  const [r, setR] = useState<RespuestasCierre>(() => ({
    ...inicial,
    terminado: inicial.terminado || completadasHoy.join('; '),
  }));
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [usarTop3, setUsarTop3] = useState(true);
  const [moverOk, setMoverOk] = useState<Record<string, boolean>>({});
  const [etapasOk, setEtapasOk] = useState<Record<number, boolean>>({});
  const [listo, setListo] = useState(false);
  const { pendiente, error, correr } = useAccion();

  if (listo) {
    return (
      <div className="tarjeta p-6 text-center">
        <p className="text-2xl font-bold">Día cerrado.</p>
        <p className="prosa mt-1 text-sm text-[var(--color-texto-suave)]">
          Mañana ya tiene Top 3. Ahora a descansar — sin compensar trabajando de noche.
        </p>
        <Link href="/" className="pulsable boton-primario mt-5 inline-block px-6">
          Volver a Hoy
        </Link>
      </div>
    );
  }

  if (propuesta) {
    return (
      <div className="flex flex-col gap-5">
        <div className="tarjeta p-4">
          <TextoIA texto={propuesta.mensaje} />
        </div>

        {propuesta.top3.length > 0 && (
          <label className="tarjeta flex gap-3 p-4">
            <input type="checkbox" checked={usarTop3} onChange={(e) => setUsarTop3(e.target.checked)} className="mt-1 size-4" />
            <div>
              <p className="text-sm font-semibold">Top 3 de mañana</p>
              <ol className="mt-1 text-sm text-[var(--color-texto-suave)]">
                {propuesta.top3.map((t, i) => (
                  <li key={t.id}>
                    {i + 1}. {t.texto}
                  </li>
                ))}
              </ol>
            </div>
          </label>
        )}

        {propuesta.mover.length > 0 && (
          <div className="tarjeta p-4">
            <p className="mb-2 text-sm font-semibold">Reprogramar</p>
            {propuesta.mover.map((m) => (
              <label key={m.id} className="flex gap-3 py-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={moverOk[m.id] ?? true}
                  onChange={(e) => setMoverOk({ ...moverOk, [m.id]: e.target.checked })}
                  className="mt-1 size-4"
                />
                <span>
                  {m.texto} <span className="text-[var(--color-texto-tenue)]">{m.antes || 'sin fecha'} → {m.nueva_fecha}</span>
                  <span className="block text-xs text-[var(--color-texto-tenue)]">{m.motivo}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {propuesta.etapas.length > 0 && (
          <div className="tarjeta p-4">
            <p className="mb-2 text-sm font-semibold">Avances de proyecto</p>
            {propuesta.etapas.map((e, i) => (
              <label key={i} className="flex gap-3 py-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={etapasOk[i] ?? true}
                  onChange={(ev) => setEtapasOk({ ...etapasOk, [i]: ev.target.checked })}
                  className="mt-1 size-4"
                />
                <span>
                  {e.proyecto}: {e.etapa} → {e.pct}%
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setPropuesta(null)} className="pulsable boton flex-1">
            Volver
          </button>
          <button
            onClick={() =>
              correr(
                () =>
                  aplicarCierre({
                    top3: usarTop3 ? propuesta.top3 : [],
                    mover: propuesta.mover.filter((m) => moverOk[m.id] ?? true),
                    etapas: propuesta.etapas.filter((_, i) => etapasOk[i] ?? true),
                  }),
                () => setListo(true)
              )
            }
            disabled={pendiente}
            className="pulsable boton-primario flex-[2]"
          >
            {pendiente ? 'Aplicando…' : 'Aplicar y cerrar el día'}
          </button>
        </div>
        {error && <p className="text-sm text-[var(--color-rojo)]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {yaCerrado && (
        <p className="rounded-xl bg-[var(--color-verde-tenue)] px-3 py-2 text-sm text-[var(--color-verde)]">
          Ya cerraste hoy. Puedes volver a cerrarlo si cambió algo.
        </p>
      )}
      {PREGUNTAS.map((p) => (
        <label key={p.campo} className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{p.label}</span>
          <textarea
            rows={2}
            value={r[p.campo]}
            placeholder={p.placeholder}
            onChange={(e) => setR({ ...r, [p.campo]: e.target.value })}
            className="campo resize-none text-sm"
          />
        </label>
      ))}
      {IA_ACTIVA ? (
        <>
          <button
            onClick={() => correr(() => proponerCierre(r), setPropuesta)}
            disabled={pendiente}
            className="pulsable boton-primario py-3.5 text-base"
          >
            {pendiente ? 'La IA está armando mañana…' : 'Cerrar y proponer mañana'}
          </button>
          <button
            onClick={() => correr(() => cerrarSinIA(r), () => setListo(true))}
            disabled={pendiente}
            className="text-sm text-[var(--color-texto-tenue)] underline"
          >
            Cerrar sin IA
          </button>
        </>
      ) : (
        <button
          onClick={() => correr(() => cerrarSinIA(r), () => setListo(true))}
          disabled={pendiente}
          className="pulsable boton-primario py-3.5 text-base"
        >
          {pendiente ? 'Guardando…' : 'Cerrar el día'}
        </button>
      )}
      {error && <p className="text-sm text-[var(--color-rojo)]">{error}</p>}
    </div>
  );
}
