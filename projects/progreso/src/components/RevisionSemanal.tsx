'use client';

import { useState } from 'react';
import { guardarSemana, redactarSemana } from '@/app/acciones';
import { IA_ACTIVA } from '@/lib/ia-activa';
import { useAccion } from '@/hooks/useAccion';
import type { Semana } from '@/lib/tipos';
import TextoIA from './TextoIA';

type Campos = Omit<Semana, 'semana' | 'resumenIa' | 'cerradaEn'>;

const PREGUNTAS: { campo: keyof Campos; label: string }[] = [
  { campo: 'funciono', label: '1. ¿Qué funcionó?' },
  { campo: 'noFunciono', label: '2. ¿Qué no?' },
  { campo: 'dejar', label: '3. ¿Qué debemos dejar de hacer?' },
  { campo: 'delegar', label: '4. ¿Qué puedo delegar?' },
  { campo: 'automatizar', label: '5. ¿Qué puedo automatizar?' },
  { campo: 'cuelloBotella', label: '6. Cuello de botella de la próxima semana' },
  { campo: 'prioridades', label: '7. Las 3 prioridades' },
];

export default function RevisionSemanal({ semana }: { semana: Semana }) {
  const [c, setC] = useState<Campos>({
    funciono: semana.funciono,
    noFunciono: semana.noFunciono,
    dejar: semana.dejar,
    delegar: semana.delegar,
    automatizar: semana.automatizar,
    cuelloBotella: semana.cuelloBotella,
    prioridades: semana.prioridades,
  });
  const [resumen, setResumen] = useState(semana.resumenIa);
  const [guardado, setGuardado] = useState(false);
  const { pendiente, error, correr } = useAccion();

  return (
    <div className="flex flex-col gap-5">
      {(IA_ACTIVA || resumen) && (
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="titulo-seccion">Resumen de la IA</h2>
          {IA_ACTIVA && (
            <button
              onClick={() => correr(() => redactarSemana(), setResumen)}
              disabled={pendiente}
              className="text-xs font-semibold text-[var(--color-acento)]"
            >
              {pendiente ? 'Escribiendo…' : resumen ? 'Regenerar' : 'Generar'}
            </button>
          )}
        </div>
        <div className="tarjeta p-4">
          {resumen ? (
            <TextoIA texto={resumen} />
          ) : (
            <p className="text-sm text-[var(--color-texto-tenue)]">Genera el resumen con los números de la semana.</p>
          )}
        </div>
      </section>
      )}

      <section className="flex flex-col gap-3">
        {PREGUNTAS.map((p) => (
          <label key={p.campo} className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{p.label}</span>
            <textarea
              rows={2}
              value={c[p.campo]}
              onChange={(e) => {
                setC({ ...c, [p.campo]: e.target.value });
                setGuardado(false);
              }}
              className="campo resize-none text-sm"
            />
          </label>
        ))}
      </section>

      <button
        onClick={() => correr(() => guardarSemana(c, true), () => setGuardado(true))}
        disabled={pendiente}
        className="pulsable boton-primario py-3.5 text-base"
      >
        {guardado ? '✓ Semana cerrada' : 'Cerrar la semana'}
      </button>
      {error && <p className="text-sm text-[var(--color-rojo)]">{error}</p>}
    </div>
  );
}
