// ============================================================
// SHEET DE PEDIDOS DE SHOTYGAMES (solo servidor)
//
// Otro Sheet y otro esquema que el de dropshipping. Tres diferencias que hay
// que tener presentes o los números y las escrituras salen mal:
//
//  1. **Locale es_ES**: los montos llegan como "$29,99" — coma decimal. Se
//     parsean con `aNumero`, nunca borrando comas. Ver `numeros.ts`.
//  2. **La columna ID vale "1" en las 618 filas.** No identifica nada. La clave
//     para confirmar una fila antes de escribirla es NOMBRE + TELÉFONO, que sí
//     es único (27 de 27 en los pedidos en movimiento el 2026-09-03).
//  3. **Fabián es el proveedor**: el producto es suyo, así que una devolución
//     le devuelve la mercadería y solo pierde el flete de ida.
//
// La hoja llega hasta AP. Las columnas se resuelven por título igual que en el
// otro Sheet — acá además hay dos encabezados vacíos (M, N, O) que romperían
// cualquier índice escrito a mano.
// ============================================================

import { google, type sheets_v4 } from 'googleapis';
import { aNumero } from './numeros';
import { aFechaLocal } from './fechas';
import { norm } from './negocios';
import { etiquetaDeLiteral, faseDeLiteral } from './estados';
import { metodoPagoDe } from './pago';
import type { Base } from './tipos';

const HOJA = 'PEDIDOS';

const TITULOS: Record<string, string> = {
  NOMBRE: 'nombre',
  FECHA: 'fecha',
  TELEFONO: 'telefono',
  CIUDAD: 'ciudad',
  ANTICIPO: 'anticipo',
  SALDO: 'saldo',
  ESTADO: 'estado',
  TRANSPORTADORA: 'transportadora',
  ENVIO: 'envio',
  GUIA: 'guia',
  NOTAS: 'notas',
  COSTOS: 'costos',
  DIRECCION: 'direccion',
  PRODUCTOS: 'productos',
  ORDEN_DROPI: 'orden dropi',
  IDPEDIDO: 'idpedido',
  NOTA_LOGISTICA: 'nota logistica',
  LOG: 'log',
  LOG_WA: 'log wa',
};

const OBLIGATORIAS = ['NOMBRE', 'TELEFONO', 'ESTADO'];

export type Columnas = Record<string, number>;

const normalizarTitulo = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export function letra(i: number): string {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function getSheets(): sheets_v4.Sheets {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN');
  }
  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth });
}

function sheetId(): string {
  const id = process.env.SHEETS_ID_SHOTYGAMES;
  if (!id) throw new Error('Falta SHEETS_ID_SHOTYGAMES');
  return id;
}

let _columnas: Columnas | null = null;

export async function getColumnas(): Promise<Columnas> {
  if (_columnas) return _columnas;

  const s = getSheets();
  const r = await s.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A1:AZ1`,
  });
  const encabezados = (r.data.values?.[0] ?? []).map(normalizarTitulo);

  const mapa: Columnas = {};
  for (const [clave, titulo] of Object.entries(TITULOS)) {
    const i = encabezados.indexOf(normalizarTitulo(titulo));
    if (i >= 0) mapa[clave] = i;
  }

  const faltan = OBLIGATORIAS.filter((k) => mapa[k] === undefined);
  if (faltan.length) {
    throw new Error(
      `Al Sheet de ShotyGames le faltan columnas: ${faltan.map((k) => TITULOS[k]).join(', ')}`
    );
  }

  _columnas = mapa;
  return mapa;
}

/** La clave con la que se confirma una fila antes de escribirla. */
export function claveDe(nombre: unknown, telefono: unknown): string {
  const tel = String(telefono ?? '').replace(/\D/g, '').slice(-9);
  return `${norm(nombre)}|${tel}`;
}

/** Cuando el envío no pasa por DROPI, no tener guía ni orden es lo normal. */
function pasaPorDropi(transportadora: string): boolean {
  const t = norm(transportadora);
  return !!t && !/DOMICILIO|COOPERATIVA|RETIRO|LOCAL/.test(t);
}

export interface FilaShoty {
  fila: number;
  datos: string[];
}

export async function leerFilas(): Promise<{ filas: FilaShoty[]; C: Columnas }> {
  const C = await getColumnas();
  const s = getSheets();
  const r = await s.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A2:AZ3000`,
  });

  // La columna ID no sirve para saber si una fila tiene datos (vale "1"
  // siempre). Se usa el nombre.
  const filas = (r.data.values ?? [])
    .map((datos, i) => ({ fila: i + 2, datos: datos as string[] }))
    .filter((x) => String(x.datos[C.NOMBRE] ?? '').trim());

  return { filas, C };
}

