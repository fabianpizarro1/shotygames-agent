// ============================================================
// LAS REGLAS DEL NEGOCIO
//
// Todo lo que decide "esto hay que atenderlo" vive acá y no en los componentes:
// la interfaz pinta, no calcula. Y lo que cuesta plata (utilidad, pérdida,
// estado sugerido) se deriva en código con reglas explícitas — nada de eso se
// deja al criterio de nadie en el momento de mirar la pantalla.
//
// Esta capa NO sabe de columnas ni de Sheets: recibe la forma común `Base` que
// arman los adaptadores, así que ShotyGames y dropshipping se tratan igual.
// ============================================================

import { diasEntre } from './fechas';
import { norm, type Fase } from './negocios';
import type { EstadoSheet } from './estados';
import type { Alerta, Base, Pedido, Resumen, Tracking } from './tipos';
import { momentoDelPaquete, prediccion } from './momento';

/** Qué pasó al preguntarle a DROPI por la orden de este pedido. */
export type EstadoConsulta = 'ok' | 'no-existe' | 'fallo' | 'sin-orden';

/**
 * ¿Este pedido tiene que aparecer en la cola?
 *
 * Solo lo que está viajando. Fuera quedan:
 *   · `cerrado` — entregado, pagado o cancelado: no hay nada que hacer.
 *   · `preparando` — ShotyGames en PENDIENTE: Fabián todavía lo está armando y
 *     no lo entregó a la transportadora. Entra recién al pasar a ENVIADO.
 *   · `devuelto` — Fabián pidió sacarlas de la vista (2026-09-03). Si algún día
 *     las quiere de vuelta, se saca de esta lista y vuelven solas.
 */
const FUERA_DE_LA_COLA = new Set<Fase>(['cerrado', 'preparando', 'devuelto']);

export function enMovimiento(b: Base): boolean {
  return !FUERA_DE_LA_COLA.has(b.fase);
}

/**
 * Qué estado debería tener el Sheet según lo que DROPI reporta hoy.
 *
 * Devuelve el literal EXACTO del negocio que corresponde: escribir "DEVUELTO"
 * en el Sheet de ShotyGames, que usa "DEVOLUCION", deja la celda fuera del
 * desplegable de la hoja DATOS y los filtros del Sheet dejan de verla.
 *
 * **PAGADO nunca se sugiere**: no sale del estado del envío sino de que la
 * plata haya caído en la wallet, y confundir "entregado" con "cobrado" es
 * exactamente el error que hace creer que hay caja donde no la hay.
 */
export function estadoSegunDropi(
  estados: EstadoSheet[],
  t: Tracking | null,
  faseActual: Fase
): string | null {
  if (!t) return null;

  const actual = norm(t.estado);
  const pasos = t.historial.map((h) => norm(h.estado));
  const tuvo = (re: RegExp) => pasos.some((p) => re.test(p)) || re.test(actual);

  const fase = tuvo(/^ENTREGADO/)
    ? 'entregado'
    : tuvo(/DEVOLUCION|DEVUELT/)
      ? 'devuelto'
      : /ANULAD|CANCELAD/.test(actual)
        ? 'cancelado'
        : actual === 'NOVEDAD'
          ? 'novedad'
          : t.guia
            ? 'en-camino'
            : 'por-despachar';

  // Si el pedido YA está en la misma fase que reporta DROPI, no hay nada que
  // sugerir. Sin esto, a 8 pedidos de ShotyGames en ENVIADO se les proponía
  // volver a PENDIENTE solo porque es el primer literal de la fase en-camino:
  // una sugerencia que mueve el pedido para atrás y ensucia la cola con
  // diferencias que no existen.
  const faseDropi: Fase =
    fase === 'entregado' || fase === 'cancelado'
      ? 'cerrado'
      : fase === 'devuelto'
        ? 'devuelto'
        : fase === 'novedad'
          ? 'novedad'
          : fase === 'en-camino'
            ? 'en-camino'
            : 'por-despachar';

  if (faseDropi === faseActual) return null;

  // Un pedido que Fabián todavía está preparando NO se toca por lo que diga
  // DROPI: la guía se genera antes de despachar, así que DROPI lo ve "en
  // camino" desde el primer día y sugeriría marcarlo enviado antes de tiempo.
  if (faseActual === 'preparando' && faseDropi === 'en-camino') return null;

  // Una novedad NO se cierra sola porque el paquete se haya vuelto a mover.
  // Caso real (2026-09-03): un pedido en NOVEDAD por "DEVOLUCION DE
  // DISTRIBUCION" terminó "PARA RETIRO EN AGENCIA" y la app sugería pasarlo a
  // ENVIADO — sacándolo del filtro de Novedades, que es justo donde Fabián
  // busca el trabajo, cuando todavía había que avisarle al cliente que fuera a
  // retirarlo. Una novedad solo se cierra cuando el paquete se entrega o se
  // devuelve; volver a "en camino" nunca se sugiere.
  if (faseActual === 'novedad' && faseDropi === 'en-camino') return null;

  const buscar = (re: RegExp) => estados.find((e) => re.test(norm(e.literal)))?.literal ?? null;
  const primeraDeFase = (f: Fase) => estados.find((e) => e.fase === f)?.literal ?? null;

  switch (fase) {
    case 'entregado':
      return buscar(/^ENTREGADO$/);
    case 'devuelto':
      return primeraDeFase('devuelto');
    case 'cancelado':
      return buscar(/^CANCELADO$/);
    case 'novedad':
      return buscar(/^NOVEDAD$/);
    case 'en-camino':
      return primeraDeFase('en-camino');
    default:
      return primeraDeFase('por-despachar');
  }
}

