// Presentación de la pantalla de recuperación. Corre en el cliente.

import type { Accion, Balde } from './recuperacion-tipos';

export const ETIQUETA_BALDE: Record<Balde, string> = {
  riesgo: 'Riesgo',
  ojo: 'Ojo',
  sano: 'Nunca devolvió',
  nuevo: 'Cliente nuevo',
};

/**
 * Qué hacer con cada balde, en una línea. Va en la tarjeta abierta porque es la
 * razón por la que el mensaje sugerido es el que es.
 */
export const MOTIVO_BALDE: Record<Balde, string> = {
  riesgo:
    'Devuelve más que el promedio de DROPI (32%). Contra entrega completo es arriesgar el flete: pedile el anticipo.',
  ojo: 'Devolvió alguna, pero no más que el promedio de DROPI. Decidí vos: el mensaje sugerido no lo acusa de nada.',
  // No dice "es seguro": 3 de las 7 devoluciones reales de ShotyGames fueron de
  // clientes que nunca habían devuelto nada. Prometer que va a llegar sería
  // pasarle a Fabián una certeza que el dato no da.
  sano: 'Nunca devolvió un pedido, aunque eso no lo garantiza. Solo falta que confirme.',
  nuevo: 'Sin historial en DROPI. No hay motivo para frenarlo.',
};

/**
 * Rojo = mandarlo así es perder plata · ámbar = devolvió alguna pero no pasa la
 * vara · verde = nunca devolvió · azul = no se sabe nada de él.
 */
export const ESTILO_BALDE: Record<Balde, { texto: string; fondo: string; punto: string }> = {
  riesgo: {
    texto: 'text-[var(--color-rojo)]',
    fondo: 'bg-[var(--color-rojo-tenue)]',
    punto: 'bg-[var(--color-rojo)]',
  },
  ojo: {
    texto: 'text-[var(--color-ambar)]',
    fondo: 'bg-[var(--color-ambar-tenue)]',
    punto: 'bg-[var(--color-ambar)]',
  },
  sano: {
    texto: 'text-[var(--color-verde)]',
    fondo: 'bg-[var(--color-verde-tenue)]',
    punto: 'bg-[var(--color-verde)]',
  },
  nuevo: {
    texto: 'text-[var(--color-azul)]',
    fondo: 'bg-[var(--color-azul-tenue)]',
    punto: 'bg-[var(--color-azul)]',
  },
};

/** Cómo eligió pagar en el checkout. Lo que pidió, no lo que pagó. */
export const ESTILO_METODO: Record<string, string> = {
  contraentrega: 'bg-[var(--color-azul-tenue)] text-[var(--color-azul)]',
  transferencia: 'bg-[var(--color-ambar-tenue)] text-[var(--color-ambar)]',
  tarjeta: 'bg-[var(--color-verde-tenue)] text-[var(--color-verde)]',
};

export const estiloMetodo = (m: string) =>
  ESTILO_METODO[m] ?? 'bg-[var(--color-superficie-alta)] text-[var(--color-texto-suave)]';

/**
 * La acción es lo que ordena el trabajo del día, así que es lo que va grande en
 * la tarjeta. El balde queda como el dato que la explica.
 */
export const ETIQUETA_ACCION: Record<Accion, string> = {
  'ofrecer-anticipo': 'Pedirle el abono',
  'pedir-confirmacion': 'Falta que confirme',
  'no-escribir': 'No escribirle',
};

export const MOTIVO_ACCION: Record<Accion, string> = {
  'ofrecer-anticipo':
    'Confirmó el pedido pero devuelve seguido. Contale el motivo y ofrecele el abono de $5 del envío.',
  'pedir-confirmacion':
    'Recibió el resumen y nunca contestó, y su historial no da problema. Pedile la confirmación.',
  'no-escribir':
    'No confirmó y además devuelve seguido. No se le escribe: insistirle para que confirme un contra entrega que no vas a despachar es trabajo para llegar a la misma respuesta. Si confirma por su cuenta, marcalo como FRENADO y ahí le ofrecés el abono.',
};

export const ESTILO_ACCION: Record<Accion, { texto: string; fondo: string; punto: string }> = {
  'ofrecer-anticipo': {
    texto: 'text-[var(--color-ambar)]',
    fondo: 'bg-[var(--color-ambar-tenue)]',
    punto: 'bg-[var(--color-ambar)]',
  },
  'pedir-confirmacion': {
    texto: 'text-[var(--color-verde)]',
    fondo: 'bg-[var(--color-verde-tenue)]',
    punto: 'bg-[var(--color-verde)]',
  },
  // Gris y no rojo: no es una alarma, es trabajo que no hay que hacer.
  'no-escribir': {
    texto: 'text-[var(--color-texto-tenue)]',
    fondo: 'bg-[var(--color-superficie-alta)]',
    punto: 'bg-[var(--color-texto-tenue)]',
  },
};
