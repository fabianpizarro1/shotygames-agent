'use client';

import type { Candidato } from '@/lib/recuperacion-tipos';
import { ESTILO_ACCION, ESTILO_BALDE, ETIQUETA_ACCION, ETIQUETA_BALDE, estiloMetodo } from '@/lib/ui-recuperacion';
import { haceCuanto } from '@/lib/fechas';
import { usd } from '@/lib/ui';

export interface OpcionEstado {
  literal: string;
  texto: string;
  desc: string;
}

export interface Cambios {
  estado?: string;
  nota?: string;
  aviso?: string;
  enviado?: boolean;
}

/**
 * Una tarjeta de la lista de recuperación. Solo el resumen — el detalle
 * (mensajes, estado, nota) vive en `PanelCandidato`, mismo reparto que
 * `TarjetaPedido` / `PanelPedido` en la cola de logística.
 */
export function TarjetaCandidato({
  c,
  activa,
  onAbrir,
}: {
  c: Candidato;
  activa: boolean;
  onAbrir: () => void;
}) {
  const b = ESTILO_BALDE[c.balde];
  const acc = ESTILO_ACCION[c.accion];

  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-current={activa || undefined}
      className={`pulsable animar-aparecer relative w-full overflow-hidden rounded-[var(--radius-tarjeta)] border p-4 text-left ${
        activa
          ? 'border-[var(--color-verde)]/50 bg-[var(--color-verde-tenue)] ring-1 ring-[var(--color-verde)]/40'
          : 'border-[var(--color-borde)] bg-[var(--color-superficie)]'
      }`}
    >
      {/* Franja en lo que hay que HACER, no en el tipo de cliente: ámbar =
          pedirle el abono, verde = falta que confirme, nada = no escribirle. */}
      {c.accion !== 'no-escribir' && (
        <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${acc.punto}`} />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${acc.fondo} ${acc.texto}`}
            >
              <span className={`size-1.5 rounded-full ${acc.punto}`} />
              {ETIQUETA_ACCION[c.accion]}
            </span>

            {/* El balde queda como el dato que explica la acción. */}
            <span className={`text-[11px] font-semibold ${b.texto}`}>{ETIQUETA_BALDE[c.balde]}</span>

            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${estiloMetodo(c.metodoPago)}`}>
              {c.metodoPago || 'sin método'}
            </span>

            {c.avisos.length > 0 && (
              <span className="rounded bg-[var(--color-superficie-alta)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-texto-suave)]">
                avisado {c.avisos.length > 1 ? `×${c.avisos.length}` : ''}
              </span>
            )}

            {c.estado !== 'SIN COMPRAR' && (
              <span className="text-[10px] font-semibold tracking-wide text-[var(--color-texto-tenue)]">
                {c.estado}
              </span>
            )}
          </div>

          <p className="mt-2 truncate font-medium">{c.nombre || 'Sin nombre'}</p>
          <p className="truncate text-sm text-[var(--color-texto-suave)]">{c.descripcion || '—'}</p>
          <p className="mt-1 truncate text-xs text-[var(--color-texto-tenue)]">
            {c.ciudad || 'sin ciudad'} · {c.id}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold">{usd(c.monto)}</p>
          <p className="mt-0.5 text-xs text-[var(--color-texto-tenue)]">{haceCuanto(c.dias)}</p>
          {/* El color sale del NÚMERO, no del balde: "1/1 devueltos" en verde
              porque no llega al mínimo de 3 pedidos se lee como si estuviera
              todo bien, y no está todo bien — está sin saber. */}
          {c.dropi && c.dropi.pedidos > 0 && (
            <p className={`mt-1 text-xs font-semibold ${c.dropi ? ESTILO_BALDE[c.balde].texto : ''}`}>
              {c.dropi.devueltos}/{c.dropi.pedidos} devueltos
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
