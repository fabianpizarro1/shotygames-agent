'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ESTADO_FRENADO,
  type Accion,
  type Candidato,
  type ResumenRecuperacion,
} from '@/lib/recuperacion-tipos';
import { usd } from '@/lib/ui';
import { TarjetaCandidato, type OpcionEstado } from './TarjetaCandidato';

interface Respuesta {
  ok: boolean;
  candidatos?: Candidato[];
  resumen?: ResumenRecuperacion;
  ventana?: number;
  error?: string;
}

// Se filtra por ACCIÓN y no por balde: lo que Fabián necesita elegir es qué
// tanda de mensajes va a mandar ahora, no qué tipo de cliente quiere mirar.
type Filtro = 'TODOS' | Accion;

const FILTROS: { clave: Filtro; texto: string }[] = [
  { clave: 'TODOS', texto: 'Todos' },
  { clave: 'ofrecer-anticipo', texto: 'Pedir abono' },
  { clave: 'pedir-confirmacion', texto: 'Falta confirmar' },
  { clave: 'no-escribir', texto: 'No escribir' },
];

const VENTANAS = [15, 30, 60, 90];

/**
 * Los estados que se pueden escribir desde acá, y qué significa cada uno.
 * `COMPRADO` no está: eso lo escribe solo el registro del pedido en la hoja
 * oficial (`buscarAtribucionWeb` en KEPLER). Ponerlo a mano acá haría que el
 * pedido desaparezca de la lista sin que exista la venta.
 */
const ESTADOS: OpcionEstado[] = [
  {
    literal: ESTADO_FRENADO,
    // Es la marca que hace posible distinguir al que confirmó del que no
    // contestó — y con eso, cuál de los dos mensajes le toca.
    texto: 'Confirmó, lo frené',
    desc: 'Confirmó el pedido pero no lo despaché por su historial. Pasa a "pedirle el abono".',
  },
  { literal: 'AVISADO', texto: 'Avisado', desc: 'Ya le escribí, esperando que conteste' },
  { literal: 'CANCELADO', texto: 'Cancelado', desc: 'No lo quiere o no contesta: cerrado' },
  { literal: 'SIN COMPRAR', texto: 'Sin comprar', desc: 'Volver al estado inicial' },
];

