/**
 * Lectura y escritura del Sheet de pedidos de dropshipping.
 *
 * El Sheet es la fuente de verdad de la operación: n8n escribe el pedido nuevo,
 * el bot actualiza cuando lo manda a DROPI, y el cron completa guía y flete.
 *
 * Columnas (ver crear-sheet-pedidos.js):
 *   A ID PEDIDO   B FECHA        C TIENDA     D ESTADO       E NOMBRE
 *   F TELEFONO    G PROVINCIA    H CIUDAD     I DIRECCION    J REFERENCIAS
 *   K PRODUCTO    L ID DROPI     M CANTIDAD   N TOTAL        O COSTO PROV
 *   P FLETE       Q CPA          R UTILIDAD   S ORDEN DROPI  T GUIA
 *   U F.CONFIRM   V F.GUIA       W F.ENTREGA  X F.PAGO       Y NOTAS
 */

require('dotenv').config();
const { google } = require('googleapis');

const SHEET_ID = process.env.SHEETS_ID_DROPSHIPPING;
const HOJA = 'PEDIDOS';

// Índice 0 de cada columna, para no contar letras a mano al actualizar.
const C = {
  ID: 0, FECHA: 1, TIENDA: 2, ESTADO: 3, NOMBRE: 4, TELEFONO: 5, PROVINCIA: 6,
  CIUDAD: 7, DIRECCION: 8, REFERENCIAS: 9, PRODUCTO: 10, ID_DROPI: 11,
  CANTIDAD: 12, TOTAL: 13, COSTO: 14, FLETE: 15, CPA: 16, UTILIDAD: 17,
  ORDEN_DROPI: 18, GUIA: 19, F_CONFIRM: 20, F_GUIA: 21, F_ENTREGA: 22,
  F_PAGO: 23, NOTAS: 24
};

const letra = (i) => String.fromCharCode(65 + i);

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

/** Todas las filas con su número real de fila en el Sheet. */
async function leerPedidos() {
  checkConfig();
  const s = getSheets();
  const r = await s.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${HOJA}!A2:Y1000` });
  const filas = r.data.values || [];

  return filas
    .map((f, i) => ({ fila: i + 2, datos: f }))
    .filter((x) => x.datos[C.ID]);
}

/** Busca un pedido por su ID (TRQ-12345). */
async function buscarPedido(idPedido) {
  const todos = await leerPedidos();
  return todos.find((p) => p.datos[C.ID] === idPedido) || null;
}

/** Pedidos en un estado dado. */
async function pedidosPorEstado(estado) {
  const todos = await leerPedidos();
  return todos.filter((p) => p.datos[C.ESTADO] === estado);
}

/** Actualiza celdas sueltas de una fila. `campos` = { ESTADO: 'EN_DROPI', GUIA: '123' } */
async function actualizarFila(fila, campos) {
  checkConfig();
  const s = getSheets();

  const data = Object.entries(campos).map(([clave, valor]) => {
    const col = C[clave];
    if (col === undefined) throw new Error(`Columna desconocida: ${clave}`);
    return { range: `${HOJA}!${letra(col)}${fila}`, values: [[valor]] };
  });

  await s.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data }
  });

  return { fila, actualizado: Object.keys(campos) };
}

/** Agrega un pedido nuevo. Normalmente lo hace n8n, pero sirve para pruebas. */
async function agregarPedido(p) {
  checkConfig();
  const s = getSheets();

  const fila = [];
  fila[C.ID] = p.idPedido;
  fila[C.FECHA] = p.fechaHoraPedido || new Date().toISOString();
  fila[C.TIENDA] = p.tienda || 'truquito';
  fila[C.ESTADO] = p.estado || 'PENDIENTE_CONFIRMACION';
  fila[C.NOMBRE] = p.nombre;
  fila[C.TELEFONO] = p.telefono;
  fila[C.PROVINCIA] = p.provincia;
  fila[C.CIUDAD] = p.ciudad;
  fila[C.DIRECCION] = p.direccion;
  fila[C.REFERENCIAS] = p.referencias || '';
  fila[C.PRODUCTO] = p.productoPrincipal;
  fila[C.ID_DROPI] = p.dropiProductId;
  fila[C.CANTIDAD] = p.cantidad;
  fila[C.TOTAL] = p.total;
  for (let i = 0; i <= C.TOTAL; i++) if (fila[i] === undefined) fila[i] = '';

  await s.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${HOJA}!A:Y`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [fila] }
  });

  return { ok: true, idPedido: p.idPedido };
}

/** Convierte una fila cruda en objeto legible. */
function aObjeto(p) {
  const d = p.datos;
  return {
    fila: p.fila,
    idPedido: d[C.ID],
    fecha: d[C.FECHA],
    tienda: d[C.TIENDA],
    estado: d[C.ESTADO],
    nombre: d[C.NOMBRE],
    telefono: d[C.TELEFONO],
    provincia: d[C.PROVINCIA],
    ciudad: d[C.CIUDAD],
    direccion: d[C.DIRECCION],
    referencias: d[C.REFERENCIAS],
    producto: d[C.PRODUCTO],
    dropiProductId: d[C.ID_DROPI],
    cantidad: Number(d[C.CANTIDAD]) || 1,
    total: parseFloat(String(d[C.TOTAL] || '0').replace(/[$,]/g, '')) || 0,
    ordenDropi: d[C.ORDEN_DROPI] || null,
    guia: d[C.GUIA] || null
  };
}

module.exports = {
  leerPedidos, buscarPedido, pedidosPorEstado, actualizarFila,
  agregarPedido, aObjeto, C, SHEET_ID
};
