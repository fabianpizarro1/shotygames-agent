// ============================================================
// SHEET "PEDIDOS LOVABLE" — los pedidos que entraron por la WEB (solo servidor)
//
// Es OTRA hoja que la oficial de ShotyGames y guarda algo distinto: **todo el
// que pasó por el checkout**, haya pagado o no. Por eso sirve para recuperar
// plata y la oficial no — ahí solo están las ventas que ya se concretaron.
//
// Tres cosas que hay que tener presentes:
//
//  1. **La columna `ID` sí es única** (317 de 317 el 2026-09-14, formato
//     `PED-XXXXX`). Al contrario de la hoja oficial, donde el ID vale "1" en
//     todas las filas, acá la clave de fila es el ID y no hace falta inventar
//     un nombre+teléfono.
//  2. **`ESTADO` se mantiene solo.** Cuando un pedido web se registra como
//     venta real en la hoja oficial, `buscarAtribucionWeb()` (en el repo de
//     KEPLER, `sheets.js`) le escribe `COMPRADO` acá. Así que `SIN COMPRAR` es
//     un dato confiable y no hace falta cruzar las dos hojas para saber quién
//     compró — ver `recuperacion.ts` para el único cruce que sí se hace.
//  3. **Locale es_ES** igual que la oficial: `INGRESO` llega como "$28,00" en
//     las filas viejas y "29.99" en las nuevas. Se parsea con `aNumero`.
//
// Las columnas se resuelven por TÍTULO, nunca por letra fija: la hoja ya creció
// dos veces (FBC/FBP/FBCLID en agosto, las 3 de reputación DROPI el 26/08) y
// cualquier índice escrito a mano se rompe en la próxima.
// ============================================================

import { google, type sheets_v4 } from 'googleapis';
import { aNumero } from './numeros';
import { aFechaLocal } from './fechas';
import type { PedidoWeb } from './recuperacion-tipos';


const HOJA = 'PEDIDOS';

/** Rango que cubre la hoja con aire de sobra para las columnas que vengan. */
const RANGO_COLS = 'AZ';

const TITULOS: Record<string, string> = {
  ID: 'id',
  NOMBRE: 'nombre',
  FECHA: 'fecha',
  TELEFONO: 'telefono',
  CIUDAD: 'ciudad',
  INGRESO: 'ingreso',
  METODO_PAGO: 'metodo pago',
  ESTADO: 'estado',
  DIRECCION: 'direccion',
  DROPI_PEDIDOS: 'dropi pedidos',
  DROPI_ENTREGADOS: 'dropi entregados',
  DROPI_DEVUELTOS: 'dropi devueltos',
  LOG_WA: 'log wa',
  NOTA_RECUP: 'nota recup',
};

/** Banderas 0/1 de qué llevaba el pedido → nombre que se le muestra. */
const PRODUCTOS: { titulo: string; nombre: string }[] = [
  { titulo: 'n', nombre: 'Torre Normal' },
  { titulo: 'p', nombre: 'Torre Picante' },
  { titulo: 'par', nombre: 'Torre Parejas' },
  { titulo: 'eng', nombre: 'Enganchados' },
  { titulo: 'dados', nombre: 'Dados' },
  { titulo: 'empa', nombre: 'Emparejados' },
];

const OBLIGATORIAS = ['ID', 'NOMBRE', 'TELEFONO', 'ESTADO'];

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
  const id = process.env.SHEETS_ID_PEDIDOS_WEB;
  if (!id) throw new Error('Falta SHEETS_ID_PEDIDOS_WEB');
  return id;
}

let _columnas: Columnas | null = null;
let _productos: { indice: number; nombre: string }[] | null = null;

