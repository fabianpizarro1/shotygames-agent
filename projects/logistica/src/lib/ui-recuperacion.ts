// Presentación de la pantalla de recuperación. Corre en el cliente.

import type { Balde } from './recuperacion-tipos';

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
    'Devuelve más que el promedio del mercado (32%). Contra entrega completo es perder el flete: pedile el anticipo.',
  ojo: 'Devolvió alguna, pero no más que el promedio del mercado. Decidí vos: el mensaje sugerido no lo acusa de nada.',
  sano: 'Nunca devolvió un pedido. Solo falta que confirme.',
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
