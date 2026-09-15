// ============================================================
// RECUPERACIÓN DE PEDIDOS WEB — tipos y reglas (cliente Y servidor)
//
// La otra mitad del negocio que nadie estaba mirando: el que llenó el checkout
// de la web y nunca se convirtió en venta. Al 2026-09-14 eran **94 pedidos y
// $3.058 en 30 días**, contra los ~20 que hay en la cola de logística.
//
// Son dos situaciones distintas y cada una necesita un mensaje distinto:
//
//  · **El que no confirmó.** Eligió contra entrega (94% de los casos), lo que
//    en la web lo manda a WhatsApp a coordinar — y nunca escribió, o escribió
//    y se perdió el hilo. Hay que pedirle la confirmación.
//  · **El que Fabián frenó.** Su teléfono tiene un historial de devoluciones
//    en DROPI que hace que mandarlo contra entrega sea perder el flete. Hay
//    que contarle el motivo y ofrecerle el anticipo del envío.
//
// Cuánto "devuelve" un cliente NO se mide con `devueltos / pedidos` a secas —
// ver `tasaAjustada()`, que es donde está el único cálculo delicado de acá.
//
// ⚠️ **En el dato los dos son lo mismo**: las dos situaciones quedan
// `SIN COMPRAR` y no hay forma de distinguirlas mirando la hoja. Por eso el
// mensaje NO se elige por el estado histórico sino por la **reputación DROPI**,
// que es un hecho verificable y está en las 317 filas. El estado `FRENADO` sirve
// para que de acá en adelante quede escrito cuál fue una decisión de Fabián.
//
// Este archivo va SEPARADO de `recuperacion.ts` porque lo importan los
// componentes: ahí no puede entrar nada que arrastre `googleapis` o Turbopack
// intenta meter `child_process` en el bundle del navegador.
// ============================================================

/** Lo que trae una fila de "PEDIDOS LOVABLE", ya limpia. */
export interface PedidoWeb {
  /** Número de fila real, para escribir. */
  fila: number;
  /** `PED-XXXXX`. Es la clave: única y estable (317 de 317 el 2026-09-14). */
  id: string;
  fecha: string;
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  descripcion: string;
  /** Lo que valía el pedido. */
  monto: number;
  /** Lo que eligió en el checkout: transferencia / tarjeta / contraentrega. */
  metodoPago: string;
  /** El literal tal cual está en la hoja. */
  estado: string;
  /** Reputación del cliente en TODA la plataforma DROPI, no solo acá. */
  dropi: { pedidos: number; entregados: number; devueltos: number } | null;
  /** Marcas de qué plantillas ya se le mandaron ("id|fecha ; id|fecha"). */
  logWa: string;
  nota: string;
}

/**
 * El estado que Fabián le pone a un pedido que decidió NO despachar por la
 * reputación del cliente. Vive en `DATOS!C6` de la hoja, que la validación de
 * la columna ESTADO (`DATOS!$C$2:$C$19`) ya cubre — no hay que tocar la
 * validación. Lo agregó `scripts/preparar-recuperacion.js`.
 */
export const ESTADO_FRENADO = 'FRENADO';

/**
 * Los estados en los que un pedido web todavía es recuperable.
 *
 * `AVISADO` es el que Fabián usaba a mano hasta el 18/08 y quedó abandonado
 * (29 filas, ninguna posterior). Entra igual: si no compró, sigue siendo plata
 * en el piso — y la ventana de días lo saca de la vista por sí sola.
 */
export const RECUPERABLES = ['SIN COMPRAR', ESTADO_FRENADO, 'AVISADO'];

/** En qué balde cae el cliente, que es lo que decide el mensaje. */
export type Balde = 'riesgo' | 'ojo' | 'sano' | 'nuevo';

