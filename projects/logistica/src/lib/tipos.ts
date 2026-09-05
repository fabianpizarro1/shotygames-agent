// Tipos compartidos entre el servidor (Sheets + DROPI) y la interfaz.

import type { Fase, Negocio, Tienda } from './negocios';
import type { MetodoPago } from './pago';
import type { Momento } from './momento';

export type { Fase, Negocio, Tienda, MetodoPago, Momento };

export interface Movimiento {
  /** "EN REPARTO", "EN DISTRIBUCIÓN A CLIENTE", "GENERADA"… */
  movimiento: string;
  /** Texto libre del repartidor. Llega sucio; se limpia en dropi.ts. */
  motivo: string;
  fecha: string;
}

export interface HistorialEstado {
  estado: string;
  fecha: string;
}

export interface Tracking {
  ordenId: number;
  guia: string | null;
  /** Estado real según DROPI — más fino que la columna ESTADO del Sheet. */
  estado: string | null;
  novedad: string | null;
  fechaUltimaNovedad: string | null;
  transportadora: string | null;
  movimientos: Movimiento[];
  historial: HistorialEstado[];
  /** Historial del cliente en DROPI: cuánto vale la pena insistirle. */
  cliente: { pedidos: number; entregados: number; devueltos: number } | null;
  direccion: string | null;
  fletePorCobrar: number;
  pdf: string | null;
  /**
   * De dónde salieron los movimientos. Servientrega da el nombre completo
   * ("Ingresando en Agencia QUITO_CONDADO"); DROPI lo recorta a "INGRESANDO EN
   * AGENCIA". Se prefiere Servientrega y se cae a DROPI si no contesta.
   */
  fuente: 'servientrega' | 'dropi';
  /** Ciudad de destino según Servientrega — más confiable que la del Sheet. */
  destino: string | null;
}

/** Motivo por el que un pedido está marcado en rojo o ámbar en la cola. */
export interface Alerta {
  nivel: 'rojo' | 'ambar';
  texto: string;
}

/**
 * Lo que cada adaptador de Sheet tiene que producir. Todo lo que difiere entre
 * ShotyGames y dropshipping (columnas, locale, nombres de estado) se resuelve
 * antes de llegar acá; de este punto en adelante los tres negocios son iguales.
 */
export interface Base {
  negocio: Negocio;
  tienda: Tienda;
  /** Número de fila real en el Sheet. */
  fila: number;
  /** Lo que se le muestra a Fabián para identificar el pedido. */
  id: string;
  /**
   * Con qué se confirma, antes de escribir, que la fila sigue siendo la misma.
   * NO es el id: en el Sheet de ShotyGames la columna ID vale "1" en las 618
   * filas, así que ahí la clave es nombre + teléfono.
   */
  clave: string;
  fecha: string;
  /** El literal tal cual está en el Sheet — es lo que se vuelve a escribir. */
  estado: string;
  fase: Fase;
  etiquetaEstado: string;

  nombre: string;
  telefono: string;
  ciudad: string;
  provincia: string;
  direccion: string;
  /** Qué lleva el paquete, en una línea. */
  descripcion: string;

  /** Lo que el repartidor cobra al entregar. */
  aCobrar: number;
  /** Lo que el cliente ya adelantó. En dropshipping siempre 0. */
  anticipo: number;
  /**
   * Contraentrega, mixto o anticipado — se deriva de ANTICIPO/SALDO.
   * `null` en Truquito y Avanora: ahí TODO es contraentrega, así que mostrarlo
   * en cada tarjeta sería ruido y no información.
   */
  metodoPago: MetodoPago | null;
  costo: number;
  flete: number;
  /** Solo dropshipping lo tiene cargado; en ShotyGames no hay columna. */
  cpa: number;
  utilidadSiEntrega: number;
  perdidaSiDevuelve: number;

  ordenDropi: string | null;
  guia: string | null;
  transportadora: string | null;
  /** DOMICILIO y COOPERATIVA no pasan por DROPI: no tener guía es normal. */
  pasaPorDropi: boolean;
  notas: string;
  /**
   * Marcas de qué plantillas de WhatsApp ya se mandaron ("id|fecha ; id|fecha").
   * Solo ShotyGames la tiene: es su columna LOG WA. En dropshipping va vacía
   * porque ese Sheet no tiene esa columna — y agregarla toca su encabezado,
   * que es algo que no se hace sin preguntar.
   */
  logWa: string;
  /**
   * Columna LOG de ShotyGames. Es el candado del agradecimiento automático:
   * si dice "agradecimiento enviado", no se vuelve a mandar. La escriben esta
   * app y `finanzas-app`, para que las dos no le escriban dos veces al cliente.
   */
  log: string;
}

export interface Pedido extends Base {
  /** Días desde que se creó el pedido. */
  dias: number;
  /** Días desde el último movimiento real de la transportadora. */
  diasQuieto: number | null;
  tracking: Tracking | null;
  /**
   * Dónde está el paquete físicamente, según el último movimiento. Es lo que
   * decide qué mensaje le corresponde al cliente — ver `momento.ts`.
   */
  momento: Momento;
  /** Qué suele pasar después, según los historiales analizados. */
  prediccion: { texto: string; probabilidad: number } | null;
  /**
   * El paquete está parado en una agencia esperando que el cliente lo retire.
   * Puede ser intencional o consecuencia de una novedad — no se puede
   * distinguir, por eso es un aviso y no un estado.
   */
  enAgencia: boolean;
  /** Estado que el Sheet debería tener según DROPI, si difiere del actual. */
  estadoSugerido: string | null;
  alertas: Alerta[];
  /** 0 = atender primero. Ordena la cola. */
  prioridad: number;
}

export interface Resumen {
  total: number;
  novedades: number;
  enCamino: number;
  sinDespachar: number;
  porCobrar: number;
  enRiesgo: number;
  sinTracking: number;
}
