// ============================================================
// SHEET DE PEDIDOS DE DROPSHIPPING — Truquito + Avanora (solo servidor)
//
// Puerto de `KEPLER/projects/dropshipping/sheets-pedidos.js`. Las dos tiendas
// (Truquito y Avanora) viven en el MISMO Sheet, distinguidas por la columna
// TIENDA — comparar los dos negocios es un filtro, no un reporte aparte.
//
// ⚠️ Las columnas se resuelven por TÍTULO, nunca por letra fija. El 2026-08-12
// se borró una columna del Sheet y todos los índices escritos a mano quedaron
// corridos: el bot leyó "1" como id de producto. El 2026-08-31 volvió a pasar
// al agregar PRODUCTO2/IDDROPI2/CANTIDAD2. Si acá se hardcodea una letra, es
// cuestión de tiempo que escriba en la celda equivocada.
// ============================================================

import { google, type sheets_v4 } from 'googleapis';
import { aNumero } from './numeros';
import { aFechaLocal } from './fechas';
import { norm, type Tienda } from './negocios';
import { etiquetaDeLiteral, faseDeLiteral } from './estados';
import type { Base } from './tipos';

const HOJA = 'PEDIDOS';

/** Nombre lógico → título en el Sheet (se compara sin acentos ni mayúsculas). */
const TITULOS: Record<string, string> = {
  ID: 'id pedido',
  FECHA: 'fecha',
  TIENDA: 'tienda',
  ESTADO: 'estado',
  NOMBRE: 'nombre',
  TELEFONO: 'telefono',
  PROVINCIA: 'provincia',
  CIUDAD: 'ciudad',
  DIRECCION: 'direccion',
  REFERENCIAS: 'referencias',
  PRODUCTO: 'producto',
  ID_DROPI: 'id dropi',
  CANTIDAD: 'cantidad',
  PRODUCTO2: 'producto2',
  ID_DROPI2: 'iddropi2',
  CANTIDAD2: 'cantidad2',
  TOTAL: 'total cobrar',
  COSTO: 'costo proveedor',
  FLETE: 'flete',
  CPA: 'cpa',
  UTILIDAD: 'utilidad real',
  ORDEN_DROPI: 'orden dropi',
  GUIA: 'guia',
  F_CONFIRM: 'fecha confirmacion',
  F_GUIA: 'fecha guia',
  F_ENTREGA: 'fecha entrega',
  F_PAGO: 'fecha pago',
  NOTAS: 'notas',
};

/** Sin estas el sistema no puede operar; el resto son opcionales. */
const OBLIGATORIAS = ['ID', 'ESTADO', 'NOMBRE', 'TELEFONO', 'CIUDAD', 'PRODUCTO', 'TOTAL'];

export type Columnas = Record<string, number>;

const normalizar = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** 0 → "A", 26 → "AA". */
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
  const id = process.env.SHEETS_ID_DROPSHIPPING;
  if (!id) throw new Error('Falta SHEETS_ID_DROPSHIPPING');
  return id;
}

// El encabezado cambia poco; se cachea por instancia del lambda para no gastar
// una llamada extra a la API en cada request. `refrescar` lo fuerza si hiciera falta.
let _columnas: Columnas | null = null;

export async function getColumnas({ refrescar = false } = {}): Promise<Columnas> {
  if (_columnas && !refrescar) return _columnas;

  const s = getSheets();
  const r = await s.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A1:AZ1`,
  });
  const encabezados = (r.data.values?.[0] ?? []).map(normalizar);

  const mapa: Columnas = {};
  for (const [clave, titulo] of Object.entries(TITULOS)) {
    const i = encabezados.indexOf(normalizar(titulo));
    if (i >= 0) mapa[clave] = i;
  }

  const faltan = OBLIGATORIAS.filter((k) => mapa[k] === undefined);
  if (faltan.length) {
    throw new Error(
      `Al Sheet le faltan columnas obligatorias: ${faltan.map((k) => TITULOS[k]).join(', ')}. ` +
        `Encabezados encontrados: ${encabezados.filter(Boolean).join(' | ')}`
    );
  }

  _columnas = mapa;
  return mapa;
}

export interface FilaCruda {
  fila: number;
  datos: string[];
}

/** Todas las filas con datos, con su número REAL de fila en el Sheet. */
export async function leerFilas(): Promise<{ filas: FilaCruda[]; C: Columnas }> {
  const C = await getColumnas();
  const s = getSheets();
  const r = await s.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A2:AZ2000`,
  });

  const filas = (r.data.values ?? [])
    .map((datos, i) => ({ fila: i + 2, datos: datos as string[] }))
    .filter((x) => x.datos[C.ID]);

  return { filas, C };
}

/**
 * Actualiza celdas de una fila y repone la fórmula de UTILIDAD REAL.
 *
 * La fórmula se reescribe a propósito en cada toque: n8n la borra cuando
 * inserta la fila (manda vacío en las columnas que no mapea). Es la misma que
 * usa `sheets-pedidos.js` en KEPLER — si se cambia una, cambiar la otra.
 */
