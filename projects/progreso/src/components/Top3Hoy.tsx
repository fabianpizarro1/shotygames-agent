'use client';

import Link from 'next/link';
import { useState } from 'react';
import { completarTarea, fijarTop3, sugerirTop3 } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import type { ItemTop3 } from '@/lib/tipos';
import TextoIA from './TextoIA';

export interface ItemTop3Vista extends ItemTop3 {
  hecho: boolean;
  negocio: string;
}

export default function Top3Hoy({ fecha, items }: { fecha: string; items: ItemTop3Vista[] }) {
  const { pendiente, error, correr } = useAccion();
  const [sugerencia, setSugerencia] = useState<{ items: ItemTop3[]; motivo: string } | null>(null);

  function sugerir() {
    correr(() => sugerirTop3(fecha), setSugerencia);
  }

  function aceptar() {
    if (!sugerencia) return;
    correr(() => fijarTop3(fecha, sugerencia.items), () => setSugerencia(null));
  }

  if (!items.length) {
    return (
      <div className="tarjeta flex flex-col gap-3 p-4">
        {!sugerencia ? (
          <>
            <p className="text-sm text-[var(--color-texto-suave)]">
              Sin Top 3 para hoy. Máximo 3 resultados — no 18 prioridades.
            </p>
            <div className="flex gap-2">
              <button onClick={sugerir} disabled={pendiente} className="pulsable boton-primario flex-1">
                {pendiente ? 'Pensando…' : 'Sugerir con IA'}
              </button>
              <Link href="/tareas" className="pulsable boton flex-1 text-center">
                Elegir ⭐ en Tareas
              </Link>
            </div>
          </>
        ) : (
          <>
            <ol className="flex flex-col gap-1.5">
              {sugerencia.items.map((it, i) => (
                <li key={it.id} className="text-sm font-medium">
                  {i + 1}. {it.texto}
                </li>
              ))}
            </ol>
            <div className="text-[var(--color-texto-suave)] [&_div]:text-xs [&_p]:text-xs">
              <TextoIA texto={sugerencia.motivo} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSugerencia(null)} className="pulsable boton flex-1">
                Descartar
              </button>
              <button onClick={aceptar} disabled={pendiente || !sugerencia.items.length} className="pulsable boton-primario flex-1">
                Usar estas
              </button>
            </div>
          </>
        )}
        {error && <p className="text-sm text-[var(--color-rojo)]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li
            key={it.id || it.texto}
            className={`tarjeta animar-aparecer flex items-center gap-3 px-4 py-3 ${it.hecho ? 'opacity-60' : ''}`}
          >
            <span className="w-4 text-lg font-bold text-[var(--color-acento)]">{i + 1}</span>
            <p className={`flex-1 text-sm font-medium ${it.hecho ? 'line-through' : ''}`}>{it.texto}</p>
            {it.id && (
              <button
                onClick={() => correr(() => completarTarea(it.id, !it.hecho))}
                disabled={pendiente}
                aria-label={it.hecho ? 'Reabrir' : 'Completar'}
                className={`pulsable flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                  it.hecho
                    ? 'border-[var(--color-verde)] bg-[var(--color-verde)] text-white'
                    : 'border-[var(--color-borde-fuerte)] text-transparent'
                }`}
              >
                ✓
              </button>
            )}
          </li>
        ))}
      </ol>
      {error && <p className="text-sm text-[var(--color-rojo)]">{error}</p>}
    </div>
  );
}
