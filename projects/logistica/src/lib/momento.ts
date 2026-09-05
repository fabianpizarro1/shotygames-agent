// ============================================================
// EN QUÉ MOMENTO ESTÁ EL PAQUETE
//
// El estado del Sheet dice en qué anda el PEDIDO. Esto dice dónde está el
// PAQUETE, que es otra cosa y es lo que decide qué mensaje le corresponde al
// cliente.
//
// NO es una lista inventada: sale de analizar **239 historiales completos** de
// Servientrega (`scripts/analizar-movimientos.js`), 64 movimientos distintos y
// la matriz de qué sigue a qué. Lo que ese análisis enseñó:
//
//   180  EN DISTRIBUCION A CLIENTE               → 41% termina entregado
//   105  INGRESANDO EN AGENCIA <X>               → 52% termina entregado EN AGENCIA
//    53  EN DISTRIBUCION PARA ENTREGA EN AGENCIA → 84% pasa a "Ingresando en Agencia"
//    35  INGRESANDO A CL <X>                     → 52% sale a distribución
//    17  DEVOLUCION AL REMITENTE                 → 88% es el final del historial
//    15  DEVUELTO DE CS <X>                      → 67% lo recolectan y arranca la vuelta
//    14  NOVEDAD EN CS                           → 46% termina devuelto, 31% entregado ahí
//
// TRES ERRORES QUE COSTARON UN CASO REAL CADA UNO:
//
//  1. **Leer solo el último movimiento.** JOSE ANDRES tenía "Ingresando a CL
//     GUAYAQUIL" y lo daba por recién llegado; el historial mostraba 8 días,
//     dos entregas fallidas y un pedido de retiro del propio cliente.
//  2. **"En Ruta a CL X" no es "llegó a X".** Es que va en camino; el camión
//     puede seguir en la carretera. Llegar es "Ingresando (Operativo) a CL X".
//  3. **Un tránsito puede ser la VUELTA.** EDUARDO GAIBOR mostraba "En Ruta a
//     CL MACHALA" —su ciudad de origen— porque el paquete se está devolviendo
//     después de un "Devuelto de CS BUCAY". Sin mirar atrás parecía un envío
//     normal.
// ============================================================

import type { Pedido, Tracking } from './tipos';
import TRANSICIONES from './transiciones.json';

export type Momento =
  | 'entregado'
  | 'en-devolucion'  // vuelve al remitente: ya no hay nada que cobrar
  | 'novedad'        // hubo un problema; el paquete sigue vivo
  | 'en-agencia'     // está en la agencia, esperando que lo retiren
  | 'hacia-agencia'  // va camino a la agencia, todavía no llegó
  | 'en-reparto'     // salió a entrega hoy
  | 'en-gestion'     // ya pasó algo antes y Servientrega resuelve qué hacer
  | 'en-ciudad'      // llegó a su ciudad POR PRIMERA VEZ y sigue su curso
  | 'en-transito'    // viajando, todavía lejos
  | 'sin-datos';

const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();

/** La ciudad a la que va el paquete. La de Servientrega manda sobre la del Sheet. */
export const ciudadDestino = (p: Pedido) => norm(p.tracking?.destino || p.ciudad);

/** ¿Este movimiento nombra la ciudad de destino, y no un acopio de paso? */
const nombraDestino = (texto: string, destino: string) =>
  destino.length >= 4 && norm(texto).includes(destino);

// ─── Las familias, tal como aparecen en los 239 historiales ──────────────────

/** Entregado, y los trámites que vienen después de entregar. */
const ES_ENTREGA =
  /^REPORTADO ENTREGADO|^ENTREGA DIGITALIZADA|^CERTIFICACION DE PRUEBA DE ENTREGA|^REGISTRO FOTOGRAFICO/;

/**
 * El paquete arrancó la vuelta al remitente. Cualquier tránsito POSTERIOR a
 * esto es parte de la devolución, no de la entrega.
 */
const ES_DEVOLUCION =
  /^DEVOLUCION AL REMITENTE|^DEVUELTO DE CS|^GESTION DE CONFIRMACION DEVOLUCION AL REMITENTE/;

/** Está físicamente en la agencia. "Novedad en CS" también: la novedad es ahí. */
const ES_EN_AGENCIA = /^INGRESANDO EN AGENCIA|^NOVEDAD EN CS|^NO RECLAMO EN OFICINA/;

