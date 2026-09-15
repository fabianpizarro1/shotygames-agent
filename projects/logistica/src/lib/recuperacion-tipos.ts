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
 * La tasa de devolución de TODO el mercado, medida sobre los 302 teléfonos
 * únicos de la hoja: **487 de 1.529 pedidos = 31,9%** (2026-09-14).
 *
 * El número importa por dos motivos. Uno: en este mercado devolver es normal,
 * así que un cliente al 30% **no** "devuelve seguido" — está en el promedio.
 * Dos: es la mejor apuesta sobre alguien de quien no se sabe nada, y por eso es
 * hacia acá que se corrige la tasa de quien tiene pocos pedidos.
 */
export const TASA_BASE_MERCADO = 0.319;

/**
 * Cuánto pesa la media del mercado frente al historial propio del cliente,
 * medido en "pedidos imaginarios". Con 4, un cliente de 1 pedido queda a mitad
 * de camino entre su dato y el mercado; uno de 187 queda prácticamente en su
 * dato real.
 */
export const PESO_PRIOR = 4;

/**
 * La vara: **35% de tasa ajustada**. Está por encima del 31,9% del mercado a
 * propósito — la idea es marcar a quien devuelve MÁS que el promedio, no a
 * cualquiera que esté en el promedio.
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
 * tasa del mercado. Así 1/1 da 46% (mala señal, pero no 100%) y 40/187 da 22%
 * (mejor que el mercado, que es la verdad aunque sean 40 devoluciones).
 */
export function tasaAjustada(dropi: PedidoWeb['dropi']): number {
  const p = dropi?.pedidos ?? 0;
  const d = dropi?.devueltos ?? 0;
  return (d + PESO_PRIOR * TASA_BASE_MERCADO) / (p + PESO_PRIOR);
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

/** Qué plantillas ya se le mandaron, del formato "id|fecha ; id|fecha". */
export function avisosDe(logWa: string): { id: string; fecha: string }[] {
  return logWa
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const [id, fecha = ''] = x.split('|');
      return { id: id.trim(), fecha: fecha.trim() };
    })
    .filter((x) => x.id);
}

/** Una marca nueva agregada al LOG WA, sin perder las que ya estaban. */
export function marcarAviso(logWa: string, idPlantilla: string, ahora: string): string {
  const previos = logWa.trim();
  const marca = `${idPlantilla}|${ahora}`;
  return previos ? `${previos} ; ${marca}` : marca;
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
