'use client';

import { useEffect, useState } from 'react';
import type { Pedido } from '@/lib/tipos';
import type { EstadoSheet } from '@/lib/estados';
import { PLANTILLAS, linkWhatsApp, marcasEnviadas, plantillaSugerida } from '@/lib/plantillas';
import { fechaCorta, haceCuanto } from '@/lib/fechas';
import { ESTILO_MOMENTO, ESTILO_PAGO, linkRastreo, tiendaUI, usd } from '@/lib/ui';
import { ETIQUETA_PAGO, ETIQUETA_PAGO_LARGA } from '@/lib/pago';
import { ETIQUETA_MOMENTO } from '@/lib/momento';
import { LineaTiempo } from './LineaTiempo';

interface Props {
  p: Pedido;
  /** Los estados del Sheet de ESTE negocio. La app no tiene lista propia. */
  estados: EstadoSheet[];
  onCerrar: () => void;
  /** Guarda en el Sheet. Devuelve el error en texto si algo falló. */
  onGuardar: (cambios: {
    estado?: string;
    notas?: string;
  }) => Promise<{ error: string | null; aviso: string | null }>;
  /** Marca una plantilla como enviada (solo donde hay columna LOG WA). */
  onMarcarPlantilla: (plantilla: string, enviado: boolean) => Promise<void>;
}