/** Una fila cruda → la forma común que entiende el resto de la app. */
export function aBase(f: FilaShoty, C: Columnas): Base {
  const v = (k: string) => (C[k] !== undefined ? f.datos[C[k]] : undefined);
  const txt = (k: string) => String(v(k) ?? '').trim();

  const estado = txt('ESTADO').toUpperCase();

  const anticipo = aNumero(v('ANTICIPO'));
  const saldo = aNumero(v('SALDO'));
  const costo = aNumero(v('COSTOS'));
  const flete = aNumero(v('ENVIO'));
  const transportadora = txt('TRANSPORTADORA');

  // El id que se muestra: el de la web si existe, si no el nombre. La columna
  // ID del Sheet no se usa nunca — vale "1" en todas las filas.
  const idWeb = txt('IDPEDIDO');

  return {
    negocio: 'shotygames',
    tienda: 'shotygames',
    fila: f.fila,
    id: idWeb || `fila ${f.fila}`,
    clave: claveDe(v('NOMBRE'), v('TELEFONO')),
    fecha: aFechaLocal(v('FECHA')) ?? '',
    estado,
    fase: faseDeLiteral(estado),
    etiquetaEstado: etiquetaDeLiteral(estado),

    nombre: txt('NOMBRE'),
    telefono: txt('TELEFONO'),
    ciudad: txt('CIUDAD'),
    provincia: '',
    direccion: txt('DIRECCION'),
    descripcion: txt('PRODUCTOS'),

    // El repartidor cobra el SALDO; el ANTICIPO ya está cobrado.
    aCobrar: saldo,
    anticipo,
    metodoPago: metodoPagoDe(anticipo, saldo),
    costo,
    flete,
    cpa: 0, // este Sheet no tiene columna de CPA
    utilidadSiEntrega: redondear(anticipo + saldo - costo - flete),
    // Acá el producto es de Fabián: en una devolución vuelve la mercadería y lo
    // que se pierde es el flete de ida. (En dropshipping se pierde también el
    // costo, porque el producto nunca fue suyo.)
    perdidaSiDevuelve: redondear(flete),

    ordenDropi: txt('ORDEN_DROPI').replace(/\D/g, '') || null,
    guia: txt('GUIA') || null,
    transportadora: transportadora || null,
    pasaPorDropi: pasaPorDropi(transportadora),
    // NOTAS (columna AA) tiene info del pedido que no hay que pisar. El
    // seguimiento va en NOTA LOGISTICA, igual que en finanzas-app.
    notas: txt('NOTA_LOGISTICA'),
    logWa: txt('LOG_WA'),
    log: txt('LOG'),
  };
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Escribe en una fila, después de confirmar que sigue siendo el mismo pedido.
 * Devuelve un mensaje de error si la fila se movió; null si escribió bien.
 */
export interface ResultadoEscritura {
  /** Mensaje de error si no se pudo escribir; null si salió bien. */
  error: string | null;
  /** El pedido tal como estaba ANTES, para los disparadores. */
  antes?: { nombre: string; telefono: string; log: string; colLog: number };
}

export async function actualizarFila(
  fila: number,
  clave: string,
  campos: { estado?: string; notas?: string }
): Promise<ResultadoEscritura> {
  const C = await getColumnas();
  const s = getSheets();

  const actual = await s.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A${fila}:AZ${fila}`,
  });
  const datos = (actual.data.values?.[0] ?? []) as string[];
  const claveReal = claveDe(datos[C.NOMBRE], datos[C.TELEFONO]);

  if (claveReal !== clave) {
    return {
      error:
        `La fila ${fila} ya no es el mismo pedido (ahora tiene "${datos[C.NOMBRE] ?? 'vacío'}"). ` +
        'Recargá la cola antes de volver a intentar.',
    };
  }

  const data: { range: string; values: string[][] }[] = [];
  if (campos.estado !== undefined && C.ESTADO !== undefined) {
    data.push({ range: `${HOJA}!${letra(C.ESTADO)}${fila}`, values: [[campos.estado]] });
  }
  if (campos.notas !== undefined && C.NOTA_LOGISTICA !== undefined) {
    data.push({ range: `${HOJA}!${letra(C.NOTA_LOGISTICA)}${fila}`, values: [[campos.notas]] });
  }
  if (!data.length) return { error: 'No hay nada que escribir en este Sheet' };

  await s.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  });

  return {
    error: null,
    // El LOG se lee ANTES de escribir: es el candado del agradecimiento y hay
    // que mirarlo tal como estaba, no después de tocarlo.
    antes: {
      nombre: String(datos[C.NOMBRE] ?? ''),
      telefono: String(datos[C.TELEFONO] ?? ''),
      log: C.LOG !== undefined ? String(datos[C.LOG] ?? '') : '',
      colLog: C.LOG ?? -1,
    },
  };
}

/** Lee una sola fila, para confirmar contra qué se está escribiendo. */
export async function leerFila(fila: number): Promise<{ datos: string[]; C: Columnas }> {
  const C = await getColumnas();
  const r = await getSheets().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A${fila}:AZ${fila}`,
  });
  return { datos: (r.data.values?.[0] ?? []) as string[], C };
}

/** Escribe una celda suelta. `col` es el índice 0-based de la columna. */
export async function escribirCelda(fila: number, col: number, valor: string): Promise<void> {
  await getSheets().spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `${HOJA}!${letra(col)}${fila}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[valor]] },
  });
}
