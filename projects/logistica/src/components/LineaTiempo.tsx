'use client';

import type { Movimiento } from '@/lib/tipos';
import { fechaCorta } from '@/lib/fechas';
import { iconoMovimiento } from '@/lib/ui';

/**
 * El recorrido real del paquete, del movimiento más reciente hacia abajo.
 *
 * Se muestran los movimientos de la transportadora y no el historial de
 * estados de DROPI: el historial dice "NOVEDAD", el movimiento dice qué pasó.
 * Si la transportadora todavía no reportó nada, se cae al historial en vez de
 * mostrar un hueco.
 */
export function LineaTiempo({
  movimientos,
  vacio = 'Sin movimientos reportados todavía.',
}: {
  movimientos: Movimiento[];
  vacio?: string;
}) {
  if (!movimientos.length) {
    return <p className="prosa text-sm text-[var(--color-texto-tenue)]">{vacio}</p>;
  }

  return (
    <ol className="relative">
      {movimientos.map((m, i) => {
        const ultimo = i === movimientos.length - 1;
        const actual = i === 0;
        const alerta = /NOVEDAD|DEVOL|RECHAZ/i.test(m.movimiento);
        const exito = /ENTREGAD/i.test(m.movimiento);

        const color = exito
          ? 'var(--color-verde)'
          : alerta
            ? 'var(--color-ambar)'
            : actual
              ? 'var(--color-texto)'
              : 'var(--color-texto-tenue)';

        return (
          <li key={`${m.fecha}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            {/* La línea se corta en el último punto para que no quede colgando. */}
            {!ultimo && (
              <span
                aria-hidden
                className="absolute top-6 left-[11px] bottom-0 w-px bg-[var(--color-borde)]"
              />
            )}

            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center rounded-full border text-[10px] leading-none"
              style={{
                color,
                borderColor: actual || alerta || exito ? color : 'var(--color-borde)',
                background: 'var(--color-superficie)',
              }}
            >
              {iconoMovimiento(m.movimiento)}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p
                  className="text-sm leading-snug font-medium"
                  style={{ color: actual || alerta || exito ? color : 'var(--color-texto-suave)' }}
                >
                  {m.movimiento}
                </p>
                <time className="shrink-0 text-xs text-[var(--color-texto-tenue)]">
                  {fechaCorta(m.fecha)}
                </time>
              </div>
              {m.motivo && (
                <p className="prosa mt-0.5 text-xs text-[var(--color-texto-tenue)]">{m.motivo}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