export async function getColumnas(): Promise<Columnas> {
  if (_columnas) return _columnas;

  const r = await getSheets().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A1:${RANGO_COLS}1`,
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
      `A "PEDIDOS LOVABLE" le faltan columnas: ${faltan.map((k) => TITULOS[k]).join(', ')}`
    );
  }

  _productos = PRODUCTOS.map((p) => ({
    indice: encabezados.indexOf(p.titulo),
    nombre: p.nombre,
  })).filter((p) => p.indice >= 0);

  _columnas = mapa;
  return mapa;
}

export interface FilaWeb {
  fila: number;
  datos: string[];
}

export async function leerFilas(): Promise<{ filas: FilaWeb[]; C: Columnas }> {
  const C = await getColumnas();
  const r = await getSheets().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A2:${RANGO_COLS}3000`,
  });

  // La hoja tiene más abajo un bloque de INVENTARIO en otra pestaña, pero en
  // esta pestaña una fila sin ID es una fila vacía.
  const filas = (r.data.values ?? [])
    .map((datos, i) => ({ fila: i + 2, datos: datos as string[] }))
    .filter((x) => String(x.datos[C.ID] ?? '').trim());

  return { filas, C };
}

/** "Torre Parejas + Dados", a partir de las banderas 0/1. */
function descripcionDe(datos: string[]): string {
  const lleva = (_productos ?? [])
    .filter((p) => aNumero(datos[p.indice]) > 0)
    .map((p) => p.nombre);
  return lleva.join(' + ');
}

export function aPedidoWeb(f: FilaWeb, C: Columnas): PedidoWeb {
  const v = (k: string) => (C[k] !== undefined ? f.datos[C[k]] : undefined);
  const txt = (k: string) => String(v(k) ?? '').trim();

  // Si las 3 columnas de reputación están vacías, es que el cron todavía no
  // pasó por esta fila. `null` y no ceros: "no lo sé" no es "no tiene ninguno".
  const crudas = ['DROPI_PEDIDOS', 'DROPI_ENTREGADOS', 'DROPI_DEVUELTOS'].map((k) => txt(k));
  const dropi = crudas.some((x) => x !== '')
    ? {
        pedidos: aNumero(crudas[0]),
        entregados: aNumero(crudas[1]),
        devueltos: aNumero(crudas[2]),
      }
    : null;

  return {
    fila: f.fila,
    id: txt('ID'),
    fecha: aFechaLocal(v('FECHA')) ?? '',
    nombre: txt('NOMBRE'),
    telefono: txt('TELEFONO'),
    ciudad: txt('CIUDAD'),
    direccion: txt('DIRECCION'),
    descripcion: descripcionDe(f.datos),
    monto: aNumero(v('INGRESO')),
    metodoPago: txt('METODO_PAGO').toLowerCase(),
    estado: txt('ESTADO').toUpperCase(),
    dropi,
    logWa: txt('LOG_WA'),
    nota: txt('NOTA_RECUP'),
  };
}

export interface ResultadoEscritura {
  error: string | null;
}

/**
 * Escribe en una fila después de confirmar que sigue siendo el mismo pedido.
 *
 * El candado es el `ID` (`PED-XXXXX`): si alguien ordenó la hoja o insertó una
 * fila entre que se cargó la pantalla y se apretó el botón, el ID de esa fila
 * ya no coincide y no se escribe nada.
 */
export async function actualizarFila(
  fila: number,
  id: string,
  campos: { estado?: string; nota?: string; logWa?: string }
): Promise<ResultadoEscritura> {
  const C = await getColumnas();
  const s = getSheets();

  const actual = await s.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A${fila}:${RANGO_COLS}${fila}`,
  });
  const datos = (actual.data.values?.[0] ?? []) as string[];
  const idReal = String(datos[C.ID] ?? '').trim();

  if (idReal !== id) {
    return {
      error:
        `La fila ${fila} ya no es el pedido ${id} (ahora dice "${idReal || 'vacío'}"). ` +
        'Recargá la lista antes de volver a intentar.',
    };
  }

  const data: { range: string; values: string[][] }[] = [];
  const poner = (clave: string, valor: string | undefined) => {
    if (valor === undefined) return;
    if (C[clave] === undefined) {
      throw new Error(
        `La hoja no tiene la columna "${TITULOS[clave]}". Hay que agregarla al final ` +
          'antes de usar esta pantalla (ver scripts/preparar-recuperacion.js).'
      );
    }
    data.push({ range: `${HOJA}!${letra(C[clave])}${fila}`, values: [[valor]] });
  };

  poner('ESTADO', campos.estado);
  poner('NOTA_RECUP', campos.nota);
  poner('LOG_WA', campos.logWa);

  if (!data.length) return { error: 'No hay nada que escribir' };

  await s.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: { valueInputOption: 'USER_ENTERED', data },
  });

  return { error: null };
}

/** Lee una sola fila cruda, para leer el LOG WA tal como está antes de tocarlo. */
export async function leerFila(fila: number): Promise<{ datos: string[]; C: Columnas }> {
  const C = await getColumnas();
  const r = await getSheets().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${HOJA}!A${fila}:${RANGO_COLS}${fila}`,
  });
  return { datos: (r.data.values?.[0] ?? []) as string[], C };
}