/** Movimientos que sacan el paquete de la agencia. */
const ES_SALIDA_AGENCIA =
  /^RECOLECTADO EN AGENCIA|^DEVUELTO DE CS|^EN RUTA A|^EN DISTRIBUCION A CLIENTE|^REPORTADO ENTREGADO|^INGRESANDO OPERATIVO|^INGRESANDO A CL/;

/** Va camino a la agencia — todavía NO llegó. */
const ES_HACIA_AGENCIA = /^EN DISTRIBUCION PARA ENTREGA EN AGENCIA/;

/** El repartidor salió con el paquete. Servientrega lo escribe "a Cliente". */
const ES_REPARTO = /^EN DISTRIBUCION A CLIENTE/;

/** Problema de entrega. El paquete sigue vivo. */
const ES_NOVEDAD =
  /^DEVOLUCION DE DISTRIBUCION|^NO HAY QUIEN RECIBA|^NO LO CONOCEN|^MAL ZONIFICADO|^TITULAR SE NEGO|^FALTAN DATOS|^ENVIO CON NOVEDAD|^CERRADO|^DEMORADO|^DISTRIBUCION REPROGRAMADA|^CONFIRMACION SIN EXITO/;

/** Servientrega está decidiendo qué hacer (suelen llamar al cliente). */
const ES_GESTION = /CONFIRMACION/;

/** Llegar de verdad a un lugar (no "ir en camino a"). */
const ES_LLEGADA = /^INGRESANDO|^INGRESO A(?!\s*CONFIRMACION)/;

/**
 * El momento del paquete, mirando el historial completo.
 *
 * El orden de los chequeos es la regla de negocio: primero lo definitivo
 * (entrega, devolución), después dónde está, y recién al final el tránsito.
 */
export function momentoDelPaquete(p: Pedido): Momento {
  const t: Tracking | null = p.tracking;
  const movs = t?.movimientos ?? [];
  const ultimo = movs[0];
  if (!ultimo) return 'sin-datos';

  const mov = norm(ultimo.movimiento);
  const destino = ciudadDestino(p);
  const anteriores = movs.slice(1).map((m) => norm(m.movimiento));

  if (ES_ENTREGA.test(mov)) return 'entregado';

  // La devolución pesa sobre todo lo demás y es "pegajosa": una vez que el
  // paquete arrancó la vuelta, los tránsitos que siguen son de la vuelta.
  // (EDUARDO GAIBOR: "En Ruta a CL MACHALA" después de "Devuelto de CS BUCAY".)
  if (ES_DEVOLUCION.test(mov) || anteriores.some((m) => ES_DEVOLUCION.test(m))) {
    return 'en-devolucion';
  }

  // ⚠️ Servientrega registra movimientos FUERA DE ORDEN. Caso real (LEANDRO,
  // Babahoyo): entró a la agencia a las 09:41 y a las 11:13 registró "En
  // Distribucion para Entrega en Agencia", que lógicamente va ANTES. Por
  // timestamp el último decía "va en camino", pero al cliente ya le habían
  // dicho que su paquete estaba allá.
  //
  // Por eso no alcanza con mirar el último: si en algún momento entró a la
  // agencia y nada POSTERIOR lo sacó de ahí, está en la agencia.
  const iEntroAgencia = movs.findIndex((m) => ES_EN_AGENCIA.test(norm(m.movimiento)));
  if (iEntroAgencia >= 0) {
    const posteriores = movs.slice(0, iEntroAgencia).map((m) => norm(m.movimiento));
    if (!posteriores.some((m) => ES_SALIDA_AGENCIA.test(m))) return 'en-agencia';
  }

  if (ES_HACIA_AGENCIA.test(mov)) return 'hacia-agencia';
  if (ES_REPARTO.test(mov)) return 'en-reparto';
  if (ES_NOVEDAD.test(mov)) return 'novedad';
  if (ES_GESTION.test(mov)) return 'en-gestion';

  // Llegado acá el último movimiento es un tránsito. Lo que significa depende
  // de si ya pasó algo antes.
  const tuvoHistoria = anteriores.some(
    (m) =>
      ES_NOVEDAD.test(m) || ES_REPARTO.test(m) || ES_GESTION.test(m) || /SOLICITA RETIRAR/.test(m)
  );
  if (tuvoHistoria) return 'en-gestion';

  if (ES_LLEGADA.test(mov) && nombraDestino(mov, destino)) return 'en-ciudad';

  return 'en-transito';
}