/** El movimiento más reciente que reportó la transportadora, si hay alguno. */
function ultimaSenal(t: Tracking | null): string | null {
  if (!t) return null;
  return t.movimientos[0]?.fecha ?? t.historial[0]?.fecha ?? null;
}

/**
 * Por qué este pedido pide atención. El orden importa: lo primero de la lista
 * es lo que se muestra en la tarjeta cerrada.
 */
function calcularAlertas(
  b: Base,
  p: {
    dias: number;
    diasQuieto: number | null;
    tracking: Tracking | null;
    estadoSugerido: string | null;
    consulta: EstadoConsulta;
    momento: import('./momento').Momento;
  }
): Alerta[] {
  const a: Alerta[] = [];
  const t = p.tracking;

  if (b.fase === 'novedad') {
    a.push({ nivel: 'rojo', texto: t?.novedad ?? `${b.etiquetaEstado} — sin motivo reportado` });
  }

  // Un pedido creado en DROPI que en 3 días no tiene guía es un proveedor que
  // no despachó. No se arregla solo: hay que reclamarlo.
  if (b.fase === 'por-despachar' && !b.guia && p.dias >= 3) {
    a.push({ nivel: 'rojo', texto: `${p.dias} días sin que se genere la guía` });
  }

  if (p.diasQuieto !== null && b.fase !== 'novedad') {
    if (p.diasQuieto >= 4) {
      a.push({ nivel: 'rojo', texto: `Sin movimiento hace ${p.diasQuieto} días` });
    } else if (p.diasQuieto === 3) {
      a.push({ nivel: 'ambar', texto: 'Sin movimiento hace 3 días' });
    }
  }

  // Dos cosas distintas que antes se mostraban igual. "No existe" es trabajo
  // real: DROPI le cambió el id a la orden cuando se la editó en el panel. "No
  // se pudo preguntar" es la API que no contestó y se reintenta sola — decirle
  // a Fabián que revise eso a mano es mandarlo a perder el tiempo.
  if (p.consulta === 'no-existe') {
    a.push({ nivel: 'rojo', texto: 'DROPI no encuentra esta orden — el id cambió al editarla' });
  } else if (p.consulta === 'fallo') {
    a.push({ nivel: 'ambar', texto: 'No se pudo consultar DROPI en este momento' });
  } else if (p.consulta === 'sin-orden' && b.pasaPorDropi) {
    // Si el envío es a domicilio o por cooperativa no pasa por DROPI y no tener
    // orden es lo esperado, no un problema.
    a.push({ nivel: 'ambar', texto: 'Sin orden de DROPI registrada en el Sheet' });
  }

  // Un paquete parado en agencia es trabajo: si el cliente no lo retira, se
  // devuelve. Va como AVISO y no como cambio de estado a propósito — de 14
  // casos reales (2026-09-03) solo 1 decía en la dirección que el retiro era
  // intencional y 4 habían llegado ahí por una novedad; los otros 9 no se
  // podían distinguir. Marcarlos NOVEDAD en el Sheet habría sido inventar.
  if (p.momento === 'en-agencia') {
    a.push({
      nivel: 'ambar',
      texto: 'En agencia esperando que el cliente lo retire — si no va, se devuelve',
    });
  }

  if (p.estadoSugerido && norm(p.estadoSugerido) !== norm(b.estado)) {
    a.push({ nivel: 'ambar', texto: `DROPI ya lo tiene como ${p.estadoSugerido}` });
  }

  // Un cliente que devolvió más de lo que recibió es plata que probablemente se
  // pierda otra vez. Se avisa desde 3 pedidos: con 1 o 2 no hay muestra.
  const c = t?.cliente;
  if (c && c.pedidos >= 3 && c.devueltos > c.entregados) {
    a.push({
      nivel: 'ambar',
      texto: `Cliente con ${c.devueltos} devoluciones de ${c.pedidos} pedidos`,
    });
  }

  return a;
}

