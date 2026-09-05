// ============================================================
// CÓMO PAGÓ EL CLIENTE
//
// No hay columna en el Sheet: se deriva del par ANTICIPO / SALDO. La regla es
// la misma que usa `src/lib/cod.ts` de finanzas-app — si se cambia una, cambiar
// la otra, o las dos apps van a clasificar distinto el mismo pedido.
// ============================================================

export type MetodoPago = 'contraentrega' | 'mixto' | 'anticipado';

/**
 * ANTICIPO = 0 y SALDO > 0  → contraentrega (el cliente no adelantó nada)
 * ANTICIPO > 0 y SALDO > 0  → mixto (adelantó una parte, el resto al recibir)
 * ANTICIPO > 0 y SALDO = 0  → anticipado (pagado completo antes de despachar)
 */
export function metodoPagoDe(anticipo: number, saldo: number): MetodoPago {
  if (anticipo <= 0 && saldo > 0) return 'contraentrega';
  if (anticipo > 0 && saldo > 0) return 'mixto';
  return 'anticipado';
}

export const ETIQUETA_PAGO: Record<MetodoPago, string> = {
  contraentrega: 'Contraentrega',
  mixto: 'Mixto',
  anticipado: 'Pagado',
};

/**
 * Cuánta plata hay en riesgo de que el cliente no reciba.
 *
 * Es lo que hace importante ver el método: un pedido **anticipado** ya está
 * cobrado, así que si el cliente no lo recibe no se pierde la venta — solo el
 * flete. Uno **contraentrega** se pierde entero.
 */
export const ETIQUETA_PAGO_LARGA: Record<MetodoPago, string> = {
  contraentrega: 'Contraentrega — cobra todo al entregar',
  mixto: 'Mixto — adelantó una parte, el resto al recibir',
  anticipado: 'Anticipado — ya está pagado, no hay que cobrar nada',
};
