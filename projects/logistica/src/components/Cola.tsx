'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Fase, Negocio, Pedido, Resumen, Tienda } from '@/lib/tipos';
import type { EstadoSheet } from '@/lib/estados';
import { tiendaUI, usd } from '@/lib/ui';
import { TarjetaPedido } from './TarjetaPedido';
import { PanelPedido } from './PanelPedido';
import { HojaMovil } from './HojaMovil';

interface Respuesta {
  ok: boolean;
  pedidos?: Pedido[];
  resumen?: Resumen;
  hoy?: string;
  error?: string;
  /** Negocios que no se pudieron leer. La cola se muestra igual, avisando. */
  fallos?: string[];
  /** Los estados de cada Sheet, para los botones del panel. */
  estados?: Record<Negocio, EstadoSheet[]>;
}

// Se filtra por FASE, no por el literal del estado: "GUIA_GENERADA" de
// dropshipping y "ENVIADO" de ShotyGames son la misma cosa para quien mira.
// `agencia` no es una fase: es un corte transversal — un paquete parado en
// agencia puede estar en cualquier estado del Sheet.
type FiltroFase = 'TODAS' | Fase | 'agencia';
type FiltroTienda = 'todas' | Tienda;

const FASES_FILTRO: { clave: FiltroFase; texto: string }[] = [
  { clave: 'TODAS', texto: 'Todos' },
  { clave: 'novedad', texto: 'Novedades' },
  { clave: 'agencia', texto: 'En agencia' },
  { clave: 'en-camino', texto: 'En camino' },
  { clave: 'por-despachar', texto: 'Sin despachar' },
];

/**
 * Sin acentos ni mayúsculas, para que "jose" encuentre a "JOSÉ".
 * Fabián escribe rápido desde el teléfono y no va a poner las tildes.
 */
const sinTildes = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** ¿Este pedido entra en ese filtro? */
const pasaFiltro = (p: Pedido, f: FiltroFase) =>
  f === 'TODAS' ? true : f === 'agencia' ? p.enAgencia : p.fase === f;

const TIENDAS_FILTRO: FiltroTienda[] = ['todas', 'truquito', 'avanora', 'shotygames'];

/**
 * Identificador único de un pedido en TODA la app. Lleva el negocio adentro
 * porque la fila 14 (y hasta la clave) puede existir en los dos Sheets.
 */
const idDe = (p: Pedido) => `${p.negocio}:${p.clave}`;