export async function actualizarFila(
  fila: number,
  campos: Record<string, string | number>
): Promise<void> {
  const C = await getColumnas();
  const s = getSheets();

  const data = Object.entries(campos).map(([clave, valor]) => {
    const col = C[clave];
    if (col === undefined) {
      throw new Error(`El Sheet no tiene la columna "${TITULOS[clave] ?? clave}"`);
    }
    return { range: `${HOJA}!${letra(col)}${fila}`, values: [[valor]] };
  });

  if (
    C.UTILIDAD !== undefined &&
    C.TOTAL !== undefined &&
    C.COSTO !== undefined &&
    C.FLETE !== undefined &&
    C.CPA !== undefined
  ) {
    const t = letra(C.TOTAL);
    const co = letra(C.COSTO);
    const fl = letra(C.FLETE);
    const cp = letra(C.CPA);
    const es = letra(C.ESTADO);
    data.push({
      range: `${HOJA}!${letra(C.UTILIDAD)}${fila}`,
      values: [
        [
          // CANCELADO = nunca salió: se pierde solo el CPA.
          // DEVUELTO  = salió y volvió: se pierde el CPA **y el flete de ida**.
          `=IF($${es}${fila}="","",IF(OR($${es}${fila}="ENTREGADO",$${es}${fila}="PAGADO"),` +
            `${t}${fila}-${co}${fila}-${fl}${fila}-${cp}${fila},` +
            `IF($${es}${fila}="DEVUELTO",-${fl}${fila}-${cp}${fila},` +
            `IF($${es}${fila}="CANCELADO",-${cp}${fila},""))))`,
        ],
      ],
    });
  }

  await s.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  });
}

/** Lee una sola fila, para confirmar contra qué se está escribiendo. */
export async function leerFila(fila: number): Promise<{ datos: string[]; C: Columnas }> {
  const C = await getColumnas();
  const s = getSheets();
  const r = await s.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A${fila}:AZ${fila}`,
  });
  return { datos: (r.data.values?.[0] ?? []) as string[], C };
}

// ─── Traducción a la forma común ─────────────────────────────────────────────

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Una fila cruda → la forma que entiende el resto de la app. */
export function aBase(f: FilaCruda, C: Columnas, fleteDropi = 0): Base {
  const v = (k: string) => (C[k] !== undefined ? f.datos[C[k]] : undefined);
  const txt = (k: string) => String(v(k) ?? '').trim();

  const estado = norm(v('ESTADO'));
  const tienda = norm(v('TIENDA')).toLowerCase();

  const total = aNumero(v('TOTAL'));
  const costo = aNumero(v('COSTO'));
  // El flete real solo se sabe cuando DROPI genera la guía. Si el Sheet todavía
  // no lo tiene, se usa el que reporta DROPI en vez de asumir un promedio.
  const flete = aNumero(v('FLETE')) || fleteDropi;
  const cpa = aNumero(v('CPA'));

  const cantidad = aNumero(v('CANTIDAD')) || 1;
  const cantidad2 = aNumero(v('CANTIDAD2'));
  const producto2 = txt('PRODUCTO2');

  return {
    negocio: 'dropshipping',
    tienda: (tienda === 'avanora' ? 'avanora' : 'truquito') as Tienda,
    fila: f.fila,
    id: txt('ID'),
    // Acá el ID PEDIDO sí es único, así que alcanza como clave de fila.
    clave: txt('ID'),
    fecha: aFechaLocal(v('FECHA')) ?? '',
    estado,
    fase: faseDeLiteral(estado),
    etiquetaEstado: etiquetaDeLiteral(estado),

    nombre: txt('NOMBRE'),
    telefono: txt('TELEFONO'),
    ciudad: txt('CIUDAD'),
    provincia: txt('PROVINCIA'),
    direccion: txt('DIRECCION'),
    descripcion:
      `${txt('PRODUCTO')}${cantidad > 1 ? ` ×${cantidad}` : ''}` +
      (producto2 ? ` + ${producto2}${cantidad2 > 1 ? ` ×${cantidad2}` : ''}` : ''),

    aCobrar: total,
    // Dropshipping es 100% contraentrega: no hay anticipos y marcar el método
    // en cada tarjeta sería repetir lo mismo 47 veces.
    anticipo: 0,
    metodoPago: null,
    costo,
    flete,
    cpa,
    // Misma fórmula que la columna UTILIDAD REAL del Sheet. Si se toca una,
    // tocar la otra (`actualizarFila` acá arriba).
    utilidadSiEntrega: redondear(total - costo - flete - cpa),
    // Una devolución no recupera el flete de ida ni lo gastado en publicidad.
    perdidaSiDevuelve: redondear(flete + cpa),

    ordenDropi: txt('ORDEN_DROPI').replace(/\D/g, '') || null,
    guia: txt('GUIA') || null,
    transportadora: null, // la reporta DROPI; el Sheet no la guarda
    pasaPorDropi: true, // en dropshipping TODO se despacha por DROPI
    notas: txt('NOTAS'),
    // Este Sheet no tiene columnas LOG ni LOG WA, y agregarlas toca su
    // encabezado — no se hace sin preguntarle a Fabián.
    logWa: '',
    log: '',
  };
}
