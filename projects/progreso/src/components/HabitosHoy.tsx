'use client';

import { useOptimistic } from 'react';
import { marcarHabito, sumarContador } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import type { Habito } from '@/lib/tipos';

export default function HabitosHoy({
  fecha,
  habitos,
  hechos,
  contadores,
  fallasAyer,
}: {
  fecha: string;
  habitos: Habito[];
  hechos: string[];
  contadores: { id: string; label: string; hoy: number; semana: number; meta: number }[];
  fallasAyer: string[];
}) {
  const { error, correr } = useAccion();
  const [optHechos, setOptHechos] = useOptimistic(hechos, (estado, cambio: { id: string; hecho: boolean }) =>
    cambio.hecho ? [...estado, cambio.id] : estado.filter((x) => x !== cambio.id)
  );
  const [optCont, setOptCont] = useOptimistic(contadores, (estado, cambio: { id: string; delta: number }) =>
    estado.map((c) =>
      c.id === cambio.id ? { ...c, hoy: Math.max(0, c.hoy + cambio.delta), semana: Math.max(0, c.semana + cambio.delta) } : c
    )
  );

  function toggle(id: string) {
    const hecho = !optHechos.includes(id);
    correr(async () => {
      setOptHechos({ id, hecho });
      return marcarHabito(fecha, id, hecho);
    });
  }

  function sumar(id: string, delta: number) {
    correr(async () => {
      setOptCont({ id, delta });
      return sumarContador(fecha, id, delta);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {habitos.map((h) => {
          const hecho = optHechos.includes(h.id);
          const fallóAyer = fallasAyer.includes(h.id);
          return (
            <button
              key={h.id}
              onClick={() => toggle(h.id)}
              className={`pulsable relative rounded-xl border px-2 py-3 text-sm font-medium transition-colors ${
                hecho
                  ? 'animar-logro border-[var(--color-verde)] bg-[var(--color-verde-tenue)] text-[var(--color-verde)]'
                  : fallóAyer
                    ? 'border-[var(--color-rojo)] bg-[var(--color-superficie)]'
                    : 'border-[var(--color-borde)] bg-[var(--color-superficie)]'
              }`}
            >
              {hecho ? '✓ ' : ''}
              {h.label}
              {!hecho && fallóAyer && (
                <span className="block text-[10px] font-semibold text-[var(--color-rojo)]">no falles 2 veces</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {optCont.map((c) => (
          <div key={c.id} className="tarjeta px-2 py-2 text-center">
            <p className="text-xs text-[var(--color-texto-tenue)]">{c.label}</p>
            <p className="text-lg font-bold">
              {c.semana}
              <span className="text-xs font-normal text-[var(--color-texto-tenue)]">/{c.meta} sem</span>
            </p>
            <div className="mt-1 flex justify-center gap-1">
              <button
                onClick={() => sumar(c.id, -1)}
                disabled={c.hoy === 0}
                aria-label={`Restar ${c.label}`}
                className="pulsable size-8 rounded-lg border border-[var(--color-borde)] disabled:opacity-30"
              >
                −
              </button>
              <button
                onClick={() => sumar(c.id, 1)}
                aria-label={`Sumar ${c.label}`}
                className="pulsable size-8 rounded-lg bg-[var(--color-acento-tenue)] font-bold text-[var(--color-acento)]"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-[var(--color-rojo)]">{error}</p>}
    </div>
  );
}
