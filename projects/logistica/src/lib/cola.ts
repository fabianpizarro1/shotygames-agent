// ============================================================
// CÓMO SE ARMA LA COLA
//
// Vive acá y no en la ruta porque lo usan DOS: `/api/pedidos` (lo que ve
// Fabián) y `/api/cron/avisos` (el que le escribe a los clientes). Si el cron
// mirara una cola distinta de la que se ve en pantalla, avisaría por pedidos
// que Fabián no tiene delante.
// ============================================================

import * as dropshipping from './sheet';
import * as shotygames from './sheet-shotygames';
import { DROPI_DE, type Negocio } from './negocios';
import { getEstados, type EstadoSheet } from './estados';
import { armarPedido, enMovimiento, ordenarCola, resumir, type EstadoConsulta } from './logica';
import { hoyEC } from './fechas';
import { rastrearVarias } from './servientrega';
import type { Base, Pedido, Resumen, Tracking } from './tipos';

/** Toma las bases de un negocio, les cruza el tracking y las arma. */
async function conTracking(
  bases: Base[],
  hoy: string,
  estados: EstadoSheet[]
): Promise<Pedido[]> {
  if (!bases.length) return [];

  const cliente = DROPI_DE[bases[0].negocio];
  const ids = bases
    .filter((b) => b.pasaPorDropi)
    .map((b) => parseInt(b.ordenDropi ?? '', 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const { tracking, inexistentes, fallaron } = await cliente.getTrackingBatch([...new Set(ids)]);

  // Servientrega da el nombre COMPLETO del movimiento; DROPI lo recorta. Se
  // pide para las guías que van por ahí (98% de los pedidos) y se usa lo suyo
  // cuando contesta. Ver `servientrega.ts`.
  const guiasSV = bases
    .filter((b) => /SERVIENTREGA/i.test(b.transportadora ?? '') || !b.transportadora)
    .map((b) => b.guia ?? '')
    .filter(Boolean);
  const sv = await rastrearVarias(guiasSV);

  return bases.map((b) => {
    const id = parseInt(b.ordenDropi ?? '', 10);
    const sinOrden = !b.pasaPorDropi || !Number.isFinite(id) || id <= 0;

    const consulta: EstadoConsulta = sinOrden
      ? 'sin-orden'
      : tracking.has(id)
        ? 'ok'
        : inexistentes.has(id)
          ? 'no-existe'
          : fallaron.has(id)
            ? 'fallo'
            : 'sin-orden';

    const deDropi = tracking.get(id) ?? null;
    const guia = b.guia ?? deDropi?.guia ?? '';
    return armarPedido(b, mejorTracking(deDropi, guia ? sv.get(guia) : undefined), consulta, hoy, estados);
  });
}

/**
 * Combina las dos fuentes: la orden y la plata salen de DROPI, el recorrido de
 * Servientrega cuando lo tiene.
 *
 * Si Servientrega no contesta se queda todo como estaba — la app nunca depende
 * de que un sitio público esté arriba.
 */
function mejorTracking(
  dropi: Tracking | null,
  sv: { destino: string | null; movimientos: Tracking['movimientos']; estado: string | null } | undefined
): Tracking | null {
  if (!dropi) return null;
  if (!sv?.movimientos.length) return dropi;

  return {
    ...dropi,
    movimientos: sv.movimientos,
    destino: sv.destino,
    fuente: 'servientrega',
    // El ESTADO se deja el de DROPI a propósito: es el que decide el estado
    // sugerido del Sheet y el que ya está probado contra los literales de cada
    // negocio. Servientrega usa su propio vocabulario.
  };
}

interface Leido {
  pedidos: Pedido[];
  estados: EstadoSheet[];
}

async function leerDropshipping(hoy: string): Promise<Leido> {
  const { filas, C } = await dropshipping.leerFilas();
  const todas = filas.map((f) => dropshipping.aBase(f, C));
  // Los estados salen del Sheet, más los que de verdad estén en uso: la
  // validación de dropshipping no incluye NOVEDAD y hay pedidos ahí.
  const estados = await getEstados('dropshipping', todas.map((b) => b.estado));
  const bases = todas.filter((b) => enMovimiento(b));
  return { pedidos: await conTracking(bases, hoy, estados), estados };
}

async function leerShotygames(hoy: string): Promise<Leido> {
  const { filas, C } = await shotygames.leerFilas();
  const todas = filas.map((f) => shotygames.aBase(f, C));
  const estados = await getEstados('shotygames', todas.map((b) => b.estado));
  const bases = todas.filter((b) => enMovimiento(b));
  return { pedidos: await conTracking(bases, hoy, estados), estados };
}


export interface Cola {
  hoy: string;
  pedidos: Pedido[];
  resumen: Resumen;
  estados: Record<Negocio, EstadoSheet[]>;
  /** Negocios que no se pudieron leer. La cola se devuelve igual, avisando. */
  fallos: string[];
}

/**
 * Los dos negocios en paralelo. Si uno falla, el otro se devuelve igual: perder
 * ShotyGames por un problema del Sheet de dropshipping dejaría a Fabián sin ver
 * ninguno de los dos.
 */
export async function construirCola(): Promise<Cola> {
  const hoy = hoyEC();
  const [ds, sg] = await Promise.allSettled([leerDropshipping(hoy), leerShotygames(hoy)]);

  const pedidos: Pedido[] = [];
  const fallos: string[] = [];
  const estados: Record<Negocio, EstadoSheet[]> = { dropshipping: [], shotygames: [] };

  for (const [nombre, negocio, r] of [
    ['Truquito y Avanora', 'dropshipping', ds],
    ['ShotyGames', 'shotygames', sg],
  ] as const) {
    if (r.status === 'fulfilled') {
      pedidos.push(...r.value.pedidos);
      estados[negocio] = r.value.estados;
    } else {
      const motivo = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`construirCola — ${nombre}:`, motivo);
      fallos.push(`${nombre}: ${motivo}`);
    }
  }

  return { hoy, pedidos: ordenarCola(pedidos), resumen: resumir(pedidos), estados, fallos };
}