export const ETIQUETA_MOMENTO: Record<Momento, string> = {
  entregado: 'Entregado',
  'en-devolucion': 'En devolución',
  novedad: 'Con novedad',
  'en-agencia': 'En agencia',
  'hacia-agencia': 'Camino a la agencia',
  'en-reparto': 'Salió a entrega',
  'en-gestion': 'En gestión',
  'en-ciudad': 'Llegó a su ciudad',
  'en-transito': 'En tránsito',
  'sin-datos': 'Sin movimientos',
};

// ─── Qué va a pasar después ──────────────────────────────────────────────────

/**
 * Reduce un movimiento a su familia, sacándole el nombre propio de agencia,
 * ciudad o centro logístico. Es la misma normalización que usó el análisis, y
 * tiene que seguir siéndolo o la tabla deja de encontrar la clave.
 */
function familia(m: string): string {
  return norm(m)
    .replace(/\b(CL|CS)\s+[A-Z0-9_(). ]+$/, '$1 <LUGAR>')
    .replace(/\b(AGENCIA|CONCESION)\s+[A-Z0-9_(). ]+$/, '$1 <LUGAR>')
    .replace(/\bA\s+CENTRO LOGISTICO\s+.*$/, 'A CENTRO LOGISTICO <LUGAR>')
    .replace(/\d{3,}/g, '<N>')
    .trim();
}

/** Cómo se lee cada familia en la interfaz. */
const LEGIBLE: Record<string, string> = {
  'REPORTADO ENTREGADO EN APP': 'que lo entreguen',
  'REPORTADO ENTREGADO EN AGENCIA <LUGAR>': 'que lo retiren en la agencia',
  'EN DISTRIBUCION A CLIENTE': 'que salga a entrega',
  'EN DISTRIBUCION PARA ENTREGA EN AGENCIA': 'que lo lleven a una agencia',
  'INGRESANDO EN AGENCIA <LUGAR>': 'que llegue a la agencia',
  'INGRESANDO A CL <LUGAR>': 'que vuelva al centro logístico',
  'INGRESANDO OPERATIVO A CENTRO LOGISTICO <LUGAR>': 'que llegue al centro logístico',
  'EN RUTA A CENTRO LOGISTICO <LUGAR>': 'que salga hacia otro centro logístico',
  'EN RUTA A CONCESION <LUGAR>': 'que salga hacia la sucursal local',
  'RECOLECTADO EN AGENCIA <LUGAR>': 'que lo recojan de la agencia',
  'DEVOLUCION AL REMITENTE': 'que se devuelva',
  'DEVUELTO DE CS <LUGAR>': 'que lo devuelvan desde la agencia',
  'DEVOLUCION DE DISTRIBUCION NO HAY QUIEN RECIBA': 'que no haya quien reciba',
  'DEVOLUCION DE DISTRIBUCION CLIENTE SOLICITA RETIRAR EN CS': 'que pida retirarlo en agencia',
  'NOVEDAD EN CS': 'que reporten una novedad en la agencia',
  'GESTION DE CONFIRMACION CONFIRMADO': 'que confirmen qué hacer',
  '(no se mueve mas)': 'que no se mueva más',
};

export interface Prediccion {
  /** En texto llano, qué es lo más probable que pase ahora. */
  texto: string;
  /** Sobre 100, según los 239 historiales analizados. */
  probabilidad: number;
}

/**
 * Qué suele pasar después del último movimiento.
 *
 * Sale de la frecuencia observada, no de una regla escrita a mano: si mañana
 * Servientrega cambia de comportamiento, se vuelve a correr el script y la
 * tabla se actualiza sola.
 */
export function prediccion(p: Pedido): Prediccion | null {
  const ultimo = p.tracking?.movimientos[0];
  if (!ultimo) return null;

  const ops = (TRANSICIONES as Record<string, { m: string; p: number }[]>)[
    familia(ultimo.movimiento)
  ];
  if (!ops?.length) return null;

  const mejor = ops[0];
  const texto = LEGIBLE[mejor.m];
  // Si no hay traducción, no se muestra el nombre crudo de Servientrega: no le
  // dice nada a nadie.
  return texto ? { texto, probabilidad: mejor.p } : null;
}
