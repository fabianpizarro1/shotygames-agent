'use client';

import { useState } from 'react';
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
 * Un pedido web que no se cerró. Cerrada se lee en un segundo (quién, cuánto,
 * cuánto hace y si devuelve); abierta trae lo único que hay que hacer: mandarle
 * el mensaje que le corresponde y anotar en qué quedó.
 */
export function TarjetaCandidato({
  c,
  abierta,
  estados,
  onAbrir,
  onGuardar,
}: {
  c: Candidato;
  abierta: boolean;
  estados: OpcionEstado[];
  onAbrir: () => void;
  onGuardar: (cambios: Cambios) => Promise<string | null>;
}) {
  const b = ESTILO_BALDE[c.balde];
  const acc = ESTILO_ACCION[c.accion];
  const sugerida = plantillaSugerida(c);
  const noEscribir = c.accion === 'no-escribir';

  // Mientras se escribe manda el borrador; cuando no hay borrador manda la
  // hoja. Así un refresco de la lista (que los hay: el cron de reputación y el
  // registro de pedidos también tocan esa fila) no pisa lo que Fabián está
  // tecleando, y guardar devuelve el control a la hoja sin sincronizar nada.
  const [borrador, setBorrador] = useState<string | null>(null);
  const nota = borrador ?? c.nota;
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aplicar = async (cambios: Cambios) => {
    setGuardando(true);
    const err = await onGuardar(cambios);
    setError(err);
    if (!err && cambios.nota !== undefined) setBorrador(null);
    setGuardando(false);
  };

  return (
    <article
      className={`animar-aparecer relative overflow-hidden rounded-[var(--radius-tarjeta)] border bg-[var(--color-superficie)] ${
        abierta ? 'border-[var(--color-borde-fuerte)]' : 'border-[var(--color-borde)]'
      }`}
    >
      {/* Franja en lo que hay que HACER, no en el tipo de cliente: ámbar =
          pedirle el abono, verde = falta que confirme, nada = no escribirle. */}
      {!noEscribir && (
        <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${acc.punto}`} />
      )}

      <button type="button" onClick={onAbrir} className="pulsable w-full p-4 text-left">
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
              <span className={`text-[11px] font-semibold ${b.texto}`}>
                {ETIQUETA_BALDE[c.balde]}
              </span>

              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${estiloMetodo(c.metodoPago)}`}
              >
                {c.metodoPago || 'sin método'}
              </span>

              {/* Que ya se le escribió es lo primero que hay que saber, o se le
                  escribe dos veces el mismo día. */}
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
            <p className="truncate text-sm text-[var(--color-texto-suave)]">
              {c.descripcion || '—'}
            </p>
            <p className="mt-1 truncate text-xs text-[var(--color-texto-tenue)]">
              {c.ciudad || 'sin ciudad'} · {c.id}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-semibold">{usd(c.monto)}</p>
            <p className="mt-0.5 text-xs text-[var(--color-texto-tenue)]">{haceCuanto(c.dias)}</p>
            {/* La reputación va en la tarjeta cerrada: es el dato que decide qué
                mensaje le toca, no un detalle del panel.

                El color sale del NÚMERO, no del balde: "1/1 devueltos" en verde
                porque no llega al mínimo de 3 pedidos se lee como si estuviera
                todo bien, y no está todo bien — está sin saber. */}
            {c.dropi && c.dropi.pedidos > 0 && (
              <p className={`mt-1 text-xs font-semibold ${colorDevoluciones(c)}`}>
                {c.dropi.devueltos}/{c.dropi.pedidos} devueltos
              </p>
            )}
          </div>
        </div>
      </button>

      {abierta && (
        <div className="animar-aparecer border-t border-[var(--color-borde)] px-4 pt-3 pb-4">
          {/* El teléfono ya tiene un pedido vivo en la hoja oficial: puede ser
              ESTE mismo, registrado a mano sin el código de la web. Es un aviso
              y no una exclusión porque no se puede distinguir. */}
          {c.avisoPedidoVivo && (
            <p className="prosa mb-3 rounded-lg bg-[var(--color-ambar-tenue)] px-3 py-2 text-xs text-[var(--color-ambar)]">
              ⚠ Este teléfono ya tiene un pedido <b>{c.avisoPedidoVivo}</b> en la hoja oficial.
              Revisá que no sea este mismo antes de escribirle.
            </p>
          )}

          <p
            className={`prosa mb-3 rounded-lg px-3 py-2 text-xs ${
              noEscribir
                ? `${acc.fondo} text-[var(--color-texto-suave)]`
                : 'text-[var(--color-texto-suave)]'
            }`}
          >
            {MOTIVO_ACCION[c.accion]}
          </p>

          <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">
            <Dato t="Teléfono" v={c.telefono || '—'} />
            <Dato t="Pedido del" v={c.fecha ? fechaCorta(c.fecha) : '—'} />
            {/* Es el historial en TODA la plataforma DROPI, comprándole a
                cualquier dropshipper — no los pedidos que te hizo a vos. */}
            <Dato
              t="Historial en todo DROPI"
              v={
                c.dropi
                  ? `${c.dropi.pedidos} pedidos · ${c.dropi.entregados} entregados · ${c.dropi.devueltos} devueltos`
                  : 'sin datos todavía'
              }
            />
            {/* La AJUSTADA es la que decide el balde; la cruda va al lado para
                que se entienda de dónde salió. Mostrar solo la cruda haría
                parecer un error que alguien "al 100%" no sea el peor de la
                lista, y solo la ajustada obligaría a confiar a ciegas. */}
            {c.tasaAjustada !== null && (
              <Dato
                t="Tasa de devolución"
                v={`${c.tasaAjustada}% ajustada · ${c.tasaDevolucion}% cruda · promedio DROPI 32%`}
                ancho
              />
            )}
            <Dato t="Con anticipo cobra" v={`${usd(ANTICIPO_ENVIO)} ahora + ${usd(c.saldoConAnticipo)} al entregar`} />
            {c.direccion && <Dato t="Dirección" v={c.direccion} ancho />}
          </dl>

          {/* ── WhatsApp ───────────────────────────────────────── */}
          <p className="mb-2 text-[10px] font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">
            {noEscribir ? 'Mensajes (ninguno recomendado)' : 'Escribirle'}
          </p>
          {/* La marca se pone sola al tocar el mensaje, **y se puede destildar**.
              Fabián lo pidió así el 2026-09-14: "a veces solo le toco abre WS
              pero no le mando el mensaje". Un `wa.me` no avisa si se apretó
              enviar, así que el automático es una suposición — el check es lo
              que la corrige. Sin poder destildar, el registro mentiría justo en
              lo único que tiene que saber: a quién ya le escribió.
              Mismo criterio que la cola de logística. */}
          <div className="mb-4 flex flex-col gap-2">
            {PLANTILLAS_RECUPERACION.map((p) => {
              const esSugerida = p.id === sugerida;
              const marcada = c.avisos.find((a) => a.id === p.id);
              // El chat en blanco no se marca: no hay mensaje que registrar.
              const marcable = p.id !== 'libre';
              return (
                <div
                  key={p.id}
                  className={`flex items-stretch gap-1 rounded-lg border ${
                    marcada
                      ? 'border-[var(--color-verde)]/40 bg-[var(--color-verde-tenue)]'
                      : esSugerida
                        ? 'border-[var(--color-verde)]/40'
                        : 'border-[var(--color-borde)]'
                  }`}
                >
                  <a
                    href={linkRecuperacion(c, p.texto(c))}
                    target="_blank"
                    rel="noreferrer"
                    // Marca al abrir. Si ya estaba marcada no se reescribe la
                    // fecha: la primera vez que se lo mandó es el dato útil.
                    onClick={() => {
                      if (marcable && !marcada) void aplicar({ aviso: p.id, enviado: true });
                    }}
                    className="pulsable min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <span className="block font-medium">
                      {p.etiqueta}
                      {esSugerida && !marcada && (
                        <span className="ml-2 text-[10px] font-semibold text-[var(--color-verde)]">
                          SUGERIDO
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-texto-tenue)]">
                      {marcada ? `Mandado el ${marcada.fecha}` : p.desc}
                    </span>
                  </a>

                  {marcable && (
                    <button
                      type="button"
                      aria-pressed={!!marcada}
                      aria-label={
                        marcada
                          ? `Destildar: al final no le mandé "${p.etiqueta}"`
                          : `Marcar que le mandé "${p.etiqueta}"`
                      }
                      disabled={guardando}
                      onClick={() => void aplicar({ aviso: p.id, enviado: !marcada })}
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
              Se marca solo al abrir WhatsApp. Si al final no lo mandaste,
              destildá el check.
            </p>
          </div>

          {/* ── Estado ─────────────────────────────────────────── */}
          <p className="mb-2 text-[10px] font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">
            Marcarlo como
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {estados
              .filter((e) => e.literal !== c.estado)
              .map((e) => (
                <button
                  key={e.literal}
                  type="button"
                  title={e.desc}
                  disabled={guardando}
                  onClick={() => void aplicar({ estado: e.literal })}
                  className="pulsable min-h-10 rounded-full border border-[var(--color-borde)] px-3.5 text-xs font-medium disabled:opacity-50"
                >
                  {e.texto}
                </button>
              ))}
          </div>

          {/* ── Nota ───────────────────────────────────────────── */}
          <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.15em] text-[var(--color-texto-tenue)] uppercase">
            En qué quedó
          </label>
          <textarea
            value={nota}
            onChange={(e) => setBorrador(e.target.value)}
            rows={2}
            placeholder="Dijo que lo confirma mañana…"
            className="w-full resize-y rounded-lg border border-[var(--color-borde)] bg-[var(--color-fondo)] px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--color-borde-fuerte)]"
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
            {nota !== c.nota && (
              <span className="text-xs text-[var(--color-texto-tenue)]">sin guardar</span>
            )}
          </div>

          {error && (
            <p className="prosa mt-3 rounded-lg bg-[var(--color-rojo-tenue)] px-3 py-2 text-xs text-[var(--color-rojo)]">
              ❌ {error}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * El color sale del balde, que ya distingue los cuatro casos: rojo pasa la vara,
 * ámbar devolvió alguna sin pasarla, verde nunca devolvió, azul no se sabe.
 */
function colorDevoluciones(c: Candidato): string {
  return c.dropi ? ESTILO_BALDE[c.balde].texto : 'text-[var(--color-texto-tenue)]';
}

function Dato({ t, v, ancho }: { t: string; v: string; ancho?: boolean }) {
  return (
    <div className={ancho ? 'col-span-2 sm:col-span-3' : ''}>
      <dt className="text-[10px] tracking-wide text-[var(--color-texto-tenue)] uppercase">{t}</dt>
      <dd className="prosa mt-0.5 text-[var(--color-texto-suave)]">{v}</dd>
    </div>
  );
}