export function Cola() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState<string | null>(null);
  const [fallos, setFallos] = useState<string[]>([]);
  const [estados, setEstados] = useState<Record<Negocio, EstadoSheet[]>>({
    dropshipping: [],
    shotygames: [],
  });

  const [tienda, setTienda] = useState<FiltroTienda>('todas');
  const [fase, setFase] = useState<FiltroFase>('TODAS');
  const [soloAlerta, setSoloAlerta] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  // En móvil el buscador ocupaba una fila entera para algo que casi no se usa.
  // Ahora es un icono al lado de Refrescar y se despliega al tocarlo.
  const [buscando, setBuscando] = useState(false);
  // Se identifica por `negocio+clave` y NO por número de fila: la fila 14
  // existe en los dos Sheets y seleccionar una abriría la otra.
  const [abierto, setAbierto] = useState<string | null>(null);


  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch('/api/pedidos', { cache: 'no-store' });
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }
      const d: Respuesta = await r.json();
      if (!d.ok) throw new Error(d.error ?? 'No se pudo leer la cola');
      setPedidos(d.pedidos ?? []);
      setResumen(d.resumen ?? null);
      setFallos(d.fallos ?? []);
      if (d.estados) setEstados(d.estados);
      setActualizado(
        new Date().toLocaleTimeString('es-EC', {
          timeZone: 'America/Guayaquil',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Al volver a la pestaña se relee el Sheet (barato, sale de caché el
  // tracking): si n8n metió pedidos nuevos mientras tanto, ya están.
  useEffect(() => {
    const alVolver = () => document.visibilityState === 'visible' && cargar();
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [cargar]);

  /**
   * Guarda un cambio y recarga. Se recarga entera a propósito en vez de parchear
   * el pedido en memoria: el Sheet tiene fórmulas (UTILIDAD) y DROPI puede haber
   * cambiado mientras tanto, así que lo único confiable es volver a leer.
   */
  const guardar = useCallback(
    async (
      p: Pedido,
      cambios: { estado?: string; notas?: string }
    ): Promise<{ error: string | null; aviso: string | null }> => {
      try {
        const r = await fetch('/api/pedidos/actualizar', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            negocio: p.negocio,
            fila: p.fila,
            clave: p.clave,
            ...cambios,
          }),
        });
        const d = await r.json();
        if (!d.ok) return { error: d.error ?? 'No se pudo guardar', aviso: null };
        // Si el pedido salió de la cola (pasó a ENTREGADO, PAGADO…), el panel
        // se cierra solo: ya no hay nada que gestionar ahí.
        await cargar();
        // Si el pedido salió de la cola, el panel se cierra en el efecto de
        // abajo — no hace falta adivinar acá qué estados la abandonan.
        // Si el cambio de estado disparó algo (el WhatsApp de agradecimiento),
        // se dice qué pasó: mandar un mensaje a un cliente no puede ser
        // invisible.
        return { error: null, aviso: d.disparador?.detalle ?? null };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'No se pudo guardar', aviso: null };
      }
    },
    [cargar]
  );

  /** Marca o desmarca una plantilla de WhatsApp en la columna LOG WA. */
  const marcarPlantilla = useCallback(
    async (p: Pedido, plantilla: string, enviado: boolean) => {
      try {
        await fetch('/api/pedidos/plantilla', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            negocio: p.negocio,
            fila: p.fila,
            clave: p.clave,
            plantilla,
            enviado,
          }),
        });
        await cargar();
      } catch {
        // Marcar una plantilla es un registro auxiliar: si falla, no vale la
        // pena interrumpir lo que Fabián está haciendo. Se ve en la próxima carga.
      }
    },
    [cargar]
  );

  const visibles = useMemo(() => {
    const q = sinTildes(busqueda.trim());
    return pedidos.filter((p) => {
      if (tienda !== 'todas' && p.tienda !== tienda) return false;
      if (!pasaFiltro(p, fase)) return false;
      if (soloAlerta && p.alertas.length === 0) return false;
      if (!q) return true;
      return sinTildes(
        [p.nombre, p.id, p.telefono, p.ciudad, p.descripcion, p.guia ?? '', p.ordenDropi ?? ''].join(
          ' '
        )
      ).includes(q);
    });
  }, [pedidos, tienda, fase, soloAlerta, busqueda]);

  const seleccionado = useMemo(
    () => visibles.find((p) => idDe(p) === abierto) ?? null,
    [visibles, abierto]
  );

  // Si el pedido abierto salió de la cola (pasó a ENTREGADO, PAGADO…), el panel
  // se cierra solo: ya no hay nada que gestionar ahí.
  useEffect(() => {
    if (abierto && !pedidos.some((p) => idDe(p) === abierto)) setAbierto(null);
  }, [pedidos, abierto]);

  return (
    <div className="mx-auto min-h-dvh max-w-[1500px]">
      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      {/* `pad-arriba` baja la cabecera por debajo del notch cuando la app está
          instalada; en el navegador `env()` vale 0 y no cambia nada. */}
      <header className="pad-arriba sticky top-0 z-30 border-b border-[var(--color-borde)] bg-[var(--color-fondo)]/90 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 sm:px-6 sm:pt-4 sm:pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full bg-[var(--color-verde)] ${cargando ? 'latido' : ''}`}
              />
              <span className="text-[10px] font-semibold tracking-[0.2em] text-[var(--color-texto-tenue)] uppercase">
                En movimiento
              </span>
            </div>
            <h1 className="text-xl font-semibold sm:mt-0.5 sm:text-2xl">Logística</h1>
          </div>

          <div className="flex items-center gap-2">
            {actualizado && (
              <span className="hidden text-xs text-[var(--color-texto-tenue)] sm:block">
                {actualizado}
              </span>
            )}

            <button
              type="button"
              aria-label={buscando ? 'Cerrar la búsqueda' : 'Buscar'}
              onClick={() => {
                setBuscando((v) => !v);
                if (buscando) setBusqueda('');
              }}
              className={`pulsable grid size-11 shrink-0 place-items-center rounded-full border text-sm ${
                buscando || busqueda
                  ? 'border-[var(--color-borde-fuerte)] bg-[var(--color-superficie-alta)]'
                  : 'border-[var(--color-borde)]'
              }`}
            >
              {buscando ? '✕' : '⌕'}
            </button>

            <button
              type="button"
              onClick={() => cargar()}
              disabled={cargando}
              className="pulsable min-h-11 rounded-full border border-[var(--color-borde)] px-4 text-sm disabled:opacity-50"
            >
              {cargando ? 'Leyendo…' : 'Refrescar'}
            </button>
          </div>
        </div>

        {buscando && (
          <div className="animar-aparecer px-4 pb-3 sm:px-6">
            <input
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (setBuscando(false), setBusqueda(''))}
              placeholder="Buscar nombre, guía, ciudad…"
              className="w-full rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--color-borde-fuerte)]"
            />
          </div>
        )}

        {/* Tiendas */}
        <div className="tira flex gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
          {TIENDAS_FILTRO.map((t) => {
            const n = pedidos.filter((p) => t === 'todas' || p.tienda === t).length;
            const activa = tienda === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTienda(t)}
                className={`pulsable min-h-10 shrink-0 rounded-full px-4 text-sm ${
                  activa
                    ? 'bg-[var(--color-texto)] font-semibold text-[var(--color-fondo)]'
                    : 'border border-[var(--color-borde)] text-[var(--color-texto-suave)]'
                }`}
              >
                {t === 'todas' ? 'Todas' : tiendaUI(t).nombre}{' '}
                <span className={activa ? 'opacity-60' : 'opacity-50'}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* ── Filtros ──────────────────────────────────────────────────────
            Van DENTRO de la cabecera para que queden fijos al bajar la lista:
            en el teléfono son lo que más se toca y perderlos de vista obliga a
            subir hasta arriba cada vez. */}
        <div className="tira flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:flex-wrap sm:overflow-visible sm:px-6">
          {FASES_FILTRO.map((f) => {
            const enTienda = pedidos.filter((p) => tienda === 'todas' || p.tienda === tienda);
            const n = enTienda.filter((p) => pasaFiltro(p, f.clave)).length;
            const activo = fase === f.clave;
            return (
              <button
                key={f.clave}
                type="button"
                onClick={() => setFase(f.clave)}
                className={`pulsable min-h-9 shrink-0 rounded-full px-3.5 text-xs font-medium ${
                  activo
                    ? 'bg-[var(--color-superficie-alta)] text-[var(--color-texto)] ring-1 ring-[var(--color-borde-fuerte)]'
                    : 'text-[var(--color-texto-suave)]'
                }`}
              >
                {f.texto} <span className="opacity-50">{n}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSoloAlerta((v) => !v)}
            className={`pulsable min-h-9 shrink-0 rounded-full px-3.5 text-xs font-medium ${
              soloAlerta
                ? 'bg-[var(--color-rojo-tenue)] text-[var(--color-rojo)]'
                : 'text-[var(--color-texto-suave)]'
            }`}
          >
            Solo con alerta
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        {/* ── Resumen ────────────────────────────────────────────────────── */}
        {/* En móvil el resumen es una tira que se desliza: como grilla de 2
            columnas empujaba el primer pedido fuera de la pantalla, y lo que
            hay que ver al abrir la app es el trabajo, no las métricas. */}
        {resumen && (
          <div className="tira -mx-4 mb-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mb-5 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            <Tile etiqueta="En la calle" valor={String(resumen.total)} />
            <Tile
              etiqueta="Novedades"
              valor={String(resumen.novedades)}
              color={resumen.novedades ? 'text-[var(--color-ambar)]' : undefined}
            />
            <Tile etiqueta="En camino" valor={String(resumen.enCamino)} />
            <Tile
              etiqueta="Sin despachar"
              valor={String(resumen.sinDespachar)}
              color={resumen.sinDespachar ? 'text-[var(--color-azul)]' : undefined}
            />
            <Tile
              etiqueta="Por cobrar"
              valor={usd(resumen.porCobrar)}
              color="text-[var(--color-verde)]"
            />
            <Tile
              etiqueta="En riesgo"
              valor={usd(resumen.enRiesgo)}
              color="text-[var(--color-rojo)]"
              nota="lo que se pierde si nada llega"
            />
          </div>
        )}


        {error && (
          <p className="prosa mb-4 rounded-xl bg-[var(--color-rojo-tenue)] px-4 py-3 text-sm text-[var(--color-rojo)]">
            ❌ {error}
          </p>
        )}

        {/* Un negocio que no se pudo leer se dice, no se disimula: si no,
            Fabián vería una cola incompleta creyendo que está completa. */}
        {fallos.map((f) => (
          <p
            key={f}
            className="prosa mb-4 rounded-xl bg-[var(--color-ambar-tenue)] px-4 py-3 text-sm text-[var(--color-ambar)]"
          >
            ❌ No se pudo leer {f} — lo que ves abajo está incompleto.
          </p>
        ))}

        {/* ── Lista + detalle ────────────────────────────────────────────── */}
        <div className="grid gap-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          {/* `min-w-0` no es decorativo: un item de grilla es `min-width:auto`
              por defecto y no encoge por debajo de su contenido, así que un
              nombre largo de cliente ensanchaba la columna y sacaba las
              tarjetas de la pantalla del teléfono. */}
          <div className="min-w-0 space-y-2.5">
            {cargando && pedidos.length === 0 && <Esqueleto />}

            {!cargando && visibles.length === 0 && (
              <div className="rounded-[var(--radius-tarjeta)] border border-dashed border-[var(--color-borde)] px-6 py-14 text-center">
                <p className="font-medium">
                  {pedidos.length === 0 ? 'No hay nada en movimiento' : 'Nada con estos filtros'}
                </p>
                <p className="prosa mt-1 text-sm text-[var(--color-texto-suave)]">
                  {pedidos.length === 0
                    ? 'Todos los pedidos están entregados, pagados, cancelados o esperando confirmación.'
                    : 'Probá quitando algún filtro.'}
                </p>
              </div>
            )}

            {visibles.map((p) => (
              <TarjetaPedido
                key={idDe(p)}
                p={p}
                activa={abierto === idDe(p)}
                onAbrir={() => setAbierto(abierto === idDe(p) ? null : idDe(p))}
              />
            ))}
          </div>

          {/* Desktop: el detalle vive al lado y queda fijo mientras se baja la lista. */}
          <aside className="sticky top-[136px] hidden max-h-[calc(100dvh-160px)] overflow-hidden rounded-[var(--radius-tarjeta)] border border-[var(--color-borde)] lg:block">
            {seleccionado ? (
              <div className="animar-panel relative h-[calc(100dvh-160px)]">
                <PanelPedido
                  key={idDe(seleccionado)}
                  p={seleccionado}
                  estados={estados[seleccionado.negocio] ?? []}
                  onCerrar={() => setAbierto(null)}
                  onGuardar={(c) => guardar(seleccionado, c)}
                  onMarcarPlantilla={(pl, ok) => marcarPlantilla(seleccionado, pl, ok)}
                />
              </div>
            ) : (
              <div className="grid h-64 place-items-center px-6 text-center">
                <p className="prosa text-sm text-[var(--color-texto-tenue)]">
                  Elegí un pedido para ver su recorrido y actuar.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Móvil: el detalle es una hoja que se baja con el dedo y que bloquea el
          scroll de la lista mientras está abierta. Ver HojaMovil. */}
      {seleccionado && (
        <HojaMovil onCerrar={() => setAbierto(null)}>
          <PanelPedido
            key={idDe(seleccionado)}
            p={seleccionado}
            estados={estados[seleccionado.negocio] ?? []}
            onCerrar={() => setAbierto(null)}
            onGuardar={(c) => guardar(seleccionado, c)}
            onMarcarPlantilla={(pl, ok) => marcarPlantilla(seleccionado, pl, ok)}
          />
        </HojaMovil>
      )}
    </div>
  );
}

function Tile({
  etiqueta,
  valor,
  color,
  nota,
}: {
  etiqueta: string;
  valor: string;
  color?: string;
  nota?: string;
}) {
  return (
    <div className="w-[128px] shrink-0 snap-start rounded-[var(--radius-tarjeta)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-2.5 sm:w-auto sm:shrink sm:py-3">
      <p className="text-[10px] tracking-wide text-[var(--color-texto-tenue)] uppercase">
        {etiqueta}
      </p>
      <p className={`mt-1 text-xl font-semibold ${color ?? ''}`}>{valor}</p>
      {nota && <p className="mt-0.5 text-[10px] text-[var(--color-texto-tenue)]">{nota}</p>}
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-[var(--radius-tarjeta)] border border-[var(--color-borde)] bg-[var(--color-superficie)]"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