/**
 * Los `PED-XXXXX` que YA están en la hoja oficial de ShotyGames (columna
 * IDPEDIDO), o sea los que se convirtieron en venta real.
 *
 * Es el único cruce entre las dos hojas y se hace por ID EXACTO, nunca por
 * teléfono: un cliente que ya compró en agosto y abandonó un carrito ayer
 * tiene el mismo teléfono en las dos hojas y desaparecería de la lista sin
 * motivo. Con el ID no hay ambigüedad.
 */
export async function idsYaVendidos(): Promise<Set<string>> {
  const id = process.env.SHEETS_ID_SHOTYGAMES;
  if (!id) return new Set();

  const s = getSheets();
  const enc = await s.spreadsheets.values.get({
    spreadsheetId: id,
    range: 'PEDIDOS!A1:AZ1',
  });
  const i = (enc.data.values?.[0] ?? []).map(normalizarTitulo).indexOf('idpedido');
  if (i < 0) return new Set();

  const col = letra(i);
  const r = await s.spreadsheets.values.get({
    spreadsheetId: id,
    range: `PEDIDOS!${col}2:${col}3000`,
  });
  return new Set(
    (r.data.values ?? [])
      .map((f) => String(f?.[0] ?? '').trim().toUpperCase())
      .filter((x) => x.startsWith('PED-'))
  );
}

/**
 * Los teléfonos que tienen un pedido VIVO en la hoja oficial, con su estado.
 *
 * No se usa para excluir nada — se usa para AVISAR. Si un teléfono de la lista
 * de recuperación ya tiene un pedido en la calle, escribirle "tu pedido no se
 * despachó" sería mentirle. Que el ID no haya matcheado no prueba que no sea
 * el mismo pedido: el `IDPEDIDO` de la hoja oficial se llena solo cuando la
 * venta se registró con el código de la web a mano.
 */
export async function telefonosConPedidoVivo(): Promise<Map<string, string>> {
  const id = process.env.SHEETS_ID_SHOTYGAMES;
  const mapa = new Map<string, string>();
  if (!id) return mapa;

  const s = getSheets();
  const r = await s.spreadsheets.values.get({
    spreadsheetId: id,
    range: 'PEDIDOS!A1:AZ3000',
  });
  const filas = r.data.values ?? [];
  const enc = (filas[0] ?? []).map(normalizarTitulo);
  const iTel = enc.indexOf('telefono');
  const iEst = enc.indexOf('estado');
  if (iTel < 0 || iEst < 0) return mapa;

  // CANCELADO y las que ya se cerraron no son "vivas": ahí sí hay que insistir.
  const VIVOS = /^(PENDIENTE|ENVIADO|NOVEDAD|ENTREGADO)$/;

  for (const f of filas.slice(1)) {
    const estado = String(f?.[iEst] ?? '').trim().toUpperCase();
    if (!VIVOS.test(estado)) continue;
    const tel = telefonoClave(f?.[iTel]);
    if (tel) mapa.set(tel, estado);
  }
  return mapa;
}

/** Los últimos 9 dígitos: el mismo número escrito de 4 formas distintas matchea. */
export const telefonoClave = (t: unknown) =>
  String(t ?? '').replace(/\D/g, '').slice(-9);