/**
 * El promedio de devoluciones **de toda la plataforma DROPI**: 487 de 1.529
 * pedidos = **31,9%**, sumando el historial de los 302 teléfonos únicos de la
 * hoja (2026-09-14).
 *
 * ⚠️ **Esto NO es la tasa de ShotyGames.** La de ShotyGames es **3,2%** (20
 * devoluciones de 632 pedidos con desenlace, hoja oficial). Diez veces menos.
 * La primera versión de esto lo llamaba "la tasa de tu mercado" en la pantalla,
 * y Fabián preguntó de dónde salía justamente porque no le cerraba — tenía
 * razón, la etiqueta estaba mal.
 *
 * Pero el número **sí** es el prior correcto, y cambiarlo por el 3,2% rompería
 * el cálculo: el prior tiene que estar en la MISMA ESCALA que la evidencia, y
 * la evidencia es el historial del cliente en todo DROPI, cuyo promedio es
 * 31,9%. Mezclar escalas no es más exacto, es incoherente: con el prior en
 * 3,2% el sistema no detecta NINGUNA de las 7 devoluciones reales que hay para
 * validar, contra 2 de 7 con el prior correcto.
 *
 * Lo que sale de acá es un **ranking** de clientes, no una probabilidad de que
 * ESTE pedido se devuelva. Para eso, lo único medido: los pedidos de ShotyGames
 * que terminaron en devolución eran de clientes con 31,4% de tasa DROPI
 * promedio, contra 6,9% de los que se entregaron. La señal separa 4,5x.
 */
export const TASA_BASE_DROPI = 0.319;

/**
 * La tasa de devolución propia de ShotyGames: 20 de 632 pedidos con desenlace.
 * No entra en el cálculo — está acá porque es el número que hay que tener a
 * mano para no volver a confundir "el promedio de DROPI" con "lo que me pasa
 * a mí".
 */
export const TASA_PROPIA_SHOTYGAMES = 0.032;

/**
 * Cuánto pesa el promedio de DROPI frente al historial propio del cliente,
 * medido en "pedidos imaginarios". Con 4, un cliente de 1 pedido queda a mitad
 * de camino entre su dato y el promedio; uno de 187 queda prácticamente en su
 * dato real.
 */
export const PESO_PRIOR = 4;

/**
 * La vara: **35% de tasa ajustada**, o sea por encima del 31,9% promedio de
 * DROPI — marca a quien devuelve más que el resto de la plataforma.
 *
 * ⚠️ **Esta vara NO la eligieron los datos y no se puede fingir que sí.** Solo
 * hay 7 devoluciones con reputación conocida para validar, y entre 35% y 45%
 * detectan lo mismo (2 de 7) con casi las mismas falsas alarmas (3 vs 2 de 70).
 * Con esa muestra ningún umbral es demostrablemente mejor.
 *
 * Se eligió el extremo permisivo a propósito, y el motivo es económico: los
 * pedidos de esta lista **ya no se concretaron**. No hay venta que arruinar, así
 * que una falsa alarma cuesta pedirle $5 a alguien que igual estaba en cero.
 * Si esto se aplicara alguna vez a pedidos vivos habría que subirla: una
 * devolución cuesta $6,47 de flete y el ticket promedio es $36,51 — ahí el
 * riesgo de matar la venta supera al de comerse el flete.
 *
 * Mover la vara cambia el reparto de los 112 así (medido 2026-09-14):
 * 35% → 55 riesgo · 40% → 47 · 45% → 37 · 50% → 23.
 */
export const UMBRAL_DEVOLUCIONES = 0.35;

/**
 * La tasa de devolución del cliente, corregida por cuánta evidencia hay.
 *
 * ⚠️ **Por qué no se usa `devueltos / pedidos` a secas.** La primera versión de
 * esto tenía un mínimo de 3 pedidos para no juzgar con poca evidencia, y el
 * resultado fue que 22 de los 38 clientes etiquetados "historial sano" habían
 * devuelto algo — 12 de ellos el 100% de lo que pidieron. Fabián lo cazó al
 * toque: "¿por qué a alguien que tiene un pedido y ese pedido fue devuelto le
 * pones sano?". Tenía razón: 1 de 1 devuelto no es sano, es mala señal con
 * poca evidencia, que no es lo mismo.
 *
 * Un mínimo de pedidos no arregla eso, solo mueve el problema a un escalón
 * arbitrario. Lo que corresponde es que la poca evidencia **pese poco** en vez
 * de no contar: se le suman al cliente `PESO_PRIOR` pedidos imaginarios con la
 * promedio de DROPI. Así 1/1 da 46% (mala señal, pero no 100%) y 40/187 da 22%
 * (mejor que el promedio de DROPI, que es la verdad aunque sean 40 devoluciones).
 *
 * ⚠️ **Punto ciego.** De las 7 devoluciones reales de ShotyGames, **3 fueron de
 * clientes con CERO devoluciones previas** (0/1, 0/4, 0/2). Ninguna vara las
 * detecta. `sano` y `nuevo` no son una garantía de que el pedido llegue.
 */
