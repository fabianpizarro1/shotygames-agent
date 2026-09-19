'use client';

import { useEffect, useState } from 'react';
import { ANTICIPO_ENVIO, type Candidato } from '@/lib/recuperacion-tipos';
import { PLANTILLAS_RECUPERACION, linkRecuperacion, plantillaSugerida } from '@/lib/plantillas-recuperacion';
import {
  ESTILO_ACCION,
  ESTILO_BALDE,
  ETIQUETA_ACCION,
  ETIQUETA_BALDE,
  MOTIVO_ACCION,
  estiloMetodo,
} from '@/lib/ui-recuperacion';
import { fechaCorta, haceCuanto } from '@/lib/fechas';
import { usd } from '@/lib/ui';
import type { OpcionEstado, Cambios } from './TarjetaCandidato';

/**
 * El detalle de un candidato, de pie propio — antes vivía adentro de la
 * tarjeta (acordeón); ahora es el panel del medio de la cola de recuperación,
 * mismo patrón que PanelPedido en logística.
 */
export function PanelCandidato({
  c,
  estados,
  onCerrar,
  onGuardar,
}: {
  c: Candidato;
  estados: OpcionEstado[];
  onCerrar: () => void;
  onGuardar: (cambios: Cambios) => Promise<string | null>;
}) {
  const b = ESTILO_BALDE[c.balde];
  const acc = ESTILO_ACCION[c.accion];
  const sugerida = plantillaSugerida(c);
  const noEscribir = c.accion === 'no-escribir';
  // Mismo cálculo que en PanelPedido: con el teléfono conectado a Evolution,
  // el chat de la tercera columna ya ofrece las plantillas — el bloque de
  // wa.me de acá sobra en esa pantalla.
  const tieneChatVivo = Boolean(c.telefono);

  const [borrador, setBorrador] = useState<string | null>(null);
  const nota = borrador ?? c.nota;
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBorrador(null);
    setError(null);
  }, [c.id]);

  const aplicar = async (cambios: Cambios) => {
    setGuardando(true);
    const err = await onGuardar(cambios);
    setError(err);
    if (!err && cambios.nota !== undefined) setBorrador(null);
    setGuardando(false);
  };

  return (
    <div className="relative flex h-full flex-col bg-[var(--color-superficie)]">
      {/* `data-asa`: desde acá se arrastra la hoja hacia abajo en móvil, igual
          que PanelPedido. */}
      <header
        data-asa
        style={{ touchAction: 'none' }}
        className="sticky top-0 z-10 border-b border-[var(--color-borde)] bg-[var(--color-superficie)]/95 px-5 pt-6 pb-4 backdrop-blur lg:pt-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${acc.fondo} ${acc.texto}`}
              >
                <span className={`size-1.5 rounded-full ${acc.punto}`} />
                {ETIQUETA_ACCION[c.accion]}
              </span>
              <span className={`text-[11px] font-semibold ${b.texto}`}>{ETIQUETA_BALDE[c.balde]}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${estiloMetodo(c.metodoPago)}`}>
                {c.metodoPago || 'sin método'}
              </span>
              <span className="text-[11px] text-[var(--color-texto-tenue)]">{c.id}</span>
            </div>
            <h2 className="mt-1.5 truncate text-lg font-semibold">{c.nombre || 'Sin nombre'}</h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Cerrar"
            className="pulsable grid size-11 shrink-0 place-items-center rounded-full border border-[var(--color-borde)] text-[var(--color-texto-suave)]"
          >
            ✕
          </button>
        </div>

        {/* ── Estado, siempre a mano ───────────────────────────────────────
            Mismo patrón que PanelPedido: un desplegable pegado arriba en vez
            de una fila de botones al final del panel. */}
        <select
          value=""
          disabled={guardando}
          onChange={(e) => {
            const literal = e.target.value;
            if (literal) void aplicar({ estado: literal });
          }}
          className="pulsable mt-3 min-h-9 w-full rounded-lg border border-[var(--color-borde)] bg-[var(--color-fondo)] px-2.5 text-xs text-[var(--color-texto-suave)] outline-none disabled:opacity-50"
        >
          <option value="" disabled>
            {guardando ? 'Actualizando…' : `Estado: ${c.estado}`}
          </option>
          {estados
            .filter((e) => e.literal !== c.estado)
            .map((e) => (
              <option key={e.literal} value={e.literal} title={e.desc}>
                Pasar a: {e.texto}
              </option>
            ))}
        </select>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-5">
        {c.avisoPedidoVivo && (
          <p className="prosa mb-4 rounded-xl bg-[var(--color-ambar-tenue)] px-3 py-2 text-sm text-[var(--color-ambar)]">
            ⚠ Este teléfono ya tiene un pedido <b>{c.avisoPedidoVivo}</b> en la hoja oficial. Revisá
            que no sea este mismo antes de escribirle.
          </p>
        )}

        <p
          className={`prosa mb-5 rounded-xl px-3 py-2.5 text-sm ${
            noEscribir ? `${acc.fondo} text-[var(--color-texto-suave)]` : 'text-[var(--color-texto-suave)]'
          }`}
        >
          {MOTIVO_ACCION[c.accion]}
        </p>

        <dl className="mb-6 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
          <Dato t="Teléfono" v={c.telefono || '—'} />
          <Dato t="Pedido del" v={c.fecha ? fechaCorta(c.fecha) : '—'} />
          <Dato
            t="Historial en todo DROPI"
            v={
              c.dropi
                ? `${c.dropi.pedidos} pedidos · ${c.dropi.entregados} entregados · ${c.dropi.devueltos} devueltos`
                : 'sin datos todavía'
            }
            ancho
          />
          {c.tasaAjustada !== null && (
            <Dato
              t="Tasa de devolución"
              v={`${c.tasaAjustada}% ajustada · ${c.tasaDevolucion}% cruda · promedio DROPI 32%`}
              ancho
            />
          )}
          <Dato
            t="Con anticipo cobra"
            v={`${usd(ANTICIPO_ENVIO)} ahora + ${usd(c.saldoConAnticipo)} al entregar`}
            ancho
          />
          {c.direccion && <Dato t="Dirección" v={c.direccion} ancho />}
        </dl>

        {/* ── WhatsApp (wa.me) ──────────────────────────────────────────
            Solo hasta `xl`: desde ahí las mismas plantillas viven en la
            columna del chat y mandan directo. */}
        <div className={tieneChatVivo ? 'xl:hidden' : ''}>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">
            {noEscribir ? 'Mensajes (ninguno recomendado)' : 'Escribirle'}
          </p>
          <div className="mb-6 flex flex-col gap-2">
            {PLANTILLAS_RECUPERACION.map((pl) => {
              const esSugerida = pl.id === sugerida;
              const marcada = c.avisos.find((a) => a.id === pl.id);
              const marcable = pl.id !== 'libre';
              return (
                <div
                  key={pl.id}
                  className={`flex items-stretch gap-1 rounded-lg border ${
                    marcada
                      ? 'border-[var(--color-verde)]/40 bg-[var(--color-verde-tenue)]'
                      : esSugerida
                        ? 'border-[var(--color-verde)]/40'
                        : 'border-[var(--color-borde)]'
                  }`}
                >
                  <a
                    href={linkRecuperacion(c, pl.texto(c))}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      if (marcable && !marcada) void aplicar({ aviso: pl.id, enviado: true });
                    }}
                    className="pulsable min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <span className="block font-medium">
                      {pl.etiqueta}
                      {esSugerida && !marcada && (
                        <span className="ml-2 text-[10px] font-semibold text-[var(--color-verde)]">
                          SUGERIDO
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-texto-tenue)]">
                      {marcada ? `Mandado el ${marcada.fecha}` : pl.desc}
                    </span>
                  </a>

                  {marcable && (
                    <button
                      type="button"
                      aria-pressed={!!marcada}
                      aria-label={
                        marcada
                          ? `Destildar: al final no le mandé "${pl.etiqueta}"`
                          : `Marcar que le mandé "${pl.etiqueta}"`
                      }
                      disabled={guardando}
                      onClick={() => void aplicar({ aviso: pl.id, enviado: !marcada })}
                      className={`pulsable grid w-14 shrink-0 place-items-center rounded-lg border-l text-lg disabled:opacity-40 ${
                        marcada
                          ? 'border-[var(--color-verde)]/30 text-[var(--color-verde)]'
                          : 'border-[var(--color-borde)] text-[var(--color-texto-tenue)]'
                      }`}
                    >
                      {marcada ? '☑' : '☐'}
                    </button>
                  )}
                </div>
              );
            })}
            <p className="prosa px-1 text-[11px] text-[var(--color-texto-tenue)]">
              Se marca solo al abrir WhatsApp. Si al final no lo mandaste, destildá el check.
            </p>
          </div>
        </div>

        {/* ── Nota ──────────────────────────────────────────────────── */}
        <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">
          En qué quedó
        </label>
        <textarea
          value={nota}
          onChange={(e) => setBorrador(e.target.value)}
          rows={3}
          placeholder="Dijo que lo confirma mañana…"
          className="prosa w-full resize-y rounded-xl border border-[var(--color-borde)] bg-[var(--color-fondo)] px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--color-verde)]"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={guardando || nota === c.nota}
            onClick={() => void aplicar({ nota })}
            className="pulsable min-h-10 rounded-full border border-[var(--color-borde)] px-4 text-xs font-medium disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : 'Guardar nota'}
          </button>
          {nota !== c.nota && <span className="text-xs text-[var(--color-texto-tenue)]">sin guardar</span>}
        </div>

        {error && (
          <p className="prosa mt-4 rounded-xl bg-[var(--color-rojo-tenue)] px-3 py-2 text-sm text-[var(--color-rojo)]">
            ❌ {error}
          </p>
        )}

        <p className="mt-6 text-xs text-[var(--color-texto-tenue)]">Pedido creado {haceCuanto(c.dias)}</p>
      </div>
    </div>
  );
}

function Dato({ t, v, ancho }: { t: string; v: string; ancho?: boolean }) {
  return (
    <div className={ancho ? 'col-span-2' : ''}>
      <dt className="text-[10px] tracking-wide text-[var(--color-texto-tenue)] uppercase">{t}</dt>
      <dd className="prosa mt-0.5 text-[var(--color-texto-suave)]">{v}</dd>
    </div>
  );
}
