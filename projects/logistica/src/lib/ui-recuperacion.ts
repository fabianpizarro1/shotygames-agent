// Presentación de la pantalla de recuperación. Corre en el cliente.

import type { Balde } from './recuperacion-tipos';

export const ETIQUETA_BALDE: Record<Balde, string> = {
  riesgo: 'Riesgo',
  limpio: 'Historial sano',
  nuevo: 'Cliente nuevo',
};

/**
 * Qué hacer con cada balde, en una línea. Va en la tarjeta abierta porque es la
 * razón por la que el mensaje sugerido es el que es.
 */
export const MOTIVO_BALDE: Record<Balde, string> = {
  riesgo: 'Devuelve seguido: contra entrega completo es perder el flete. Pedile el anticipo.',
  limpio: 'Su historial está bien. Solo falta que confirme.',
  nuevo: 'Sin historial en DROPI. No hay motivo para frenarlo.',
};

/**
 * Rojo = mandarlo así es perder plata · verde = no hay problema · azul = no se
 * sabe nada de él. El gris no se usa: acá los tres baldes piden una acción.
 */
export const ESTILO_BALDE: Record<Balde, { texto: string; fondo: string; punto: string }> = {
  riesgo: {
    texto: 'text-[var(--color-rojo)]',
    fondo: 'bg-[var(--color-rojo-tenue)]',
    punto: 'bg-[var(--color-rojo)]',
  },
  limpio: {
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