export function tasaAjustada(dropi: PedidoWeb['dropi']): number {
  const p = dropi?.pedidos ?? 0;
  const d = dropi?.devueltos ?? 0;
  return (d + PESO_PRIOR * TASA_BASE_DROPI) / (p + PESO_PRIOR);
}

/** Cuánto se le pide de adelanto al de riesgo: el flete, redondeado. */
export const ANTICIPO_ENVIO = 5;

/** Días hacia atrás que se miran por defecto. */
export const VENTANA_DIAS = 30;

export function baldeDe(dropi: PedidoWeb['dropi']): Balde {
  // Sin dato de reputación se lo trata como nuevo, nunca como riesgo: acusar a
  // alguien de devolver paquetes porque el cron todavía no pasó por su fila
  // sería mandarle el mensaje equivocado.
  if (!dropi || dropi.pedidos === 0) return 'nuevo';

  if (tasaAjustada(dropi) >= UMBRAL_DEVOLUCIONES) return 'riesgo';

  // No llega a la vara, pero devolvió alguna: no es "sano". `sano` queda
  // reservado para el que **nunca** devolvió nada, que es lo único que esa
  // palabra puede significar sin mentir.
  return dropi.devueltos > 0 ? 'ojo' : 'sano';
}

/**
 * Qué plantillas están marcadas como enviadas, del formato "id|fecha ; id|fecha".
 *
 * Mismo formato que la columna LOG WA de la hoja oficial, para que lo que se
 * marca acá se siga leyendo desde `finanzas-app` y desde la cola de logística.
 */
export function avisosDe(logWa: string): { id: string; fecha: string }[] {
  const porId = new Map<string, string>();
  for (const tramo of String(logWa || '').split(';')) {
    const [id, fecha = ''] = tramo.split('|').map((x) => x.trim());
    // Si un id se repite queda el último: la marca es un estado por plantilla,
    // no un historial de cuántas veces se tocó el botón.
    if (id) porId.set(id, fecha);
  }
  return [...porId].map(([id, fecha]) => ({ id, fecha }));
}

/**
 * Marca o desmarca una plantilla en el LOG WA, conservando las demás.
 *
 * Se marca sola al abrir WhatsApp **y se puede destildar**, como pidió Fabián
 * el 2026-09-14: *"a veces solo le toco abre WS pero no le mando el mensaje"*.
 * Un `wa.me` no avisa si se apretó enviar, así que el automático es una
 * suposición y el check es lo que la corrige. Es el registro de lo que Fabián
 * dice que mandó, no una confirmación de entrega — y existe para no escribirle
 * dos veces al mismo cliente, así que tiene que poder corregirse.
 */
export function marcarAviso(
  logWa: string,
  idPlantilla: string,
  ahora: string,
  enviado = true
): string {
  const marcas = new Map(avisosDe(logWa).map((a) => [a.id, a.fecha]));
  if (enviado) marcas.set(idPlantilla, ahora);
  else marcas.delete(idPlantilla);
  return [...marcas].map(([id, f]) => `${id}|${f}`).join(' ; ');
}

export interface Candidato extends PedidoWeb {
  dias: number;
  balde: Balde;
  /** Porcentaje crudo de devoluciones, 0-100. `null` si no hay reputación. */
  tasaDevolucion: number | null;
  /**
   * Porcentaje ajustado por evidencia, 0-100 — el que decide el balde. Es el
   * número que hay que mirar; el crudo está al lado solo para entender de dónde
   * salió. `null` si no hay reputación cargada.
   */
  tasaAjustada: number | null;
  /** Lo que ya se le escribió desde esta pantalla. */
  avisos: { id: string; fecha: string }[];
  /**
   * Este teléfono tiene un pedido VIVO en la hoja oficial. No lo saca de la
   * lista pero sí hay que leerlo antes de escribir: puede ser este mismo
   * pedido, registrado a mano sin el código de la web.
   */
  avisoPedidoVivo: string | null;
  /** Lo que se cobraría al entregar si acepta el anticipo. */
  saldoConAnticipo: number;
}

export interface ResumenRecuperacion {
  total: number;
  monto: number;
  porBalde: Record<Balde, { pedidos: number; monto: number }>;
  /** A cuántos ya se les escribió al menos una vez. */
  avisados: number;
}

export interface Lista {
  candidatos: Candidato[];
  resumen: ResumenRecuperacion;
  hoy: string;
  /** Días de ventana que se aplicaron. */
  ventana: number;
}