/** La forma común + su tracking → el pedido que consume la interfaz. */
export function armarPedido(
  b: Base,
  tracking: Tracking | null,
  consulta: EstadoConsulta,
  hoy: string,
  estados: EstadoSheet[]
): Pedido {
  const dias = diasEntre(b.fecha, hoy);
  const senal = ultimaSenal(tracking);
  const diasQuieto = senal ? diasEntre(senal.slice(0, 10), hoy) : null;

  const sugerido = estadoSegunDropi(estados, tracking, b.fase);
  const estadoSugerido = sugerido && norm(sugerido) !== norm(b.estado) ? sugerido : null;

  // El momento se calcula antes que las alertas porque varias dependen de él.
  const parcial = { ...b, dias, diasQuieto, tracking } as Pedido;
  const momento = momentoDelPaquete(parcial);

  const alertas = calcularAlertas(b, {
    dias,
    diasQuieto,
    tracking,
    estadoSugerido,
    consulta,
    momento,
  });

  return {
    ...b,
    momento,
    prediccion: prediccion(parcial),
    // La dirección del Sheet manda; la de DROPI es el respaldo (siempre viene).
    direccion: b.direccion || tracking?.direccion || '',
    guia: b.guia || tracking?.guia || null,
    transportadora: b.transportadora || tracking?.transportadora || null,
    dias,
    diasQuieto,
    tracking,
    enAgencia: momento === 'en-agencia',
    estadoSugerido,
    alertas,
    prioridad: alertas.some((x) => x.nivel === 'rojo') ? 0 : alertas.length ? 1 : 2,
  };
}

/** Novedades y paquetes trabados arriba; dentro de cada grupo, el más viejo primero. */
export function ordenarCola(pedidos: Pedido[]): Pedido[] {
  return [...pedidos].sort(
    (a, b) => a.prioridad - b.prioridad || (b.diasQuieto ?? b.dias) - (a.diasQuieto ?? a.dias)
  );
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export function resumir(pedidos: Pedido[]): Resumen {
  return {
    total: pedidos.length,
    novedades: pedidos.filter((p) => p.fase === 'novedad').length,
    enCamino: pedidos.filter((p) => p.fase === 'en-camino').length,
    sinDespachar: pedidos.filter((p) => p.fase === 'por-despachar').length,
    // Lo que entra si todo lo que está en la calle se entrega…
    porCobrar: redondear(pedidos.reduce((s, p) => s + p.aCobrar, 0)),
    // …y lo que se pierde si nada llega. Los dos números juntos son la apuesta
    // que hay abierta ahora mismo.
    enRiesgo: redondear(pedidos.reduce((s, p) => s + p.perdidaSiDevuelve, 0)),
    sinTracking: pedidos.filter((p) => p.pasaPorDropi && !p.tracking).length,
  };
}