const sinTildes = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function Recuperacion() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [resumen, setResumen] = useState<ResumenRecuperacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventana, setVentana] = useState(30);

  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [soloSinAvisar, setSoloSinAvisar] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = useCallback(async (dias: number) => {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch(`/api/recuperacion?dias=${dias}`, { cache: 'no-store' });
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }
      const d: Respuesta = await r.json();
      if (!d.ok) throw new Error(d.error ?? 'No se pudo leer la hoja web');
      setCandidatos(d.candidatos ?? []);
      setResumen(d.resumen ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(ventana);
  }, [cargar, ventana]);

  /**
   * Guarda y relee. Se relee todo en vez de parchear en memoria: la hoja la
   * toca también el cron de reputación y el registro de pedidos de KEPLER, así
   * que lo único confiable es volver a leerla.
   */
  const guardar = useCallback(
    async (
      c: Candidato,
      cambios: { estado?: string; nota?: string; aviso?: string }
    ): Promise<string | null> => {
      try {
        const r = await fetch('/api/recuperacion/actualizar', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fila: c.fila, id: c.id, ...cambios }),
        });
        const d = await r.json();
        if (!d.ok) return d.error ?? 'No se pudo guardar';
        await cargar(ventana);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : 'No se pudo guardar';
      }
    },
    [cargar, ventana]
  );

  const visibles = useMemo(() => {
    const q = sinTildes(busqueda.trim());
    return candidatos.filter((c) => {
      if (filtro !== 'TODOS' && c.accion !== filtro) return false;
      if (soloSinAvisar && c.avisos.length > 0) return false;
      if (!q) return true;
      return sinTildes([c.nombre, c.id, c.telefono, c.ciudad, c.descripcion].join(' ')).includes(q);
    });
  }, [candidatos, filtro, soloSinAvisar, busqueda]);

  const montoVisible = useMemo(
    () => visibles.reduce((a, c) => a + c.monto, 0),
    [visibles]
  );

  return (
    <div className="mx-auto min-h-dvh max-w-[1100px]">
      <header className="pad-arriba sticky top-0 z-30 border-b border-[var(--color-borde)] bg-[var(--color-fondo)]/90 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 sm:px-6 sm:pt-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full bg-[var(--color-ambar)] ${cargando ? 'latido' : ''}`}
              />
              <span className="text-[10px] font-semibold tracking-[0.2em] text-[var(--color-texto-tenue)] uppercase">
                Pedidos web sin cerrar
              </span>
            </div>
            <h1 className="text-xl font-semibold sm:mt-0.5 sm:text-2xl">Recuperar</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="pulsable min-h-11 rounded-full border border-[var(--color-borde)] px-4 text-sm leading-[2.75rem]"
            >
              Logística
            </Link>
            <button
              type="button"
              onClick={() => cargar(ventana)}
              disabled={cargando}
              className="pulsable min-h-11 rounded-full border border-[var(--color-borde)] px-4 text-sm disabled:opacity-50"
            >
              {cargando ? 'Leyendo…' : 'Refrescar'}
            </button>
          </div>
        </div>

        {/* La plata primero: es el único número que dice si vale la pena abrir
            esta pantalla hoy. */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pb-3 sm:px-6">
          <span className="text-2xl font-semibold text-[var(--color-ambar)]">
            {usd(montoVisible)}
          </span>
          <span className="text-sm text-[var(--color-texto-suave)]">
            en {visibles.length} pedido{visibles.length === 1 ? '' : 's'} sin cerrar
          </span>
          {resumen && resumen.avisados > 0 && (
            <span className="text-xs text-[var(--color-texto-tenue)]">
              · {resumen.avisados} ya avisado{resumen.avisados === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="tira flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {FILTROS.map((f) => {
            const n =
              f.clave === 'TODOS'
                ? candidatos.length
                : candidatos.filter((c) => c.accion === f.clave).length;
            const activo = filtro === f.clave;
            return (
              <button
                key={f.clave}
                type="button"
                onClick={() => setFiltro(f.clave)}
                className={`pulsable min-h-9 shrink-0 rounded-full border px-3 text-xs font-medium ${
                  activo
                    ? 'border-[var(--color-borde-fuerte)] bg-[var(--color-superficie-alta)]'
                    : 'border-[var(--color-borde)] text-[var(--color-texto-suave)]'
                }`}
              >
                {f.texto}
                <span className="ml-1.5 text-[var(--color-texto-tenue)]">{n}</span>
              </button>
            );
          })}
        </div>

        {/* En móvil el buscador va en su propia fila: junto a los 5 botones de
            ventana quedaba de 60px y no se leía ni el placeholder. */}
        <div className="px-4 pb-2 sm:hidden">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar nombre, ciudad, PED-…"
            className="w-full rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--color-borde-fuerte)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 sm:px-6">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar nombre, ciudad, PED-…"
            className="hidden min-w-0 flex-1 rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--color-borde-fuerte)] sm:block"
          />
          <button
            type="button"
            onClick={() => setSoloSinAvisar((v) => !v)}
            className={`pulsable min-h-9 shrink-0 rounded-full border px-3 text-xs font-medium ${
              soloSinAvisar
                ? 'border-[var(--color-ambar)]/50 bg-[var(--color-ambar-tenue)] text-[var(--color-ambar)]'
                : 'border-[var(--color-borde)] text-[var(--color-texto-suave)]'
            }`}
          >
            Sin avisar
          </button>
          <div className="tira flex shrink-0 gap-1">
            {VENTANAS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setVentana(d)}
                className={`pulsable min-h-9 rounded-full border px-2.5 text-xs ${
                  ventana === d
                    ? 'border-[var(--color-borde-fuerte)] bg-[var(--color-superficie-alta)]'
                    : 'border-[var(--color-borde)] text-[var(--color-texto-tenue)]'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 sm:px-6">
        {error && (
          <p className="prosa mb-4 rounded-lg bg-[var(--color-rojo-tenue)] px-3 py-2 text-sm text-[var(--color-rojo)]">
            ❌ {error}
          </p>
        )}

        {!cargando && !visibles.length && !error && (
          <p className="py-16 text-center text-sm text-[var(--color-texto-suave)]">
            {candidatos.length
              ? 'Ningún pedido pasa estos filtros.'
              : `Nada sin cerrar en los últimos ${ventana} días.`}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {visibles.map((c) => (
            <TarjetaCandidato
              key={c.id}
              c={c}
              abierta={abierto === c.id}
              estados={ESTADOS}
              onAbrir={() => setAbierto(abierto === c.id ? null : c.id)}
              onGuardar={(cambios) => guardar(c, cambios)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
