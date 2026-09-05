// ============================================================
// LOS TRES NEGOCIOS, CADA UNO CON SU SHEET Y SU CUENTA DE DROPI
//
// Truquito y Avanora comparten Sheet (se separan por la columna TIENDA) y usan
// la cuenta dropshipper. ShotyGames es otro Sheet, con otro esquema, otro
// locale y la cuenta donde Fabián es el PROVEEDOR.
//
// Lo único que la interfaz sabe es que hay pedidos con una `tienda`. Todo lo
// que difiere entre negocios se resuelve acá.
// ============================================================

import { dropiDropshipper, dropiShotygames, type ClienteDropi } from './dropi';

export type Tienda = 'truquito' | 'avanora' | 'shotygames';

export const TIENDAS: Tienda[] = ['truquito', 'avanora', 'shotygames'];

/** A qué fuente de datos pertenece cada tienda. */
export type Negocio = 'dropshipping' | 'shotygames';

export const NEGOCIO_DE: Record<Tienda, Negocio> = {
  truquito: 'dropshipping',
  avanora: 'dropshipping',
  shotygames: 'shotygames',
};

export const DROPI_DE: Record<Negocio, ClienteDropi> = {
  dropshipping: dropiDropshipper,
  shotygames: dropiShotygames,
};

/**
 * Las FASES son lo único que la app entiende. Los literales de cada estado los
 * define el Sheet y se leen en vivo — ver `estados.ts`.
 */
export type Fase =
  | 'preparando'      // Fabián lo está armando; todavía no salió a la transportadora
  | 'por-despachar'   // creado en DROPI, el proveedor todavía no generó la guía
  | 'en-camino'       // ya viaja
  | 'novedad'         // problema de entrega, el paquete sigue vivo
  | 'devuelto'        // vuelve a bodega
  | 'cerrado';        // entregado, pagado o cancelado: no es trabajo

export const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '_');
