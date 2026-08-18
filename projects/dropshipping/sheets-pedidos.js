/**
 * Lectura y escritura del Sheet de pedidos de dropshipping.
 *
 * El Sheet es la fuente de verdad de la operación: n8n escribe el pedido nuevo,
 * el bot actualiza cuando lo manda a DROPI, y el cron completa guía y flete.
 *
 * ── Por qué las columnas se leen del encabezado y no están fijas ──
 * La primera versión tenía los índices escritos a mano (PRODUCTO = 10, etc.).
 * El 2026-08-12 se borró la columna REFERENCIAS del Sheet y TODOS los índices
 * siguientes quedaron corridos: el bot habría leído "1" como ID de producto y
 * pedido a DROPI un producto equivocado, con cobro en $0.
 *
 * Ahora las columnas se resuelven por su TÍTULO. Se pueden mover, renombrar con
 * otro acento o agregar columnas nuevas sin romper nada. Si falta una columna
 * que el código necesita, falla con un mensaje claro en vez de escribir en la
 * celda equivocada.
 */

require('dotenv').config();
const { google } = require('googleapis');

const SHEET_ID = process.env.SHEETS_ID_DROPSHIPPING;
const HOJA = 'PEDIDOS';

/** Nombre lógico → título en el Sheet (sin acentos ni mayúsculas al comparar). */
const TITULOS = {
  ID: 'id pedido',
  FECHA: 'fecha',
  TIENDA: 'tienda',
  ESTADO: 'estado',
  NOMBRE: 'nombre',
  TELEFONO: 'telefono',
  PROVINCIA: 'provincia',
  CIUDAD: 'ciudad',
  DIRECCION: 'direccion',
  REFERENCIAS: 'referencias',      // opcional: Fabián la unió con DIRECCIÓN
  PRODUCTO: 'producto',
  ID_DROPI: 'id dropi',
  CANTIDAD: 'cantidad',
  // Regalo de promoción (ej. la freidora de Truquito con el cuchillo desde 2
  // unidades): un segundo producto opcional que va en la MISMA guía a precio 0.
  // Sin columnas propias el bot no tenía forma de saber que un pedido llevaba
  // regalo — dependía de que la nota de texto de n8n lo mencionara.
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
  NOTAS: 'notas'
};

/** Las que sin ellas el bot no puede operar. El resto son opcionales. */
const OBLIGATORIAS = ['ID', 'ESTADO', 'NOMBRE', 'TELEFONO', 'PROVINCIA', 'CIUDAD',
                      'DIRECCION', 'PRODUCTO', 'ID_DROPI', 'CANTIDAD', 'TOTAL'];

const normalizar = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function letra(i) {
  let s = '';
  i += 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

function getSheets() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth });
}

function checkConfig() {
  if (!SHEET_ID) throw new Error('Falta SHEETS_ID_DROPSHIPPING en .env');
}

let _cache = null;

/** Lee el encabezado y arma el mapa nombre lógico → índice de columna. */
async function getColumnas({ refrescar = false } = {}) {
  if (_cache && !refrescar) return _cache;
  checkConfig();

  const s = getSheets();
  const r = await s.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${HOJA}!A1:AZ1` });
  const encabezados = (r.data.values || [[]])[0].map(normalizar);

  const mapa = {};
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

  _cache = mapa;
  return mapa;
}

/** Todas las filas con su número real de fila en el Sheet. */
async function leerPedidos() {
  const C = await getColumnas();
  const s = getSheets();
  const r = await s.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${HOJA}!A2:AZ2000` });
  const filas = r.data.values || [];

  return filas
    .map((f, i) => ({ fila: i + 2, datos: f, C }))
    .filter((x) => x.datos[C.ID]);
}

async function buscarPedido(idPedido) {
  const todos = await leerPedidos();
  return todos.find((p) => p.datos[p.C.ID] === idPedido) || null;
}

async function pedidosPorEstado(estado) {
  const todos = await leerPedidos();
  return todos.filter((p) => p.datos[p.C.ESTADO] === estado);
}

/**
 * Actualiza celdas de una fila. `campos` = { ESTADO: 'EN_DROPI', GUIA: '123' }
 *
 * Reescribe además la fórmula de UTILIDAD REAL: n8n la borra al insertar la
 * fila (manda vacío en las columnas que no mapea), así que se repone cada vez
 * que el bot toca el pedido.
 */
