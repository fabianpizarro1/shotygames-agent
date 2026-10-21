'use client';

import type { NovedadDropi } from '@/lib/tipos';
import { fechaCorta } from '@/lib/fechas';

/**
 * El "Historial de novedades" de DROPI, la más reciente arriba. Lo que más
 * importa es el comentario de la transportadora ("SE NIEGA A RECIBIR",
 * "retiro oficina de la floresta"): es el único lugar donde dice POR QUÉ falló
 * la entrega — el movimiento solo trae "DEVOLUCION DE DISTRIBUCION".
 */
export function HistorialNovedades({ novedades }: { novedades: NovedadDropi[] }) {
  if (!novedades.length) return null;

  return (
    <ul className="space-y-2">
      {novedades.map((n, i) => (
        <li
          key={`${n.fecha}-${i}`}
          className="rounded-lg border border-[var(--color-borde)] bg-[var(--color-fondo)] px-3 py-2"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="text-sm leading-snug font-medium text-[var(--color-ambar)]">
              {n.novedad || 'Novedad'}
            </p>
            <time className="shrink-0 text-xs text-[var(--color-texto-tenue)]">
              {fechaCorta(n.fecha)}
            </time>
          </div>

          {n.comentario && (
            <p className="prosa mt-1 text-sm text-[var(--color-texto)]">
              <span className="text-xs text-[var(--color-texto-tenue)]">Transportadora: </span>
              {n.comentario}
            </p>
          )}
          {n.aclaracion && (
            <p className="prosa mt-1 text-xs text-[var(--color-texto-suave)]">
              <span className="text-[var(--color-texto-tenue)]">Aclaración: </span>
              {n.aclaracion}
            </p>
          )}
          {n.solucion && (
            <p className="prosa mt-1 text-xs text-[var(--color-verde)]">
              <span className="text-[var(--color-texto-tenue)]">Solución: </span>
              {n.solucion}
              {n.fechaSolucion && (
                <span className="text-[var(--color-texto-tenue)]"> · {fechaCorta(n.fechaSolucion)}</span>
              )}
            </p>
          )}
          {n.observacion && (
            <p className="prosa mt-1 text-xs text-[var(--color-texto-suave)]">
              <span className="text-[var(--color-texto-tenue)]">Observación: </span>
              {n.observacion}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
