'use client';

import { useState } from 'react';
import TareaFila, { type TareaVista } from './TareaFila';
import { archivarTareas, crearTarea } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import { NEGOCIOS } from '@/lib/tipos';

export default function ListaTareas({
  hoy,
  activas,
  paraSoltar,
  muertas,
  hechas,
  top3Ids,
  proyectos,
}: {
  hoy: string;
  activas: TareaVista[];
  paraSoltar: TareaVista[];
  muertas: TareaVista[];
  hechas: TareaVista[];
  top3Ids: string[];
  proyectos: { id: string; nombre: string }[];
}) {
  const [filtro, setFiltro] = useState('');
  const [nueva, setNueva] = useState('');
  const [negocioNueva, setNegocioNueva] = useState('SHOTYGAMES');
  const { pendiente, error, correr } = useAccion();

  const f = (lista: TareaVista[]) => (filtro ? lista.filter((t) => t.negocio === filtro) : lista);
  const fila = (t: TareaVista) => (
    <TareaFila key={t.id} tarea={t} hoy={hoy} enTop3={top3Ids.includes(t.id)} proyectos={proyectos} />
  );

  function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nueva.trim()) return;
    correr(() => crearTarea({ tarea: nueva, negocio: negocioNueva }), () => setNueva(''));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {[{ id: '', label: 'Todo' }, ...NEGOCIOS].map((n) => (
          <button
            key={n.id}
            onClick={() => setFiltro(n.id)}
            className={`pulsable shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
              filtro === n.id
                ? 'border-[var(--color-acento)] bg-[var(--color-acento-tenue)] text-[var(--color-acento)]'
                : 'border-[var(--color-borde)] text-[var(--color-texto-suave)]'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      <form onSubmit={agregar} className="flex gap-2">
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nueva tarea (sin IA)…" className="campo flex-1" />
        <select value={negocioNueva} onChange={(e) => setNegocioNueva(e.target.value)} className="campo w-32">
          {NEGOCIOS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pendiente || !nueva.trim()} className="pulsable boton-primario">
          +
        </button>
      </form>
      {error && <p className="-mt-4 text-sm text-[var(--color-rojo)]">{error}</p>}

      <section>
        <h2 className="titulo-seccion">Pendientes por impacto ({f(activas).length})</h2>
        {f(activas).length ? (
          <ul className="flex flex-col gap-2">{f(activas).map(fila)}</ul>
        ) : (
          <p className="text-sm text-[var(--color-texto-tenue)]">Nada pendiente acá.</p>
        )}
      </section>

      {f(paraSoltar).length > 0 && (
        <section>
          <h2 className="titulo-seccion">Para soltar — siguen contigo ({f(paraSoltar).length})</h2>
          <ul className="flex flex-col gap-2">{f(paraSoltar).map(fila)}</ul>
        </section>
      )}

      {f(muertas).length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="titulo-seccion">Vencidas hace +60 días ({f(muertas).length})</h2>
            <button
              onClick={() => correr(() => archivarTareas(f(muertas).map((t) => t.id)))}
              disabled={pendiente}
              className="pulsable text-xs font-semibold text-[var(--color-acento)]"
            >
              Archivar todas
            </button>
          </div>
          <p className="mb-2 text-xs text-[var(--color-texto-tenue)]">
            Si llevan 2 meses vencidas, o no importaban o hay que reescribirlas. Rescata las que sigan vivas y archiva el resto.
          </p>
          <ul className="flex flex-col gap-2">{f(muertas).map(fila)}</ul>
        </section>
      )}

      {hechas.length > 0 && (
        <details>
          <summary className="titulo-seccion cursor-pointer">Hechas recientes ({hechas.length})</summary>
          <ul className="flex flex-col gap-2">{f(hechas).map(fila)}</ul>
        </details>
      )}
    </div>
  );
}