export function PanelPedido({ p, estados, onCerrar, onGuardar, onMarcarPlantilla }: Props) {
  const [notas, setNotas] = useState(p.notas);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [menuWa, setMenuWa] = useState(false);

  // Al cambiar de pedido el textarea tiene que seguir al pedido nuevo, no
  // quedarse con lo que se estaba escribiendo del anterior.
  useEffect(() => {
    setNotas(p.notas);
    setError(null);
    setAviso(null);
    setMenuWa(false);
  }, [p.fila, p.notas]);

  // Escape cierra: en desktop el panel tapa media pantalla y el mouse está
  // lejos del botón de cerrar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  const est = ESTILO_MOMENTO[p.momento];
  const t = tiendaUI(p.tienda);
  const tr = p.tracking;
  const rastreo = linkRastreo(p.transportadora, p.guia);
  const yaEnviadas = marcasEnviadas(p.logWa);
  const sugerida = plantillaSugerida(p);
  // Solo ShotyGames tiene columna LOG WA; en dropshipping se ofrecen las mismas
  // plantillas pero no hay dónde registrar cuál se mandó.
  const registraPlantillas = p.negocio === 'shotygames';

  async function guardar(clave: string, cambios: { estado?: string; notas?: string }) {
    setGuardando(clave);
    setError(null);
    setAviso(null);
    const r = await onGuardar(cambios);
    if (r.error) setError(r.error);
    if (r.aviso) setAviso(r.aviso);
    setGuardando(null);
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--color-superficie)]">
      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      {/* `data-asa`: desde acá se arrastra la hoja hacia abajo para cerrarla en
          móvil. `touch-action: none` evita que el navegador se quede con el
          gesto. El `pt` extra deja lugar a la barrita. */}
      <header
        data-asa
        style={{ touchAction: 'none' }}
        className="sticky top-0 z-10 border-b border-[var(--color-borde)] bg-[var(--color-superficie)]/95 px-5 pt-6 pb-4 backdrop-blur lg:pt-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${est.fondo} ${est.texto}`}
              >
                <span className={`size-1.5 rounded-full ${est.punto}`} />
                {ETIQUETA_MOMENTO[p.momento]}
              </span>
              <span className={`text-[11px] font-semibold ${t.color}`}>{t.nombre}</span>
              {p.metodoPago && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ESTILO_PAGO[p.metodoPago]}`}
                >
                  {ETIQUETA_PAGO[p.metodoPago]}
                </span>
              )}
              <span className="text-[11px] text-[var(--color-texto-tenue)]">
                {p.id} · Sheet: {p.etiquetaEstado}
              </span>
            </div>
            <h2 className="mt-1.5 truncate text-lg font-semibold">{p.nombre || 'Sin nombre'}</h2>
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
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-28">
        {p.alertas.length > 0 && (
          <ul className="mb-5 space-y-2">
            {p.alertas.map((a, i) => (
              <li
                key={i}
                className={`prosa rounded-xl px-3 py-2 text-sm ${
                  a.nivel === 'rojo'
                    ? 'bg-[var(--color-rojo-tenue)] text-[var(--color-rojo)]'
                    : 'bg-[var(--color-ambar-tenue)] text-[var(--color-ambar)]'
                }`}
              >
                {a.texto}
              </li>
            ))}
          </ul>
        )}

        {/* ── La plata en juego ─────────────────────────────────────────── */}
        <Seccion titulo="La plata">
          {p.metodoPago && (
            <p className="prosa mb-2 text-xs text-[var(--color-texto-suave)]">
              {ETIQUETA_PAGO_LARGA[p.metodoPago]}
              {p.anticipo > 0 && ` · adelantó ${usd(p.anticipo)}`}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Dato etiqueta="Cobra al entregar" valor={usd(p.aCobrar)} />
            <Dato
              etiqueta="Gana si llega"
              valor={usd(p.utilidadSiEntrega)}
              color="text-[var(--color-verde)]"
            />
            <Dato
              etiqueta="Pierde si vuelve"
              valor={usd(-p.perdidaSiDevuelve)}
              color="text-[var(--color-rojo)]"
            />
          </div>
          <p className="prosa mt-2 text-xs text-[var(--color-texto-tenue)]">
            Costo {usd(p.costo)} · flete {usd(p.flete)}
            {p.negocio === 'dropshipping' && (p.cpa > 0 ? ` · CPA ${usd(p.cpa)}` : ' · sin CPA cargado')}
          </p>
        </Seccion>

        {/* ── Entrega ───────────────────────────────────────────────────── */}
        <Seccion titulo="Entrega">
          <Fila etiqueta="Dirección" valor={p.direccion || '—'} />
          <Fila etiqueta="Ciudad" valor={[p.ciudad, p.provincia].filter(Boolean).join(', ') || '—'} />
          <Fila etiqueta="Teléfono" valor={p.telefono || '—'} />
          <Fila etiqueta="Producto" valor={p.descripcion || '—'} />
          <Fila etiqueta="Transportadora" valor={p.transportadora ?? '—'} />
          <Fila etiqueta="Guía" valor={p.guia ?? 'todavía sin guía'} />
          {p.pasaPorDropi ? (
            <Fila
              etiqueta="Orden DROPI"
              valor={p.ordenDropi ?? '—'}
              nota={tr ? undefined : 'sin respuesta de DROPI'}
            />
          ) : (
            <Fila etiqueta="Orden DROPI" valor="no aplica — este envío no pasa por DROPI" />
          )}
          {tr?.cliente && (
            <Fila
              etiqueta="Cliente en DROPI"
              valor={`${tr.cliente.pedidos} pedidos · ${tr.cliente.entregados} entregados · ${tr.cliente.devueltos} devueltos`}
            />
          )}
        </Seccion>

        {(rastreo || tr?.pdf) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {rastreo && <Enlace href={rastreo}>Rastrear en {p.transportadora}</Enlace>}
            {tr?.pdf && <Enlace href={tr.pdf}>Ver la guía (PDF)</Enlace>}
          </div>
        )}

        {/* ── Recorrido ─────────────────────────────────────────────────── */}
        <Seccion
          titulo="Recorrido"
          extra={
            p.momento !== 'sin-datos'
              ? `${ETIQUETA_MOMENTO[p.momento]}${tr?.fuente === 'servientrega' ? ' · según Servientrega' : ''}`
              : undefined
          }
        >
          {p.prediccion && (
            <p className="prosa mb-3 rounded-lg border border-[var(--color-borde)] bg-[var(--color-fondo)] px-3 py-2 text-xs text-[var(--color-texto-suave)]">
              Lo más probable ahora: <strong>{p.prediccion.texto}</strong> ({p.prediccion.probabilidad}%
              de los casos parecidos)
            </p>
          )}

          <LineaTiempo
            movimientos={
              tr?.movimientos.length
                ? tr.movimientos
                : (tr?.historial ?? []).map((h) => ({
                    movimiento: h.estado,
                    motivo: '',
                    fecha: h.fecha,
                  }))
            }
            vacio={
              !p.pasaPorDropi
                ? 'Este envío no pasa por DROPI, así que no hay tracking que mostrar.'
                : p.ordenDropi
                  ? 'DROPI todavía no reporta movimientos de esta orden.'
                  : 'Este pedido no tiene orden de DROPI, así que no hay nada que rastrear.'
            }
          />
        </Seccion>

        {/* ── Notas ─────────────────────────────────────────────────────── */}
        <Seccion titulo="Notas">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Qué se hizo, con quién se habló, qué quedó pendiente…"
            className="prosa w-full resize-y rounded-xl border border-[var(--color-borde)] bg-[var(--color-fondo)] px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--color-verde)]"
          />
          <button
            type="button"
            disabled={notas === p.notas || guardando !== null}
            onClick={() => guardar('notas', { notas })}
            className="pulsable mt-2 min-h-11 rounded-lg border border-[var(--color-borde)] px-4 text-sm disabled:opacity-40"
          >
            {guardando === 'notas' ? 'Guardando…' : 'Guardar nota'}
          </button>
        </Seccion>

        {/* ── Cambiar estado ────────────────────────────────────────────── */}
        <Seccion titulo="Cambiar estado">
          {p.estadoSugerido && (
            <button
              type="button"
              disabled={guardando !== null}
              onClick={() => guardar('sugerido', { estado: p.estadoSugerido! })}
              className="pulsable mb-3 w-full rounded-xl border border-[var(--color-verde)]/40 bg-[var(--color-verde-tenue)] px-3 py-2.5 text-left text-sm text-[var(--color-verde)] disabled:opacity-40"
            >
              {guardando === 'sugerido'
                ? 'Actualizando…'
                : `DROPI ya lo tiene como ${p.estadoSugerido} — pasarlo en el Sheet`}
            </button>
          )}

          {/* Los estados salen del desplegable del Sheet de ESTE negocio, menos
              los que no tienen sentido acá: todo lo que llega a esta cola ya
              está confirmado y despachado. Ver NO_OFRECIBLES en estados.ts. */}
          <div className="grid grid-cols-2 gap-2">
            {estados
              .filter((e) => e.ofrecible && e.literal.toUpperCase() !== p.estado.toUpperCase())
              .map((e) => (
                <button
                  key={e.literal}
                  type="button"
                  disabled={guardando !== null}
                  onClick={() => guardar(e.literal, { estado: e.literal })}
                  className="pulsable min-h-11 rounded-lg border border-[var(--color-borde)] px-3 text-xs text-[var(--color-texto-suave)] disabled:opacity-40"
                >
                  {guardando === e.literal ? '…' : e.etiqueta}
                </button>
              ))}
          </div>
          <p className="prosa mt-2 text-xs text-[var(--color-texto-tenue)]">
            {p.negocio === 'dropshipping'
              ? 'Cambiar el estado escribe en el Sheet y sella la fecha que corresponda.'
              : 'Pasarlo a ENTREGADO o PAGADO dispara el WhatsApp de agradecimiento, igual que antes. No se manda dos veces.'}
          </p>
        </Seccion>

        {error && (
          <p className="prosa mt-4 rounded-xl bg-[var(--color-rojo-tenue)] px-3 py-2 text-sm text-[var(--color-rojo)]">
            ❌ {error}
          </p>
        )}

        {aviso && (
          <p className="prosa mt-4 rounded-xl bg-[var(--color-verde-tenue)] px-3 py-2 text-sm text-[var(--color-verde)]">
            {aviso}
          </p>
        )}

        <p className="mt-6 text-xs text-[var(--color-texto-tenue)]">
          Pedido creado {haceCuanto(p.dias)} · fila {p.fila} del Sheet de{' '}
          {p.negocio === 'shotygames' ? 'ShotyGames' : 'dropshipping'}
        </p>
      </div>

      {/* ── Acción principal, siempre a mano ──────────────────────────────
          Cada situación necesita pedirle al cliente una cosa distinta, así que
          se elige la plantilla. La app sugiere la que encaja con el tracking,
          pero la decisión es de quien escribe: abre WhatsApp con el texto
          puesto y NADA se manda solo. */}
      <div className="absolute inset-x-0 bottom-0 border-t border-[var(--color-borde)] bg-[var(--color-superficie)]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        {menuWa && (
          <div className="animar-panel mb-3 max-h-[46vh] space-y-1 overflow-y-auto rounded-xl border border-[var(--color-borde)] bg-[var(--color-fondo)] p-1.5">
            {PLANTILLAS.map((pl) => {
              const cuando = yaEnviadas[pl.id];
              const esSugerida = pl.id === sugerida;
              return (
                <div key={pl.id} className="flex items-stretch gap-1">
                  <a
                    href={linkWhatsApp(p, pl.texto(p))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setMenuWa(false);
                      if (registraPlantillas && pl.id !== 'libre') onMarcarPlantilla(pl.id, true);
                    }}
                    className="pulsable min-w-0 flex-1 rounded-lg px-3 py-2"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{pl.etiqueta}</span>
                      {esSugerida && (
                        <span className="shrink-0 rounded-full bg-[var(--color-verde-tenue)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-verde)]">
                          sugerida
                        </span>
                      )}
                      {cuando && (
                        <span className="shrink-0 text-[10px] text-[var(--color-texto-tenue)]">
                          ✓ {cuando}
                        </span>
                      )}
                    </span>
                    <span className="prosa mt-0.5 block truncate text-xs text-[var(--color-texto-tenue)]">
                      {pl.desc}
                    </span>
                  </a>

                  {/* WhatsApp no avisa si de verdad se envió: la marca se pone
                      sola al abrir el chat y se puede sacar a mano. Es el
                      registro de lo que TÚ decís que mandaste. */}
                  {registraPlantillas && cuando && (
                    <button
                      type="button"
                      aria-label={`Desmarcar ${pl.etiqueta}`}
                      onClick={() => onMarcarPlantilla(pl.id, false)}
                      className="pulsable shrink-0 rounded-lg px-2 text-xs text-[var(--color-texto-tenue)]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            {!registraPlantillas && (
              <p className="prosa px-3 py-1.5 text-[11px] text-[var(--color-texto-tenue)]">
                En Truquito y Avanora no queda registro de qué plantilla mandaste: ese Sheet no
                tiene columna LOG WA.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuWa((v) => !v)}
          className="pulsable block w-full rounded-xl bg-[var(--color-verde)] px-4 py-3 text-center font-semibold text-[#08110c]"
        >
          {menuWa ? 'Cerrar' : 'Escribirle por WhatsApp'}
        </button>
      </div>
    </div>
  );
}

// ─── Piezas chicas ───────────────────────────────────────────────────────────

function Seccion({
  titulo,
  extra,
  children,
}: {
  titulo: string;
  extra?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[var(--color-texto-tenue)] uppercase">
          {titulo}
        </h3>
        {extra && <span className="text-[11px] text-[var(--color-texto-tenue)]">{extra}</span>}
      </div>
      {children}
    </section>
  );
}

function Dato({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-borde)] bg-[var(--color-fondo)] px-3 py-2.5">
      <p className="text-[10px] leading-tight text-[var(--color-texto-tenue)]">{etiqueta}</p>
      <p className={`mt-1 font-semibold ${color ?? ''}`}>{valor}</p>
    </div>
  );
}

function Fila({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="flex gap-3 border-b border-[var(--color-borde)] py-2 last:border-0">
      <span className="w-32 shrink-0 text-sm text-[var(--color-texto-tenue)]">{etiqueta}</span>
      <span className="prosa min-w-0 flex-1 text-sm break-words">
        {valor}
        {nota && <span className="text-[var(--color-ambar)]"> ({nota})</span>}
      </span>
    </div>
  );
}

function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="pulsable inline-flex min-h-11 items-center rounded-lg border border-[var(--color-borde)] px-3.5 text-sm text-[var(--color-texto-suave)]"
    >
      {children} ↗
    </a>
  );
}