async function actualizarFila(fila, campos) {
  const C = await getColumnas();
  const s = getSheets();

  const data = Object.entries(campos).map(([clave, valor]) => {
    const col = C[clave];
    if (col === undefined) throw new Error(`El Sheet no tiene la columna "${TITULOS[clave] || clave}"`);
    return { range: `${HOJA}!${letra(col)}${fila}`, values: [[valor]] };
  });

  if (C.UTILIDAD !== undefined) {
    const t = letra(C.TOTAL), co = letra(C.COSTO), fl = letra(C.FLETE);
    const cp = letra(C.CPA), es = letra(C.ESTADO);
    data.push({
      range: `${HOJA}!${letra(C.UTILIDAD)}${fila}`,
      values: [[
        `=IF($${es}${fila}="","",IF(OR($${es}${fila}="ENTREGADO",$${es}${fila}="PAGADO"),` +
        `${t}${fila}-${co}${fila}-${fl}${fila}-${cp}${fila},` +
        `IF($${es}${fila}="CANCELADO",-${cp}${fila},"")))`
      ]]
    });
  }

  await s.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data }
  });

  return { fila, actualizado: Object.keys(campos) };
}

/** Agrega un pedido. Normalmente lo hace n8n; esto es para pruebas. */
async function agregarPedido(p) {
  const C = await getColumnas();
  const s = getSheets();

  const fila = [];
  const set = (clave, valor) => { if (C[clave] !== undefined) fila[C[clave]] = valor; };

  set('ID', p.idPedido);
  set('FECHA', p.fechaHoraPedido || new Date().toISOString());
  set('TIENDA', p.tienda || 'truquito');
  set('ESTADO', p.estado || 'PENDIENTE_CONFIRMACION');
  set('NOMBRE', p.nombre);
  set('TELEFONO', p.telefono);
  set('PROVINCIA', p.provincia);
  set('CIUDAD', p.ciudad);
  set('DIRECCION', p.direccion);
  set('REFERENCIAS', p.referencias || '');
  set('PRODUCTO', p.productoPrincipal);
  set('ID_DROPI', p.dropiProductId);
  set('CANTIDAD', p.cantidad);
  set('TOTAL', p.total);

  const maxCol = Math.max(...Object.values(C).filter((i) => i <= C.TOTAL));
  for (let i = 0; i <= maxCol; i++) if (fila[i] === undefined) fila[i] = '';

  await s.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${HOJA}!A:AZ`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [fila] }
  });

  return { ok: true, idPedido: p.idPedido };
}

const num = (v) => parseFloat(String(v ?? '0').replace(/[$,\s]/g, '')) || 0;

/** Convierte una fila cruda en objeto legible. */
function aObjeto(p) {
  const d = p.datos;
  const C = p.C;
  const val = (k) => (C[k] !== undefined ? d[C[k]] : undefined);

  return {
    fila: p.fila,
    idPedido: val('ID'),
    fecha: val('FECHA'),
    tienda: val('TIENDA'),
    estado: val('ESTADO'),
    nombre: val('NOMBRE'),
    telefono: val('TELEFONO'),
    provincia: val('PROVINCIA'),
    ciudad: val('CIUDAD'),
    direccion: val('DIRECCION'),
    referencias: val('REFERENCIAS') || '',
    producto: val('PRODUCTO'),
    dropiProductId: val('ID_DROPI'),
    cantidad: Number(val('CANTIDAD')) || 1,
    // Regalo: solo existe si la columna ID DROPI2 trae algo. Vacío es el caso
    // normal (la mayoría de pedidos no llevan regalo).
    producto2: val('PRODUCTO2') || null,
    dropiProductId2: val('ID_DROPI2') || null,
    cantidad2: Number(val('CANTIDAD2')) || 1,
    total: num(val('TOTAL')),
    // Números de la unidad económica. Se escriben al confirmar el pedido
    // (COSTO y FLETE salen de la respuesta de DROPI) pero no se estaban
    // mapeando, así que quedaban invisibles para todo el código que lee por
    // acá: el Sheet tenía el flete real y nadie podía usarlo.
    costo: num(val('COSTO')),
    flete: num(val('FLETE')),
    cpa: num(val('CPA')),
    utilidad: num(val('UTILIDAD')),
    ordenDropi: val('ORDEN_DROPI') || null,
    guia: val('GUIA') || null
  };
}

module.exports = {
  leerPedidos, buscarPedido, pedidosPorEstado, actualizarFila,
  agregarPedido, aObjeto, getColumnas, SHEET_ID
};
