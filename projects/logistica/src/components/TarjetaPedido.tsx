'use client';

import type { Pedido } from '@/lib/tipos';
import { haceCuanto } from '@/lib/fechas';
import { ESTILO_MOMENTO, ESTILO_PAGO, tiendaUI, usd } from '@/lib/ui';
import { ETIQUETA_PAGO } from '@/lib/pago';
import { ETIQUETA_MOMENTO } from '@/lib/momento';

/**
 * Una tarjeta de la cola. Está pensada para leerse en un segundo y decidir si
 * hay que abrirla: estado, quién, dónde, cuánto hace que no se mueve y la
 * primera alerta. Todo lo demás vive en el panel de detalle.
 */
export function TarjetaPedido({
  p,
  activa,
  onAbrir,
}: {
  p: Pedido;
  activa: boolean;
  onAbrir: () => void;
}) {
  // El badge grande es DÓNDE ESTÁ EL PAQUETE, no el estado del Sheet: el Sheet
  // se actualiza a mano y queda viejo. Un pedido que dice "Guía generada" pero
  // lleva tres días en una agencia tiene que gritar "En agencia".
  const est = ESTILO_MOMENTO[p.momento];
  const t = tiendaUI(p.tienda);
  const alerta = p.alertas[0];
  const rojo = alerta?.nivel === 'rojo';

  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-current={activa || undefined}
      className={`pulsable animar-aparecer relative w-full overflow-hidden rounded-[var(--radius-tarjeta)] border bg-[var(--color-superficie)] p-4 text-left ${
        activa
          ? 'border-[var(--color-borde-fuerte)] ring-1 ring-[var(--color-verde)]/40'
          : 'border-[var(--color-borde)]'
      }`}
    >
      {/* Franja de riesgo: la señal se ve antes de leer una sola palabra. */}
      {alerta && (
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-[3px] ${
            rojo ? 'bg-[var(--color-rojo)]' : 'bg-[var(--color-ambar)]'
          }`}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${est.fondo} ${est.texto}`}
            >
              <span className={`size-1.5 rounded-full ${est.punto}`} />
              {ETIQUETA_MOMENTO[p.momento]}
            </span>
            <span className={`text-[11px] font-semibold ${t.color}`}>{t.nombre}</span>

            {/* Cómo pagó. Solo donde varía: en Truquito y Avanora todo es
                contraentrega y el badge no diría nada. */}
            {p.metodoPago && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ESTILO_PAGO[p.metodoPago]}`}
              >
                {ETIQUETA_PAGO[p.metodoPago]}
              </span>
            )}
          </div>

          <p className="mt-2 truncate font-medium">{p.nombre || 'Sin nombre'}</p>
          <p className="truncate text-sm text-[var(--color-texto-suave)]">{p.descripcion || '—'}</p>
          <p className="mt-1 truncate text-xs text-[var(--color-texto-tenue)]">
            {p.ciudad}
            {p.provincia && `, ${p.provincia}`} · {p.id} · Sheet: {p.etiquetaEstado}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {/* En un pedido ya pagado el repartidor no cobra nada, así que el
              número que importa es lo que valió el pedido, no un $0.00. */}
          <p className="font-semibold">
            {p.metodoPago === 'anticipado' ? usd(p.anticipo) : usd(p.aCobrar)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-texto-tenue)]">
            {p.diasQuieto !== null ? `movió ${haceCuanto(p.diasQuieto)}` : haceCuanto(p.dias)}
          </p>
        </div>
      </div>

      {alerta && (
        <p
          className={`prosa mt-3 line-clamp-2 rounded-lg px-2.5 py-1.5 text-xs ${
            rojo
              ? 'bg-[var(--color-rojo-tenue)] text-[var(--color-rojo)]'
              : 'bg-[var(--color-ambar-tenue)] text-[var(--color-ambar)]'
          }`}
        >
          {alerta.texto}
          {p.alertas.length > 1 && (
            <span className="opacity-60"> · +{p.alertas.length - 1} más</span>
          )}
        </p>
      )}

      {/* La nota va en la tarjeta, no escondida en el detalle: es lo que Fabián
          escribió sobre este pedido (si ya llamó al cliente, qué quedó
          pendiente) y sirve para decidir sin tener que abrirlo. */}
      {p.notas && (
        <p className="prosa mt-2 line-clamp-3 rounded-lg border border-[var(--color-borde)] bg-[var(--color-fondo)] px-2.5 py-1.5 text-xs text-[var(--color-texto-suave)]">
          <span className="text-[var(--color-texto-tenue)]">Nota: </span>
          {p.notas}
        </p>
      )}
    </button>
  );
}
