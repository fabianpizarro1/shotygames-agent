'use client';

import { avanzarEtapa, guardarProyecto } from '@/app/acciones';
import { useAccion } from '@/hooks/useAccion';
import { labelNegocio, progresoProyecto, type EstadoProyecto, type Proyecto } from '@/lib/tipos';

export default function TarjetaProyecto({
  p,
  pendientes,
  diasSinAvance,
}: {
  p: Proyecto;
  pendientes: number;
  diasSinAvance: number | null;
}) {
  const { pendiente, error, correr } = useAccion();
  const pct = progresoProyecto(p);
  const estado = (e: EstadoProyecto) => correr(() => guardarProyecto({ id: p.id, estado: e }));
  const activo = p.estado === 'ACTIVO';

  return (
    <li className={`tarjeta animar-aparecer p-4 ${pendiente ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{p.nombre}</p>
          <p className="text-xs text-[var(--color-texto-tenue)]">
            {labelNegocio(p.negocio)} · {p.clase === 'PRODUCTO' ? 'Producto' : 'Sistema'}
            {pendientes > 0 && ` · ${pendientes} tareas`}
            {activo && diasSinAvance !== null && diasSinAvance >= 3 && (
              <span className="font-semibold text-[var(--color-rojo)]"> · {diasSinAvance} d sin avanzar</span>
            )}
          </p>
        </div>
        <p className="text-2xl font-bold text-[var(--color-acento)]">{pct}%</p>
      </div>

      {p.objetivo && <p className="mt-1 text-sm text-[var(--color-texto-suave)]">{p.objetivo}</p>}

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-superficie-alta)]">
        <div className="h-full bg-[var(--color-acento)] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {activo && p.etapas.length > 0 && (
        <>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {p.etapas.map((e, i) => (
              <li key={e.nombre}>
                <button
                  onClick={() => correr(() => avanzarEtapa(p.id, i))}
                  onContextMenu={(ev) => {
                    ev.preventDefault();
                    correr(() => avanzarEtapa(p.id, i, true));
                  }}
                  disabled={pendiente}
                  className="pulsable relative overflow-hidden rounded-full border border-[var(--color-borde)] px-2.5 py-1 text-xs"
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-[var(--color-verde-tenue)]"
                    style={{ width: `${e.pct}%` }}
                    aria-hidden
                  />
                  <span className={`relative ${e.pct === 100 ? 'font-semibold text-[var(--color-verde)]' : ''}`}>
                    {e.pct === 100 ? '✓ ' : ''}
                    {e.nombre}
                    {e.pct > 0 && e.pct < 100 ? ` ${e.pct}%` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] text-[var(--color-texto-tenue)]">Toca una etapa para sumar 25%.</p>

          <label className="mt-3 block text-xs font-semibold text-[var(--color-texto-suave)]">Siguiente acción</label>
          <input
            defaultValue={p.siguienteAccion}
            placeholder="La próxima cosa física y concreta"
            onBlur={(e) =>
              e.target.value !== p.siguienteAccion &&
              correr(() => guardarProyecto({ id: p.id, siguienteAccion: e.target.value }))
            }
            className="campo mt-1 text-sm"
          />
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {p.estado !== 'ACTIVO' && p.estado !== 'TERMINADO' && (
          <button onClick={() => estado('ACTIVO')} disabled={pendiente} className="pulsable boton py-1.5 text-xs">
            Activar
          </button>
        )}
        {activo && (
          <button onClick={() => estado('PAUSADO')} disabled={pendiente} className="pulsable boton py-1.5 text-xs">
            Pausar
          </button>
        )}
        {p.estado !== 'TERMINADO' && (
          <button onClick={() => estado('TERMINADO')} disabled={pendiente} className="pulsable boton py-1.5 text-xs">
            Terminado ✓
          </button>
        )}
        {p.estado === 'TERMINADO' && (
          <button onClick={() => estado('EN_COLA')} disabled={pendiente} className="pulsable boton py-1.5 text-xs">
            Reabrir
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-[var(--color-rojo)]">{error}</p>}
    </li>
  );
}
