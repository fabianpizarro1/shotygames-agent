const { google } = require('googleapis');

const SHEETS_ID = process.env.SHEETS_ID;
const SHEETS_ID_FINANZAS = process.env.SHEETS_ID_FINANZAS;

// Convierte strings de monto ("$16,50", "16.5", "16,5") a número para que Sheets pueda sumar
function parseMonto(val) {
  if (val === '' || val === null || val === undefined) return '';
  const num = parseFloat(String(val).replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim());
  if (isNaN(num) || num === 0) return '';
  return num;
}

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  return oauth2Client;
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

async function appendPedido(pedido) {
  const sheets = await getSheets();
  const TZ = { timeZone: 'America/Guayaquil' };
  const fecha = pedido.fecha || new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', ...TZ });
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const mes = meses[new Date().toLocaleString('es-EC', { month: 'numeric', ...TZ }) - 1];
  const row = [
    '1',                                     // col 1:  ID
    pedido.nombre || '',                     // col 2:  NOMBRE
    fecha,                                   // col 3:  FECHA
    pedido.mes || mes,                       // col 4:  MES
    pedido.telefono || '',                   // col 5:  TELEFONO
    (pedido.ciudad || '').toUpperCase(),     // col 6:  CIUDAD
    pedido.normal || '',                     // col 7:  N
    pedido.picante || '',                    // col 8:  P
    pedido.parejas || '',                    // col 9:  PAR
    pedido.enganchados || '',               // col 10: ENG
    pedido.dados || '',                     // col 11: DADOS
    '',                                     // col 12: (vacía)
    '',                                     // col 13: (vacía)
    '',                                     // col 14: (vacía)
    '',                                     // col 15: (vacía)
    parseMonto(pedido.anticipo),            // col 16: ANTICIPO
    parseMonto(pedido.saldo),              // col 17: SALDO
    (pedido.cuenta || '').toUpperCase(),    // col 18: CUENTA
    (pedido.estado || 'PENDIENTE').toUpperCase(), // col 19: ESTADO
    pedido.transportadora || 'SERVIENTREGA', // col 20: TRANSPORTADORA
    pedido.envio || '',                     // col 21: ENVIO
    '',                                     // col 22: GUIA (se agrega después)
    '',                                     // col 23: LINK RASTREO
    '',                                     // col 24: RASTREO (automática)
    '',                                     // col 25: LINK WHATSAPP (automática)
    '',                                     // col 26: WHATSAPP (automática)
    pedido.notas || '',                     // col 27: NOTAS
    '',                                     // col 28: FALSE
    '',                                     // col 29: LOG
    '',                                     // col 30: COSTOS
    '',                                     // col 31: UTILIDAD
    (pedido.direccion || '').toUpperCase(), // col 32: DIRECCION
    '',                                     // col 33: PRODUCTOS (automática)
    ''                                      // col 34: Softr Record ID
  ];

  // Buscar la última fila con datos para escribir justo después
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!B:B'  // columna NOMBRE para detectar última fila con dato
  });
  const lastRow = (existing.data.values || []).length; // length ya incluye el header
  const nextRow = lastRow + 1;

  const result = await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETS_ID,
    range: `PEDIDOS!A${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });

  return result.data.updates;
}

async function buscarPedido(nombre) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AD'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const nombreIdx = headers.indexOf('NOMBRE');
  const matches = rows.slice(1).filter(r =>
    r[nombreIdx]?.toLowerCase().includes(nombre.toLowerCase())
  );
  return matches.slice(0, 5).map(r => {
    const obj = {};
    headers.forEach((h, i) => { if (r[i]) obj[h] = r[i]; });
    return obj;
  });
}

function idxToCol(idx) {
  // Convierte índice 0-based a letra de columna (0=A, 1=B, ...)
  return String.fromCharCode(65 + idx);
}

// Actualiza la guía en el pedido MÁS RECIENTE sin guía que coincida con el teléfono
async function actualizarGuia(telefono, guia, envio) {
  const sheetsApi = await getSheets();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AJ'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const telIdx    = headers.indexOf('TELEFONO');
  const guiaIdx   = headers.indexOf('GUIA');
  const linkIdx   = headers.indexOf('LINK RASTREO');
  const envioIdx  = headers.indexOf('ENVIO');

  console.log(`actualizarGuia: tel="${telefono}" guia="${guia}" envio="${envio}"`);
  console.log(`actualizarGuia: col indices — tel:${telIdx} guia:${guiaIdx} link:${linkIdx} envio:${envioIdx}`);

  const inputTel = String(telefono).replace(/^0/, '').replace(/^593/, '');

  // Buscar desde el final para actualizar el pedido MÁS RECIENTE
  let foundRow = -1;
  for (let i = rows.length - 1; i >= 1; i--) {
    const rowTel = String(rows[i][telIdx] || '').replace(/^0/, '').replace(/^593/, '');
    const telMatch = rowTel.endsWith(inputTel) || inputTel.endsWith(rowTel);
    const sinGuia  = !rows[i][guiaIdx]; // priorizar los que no tienen guía aún
    if (telMatch && sinGuia) { foundRow = i; break; }
  }
  // Si todos tienen guía, usar el más reciente que coincida
  if (foundRow === -1) {
    for (let i = rows.length - 1; i >= 1; i--) {
      const rowTel = String(rows[i][telIdx] || '').replace(/^0/, '').replace(/^593/, '');
      if (rowTel.endsWith(inputTel) || inputTel.endsWith(rowTel)) { foundRow = i; break; }
    }
  }

  console.log(`actualizarGuia: foundRow=${foundRow} (fila ${foundRow + 1})`);
  if (foundRow === -1) return { updated: false };

  const rowNum = foundRow + 1; // 1-indexed
  const updates = [];

  if (guiaIdx >= 0) {
    updates.push({ range: `PEDIDOS!${idxToCol(guiaIdx)}${rowNum}`, values: [[guia]] });
  }
  if (linkIdx >= 0) {
    const trackingUrl = `https://www.servientrega.com.ec/Tracking/Index/?guia=${guia}`;
    updates.push({ range: `PEDIDOS!${idxToCol(linkIdx)}${rowNum}`, values: [[trackingUrl]] });
  }
  if (envioIdx >= 0 && envio) {
    const envioStr = `$${parseFloat(envio).toFixed(2).replace('.', ',')}`;
    updates.push({ range: `PEDIDOS!${idxToCol(envioIdx)}${rowNum}`, values: [[envioStr]] });
  }

  if (updates.length > 0) {
    await sheetsApi.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEETS_ID,
      resource: { valueInputOption: 'USER_ENTERED', data: updates }
    });
  }

  return { updated: true, fila: rowNum };
}

async function getPedidosHoy() {
  const sheets = await getSheets();
  const hoy = new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', timeZone: 'America/Guayaquil' });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AD'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const fechaIdx = headers.indexOf('FECHA');
  const pedidos = rows.slice(1).filter(r => r[fechaIdx] === hoy);
  return { total: pedidos.length, pedidos: pedidos.map(r => {
    const obj = {};
    headers.forEach((h, i) => { if (r[i]) obj[h] = r[i]; });
    return obj;
  })};
}

async function registrarMovimiento(hoja, datos) {
  const sheets = await getSheets();
  const fecha = datos.fecha || new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', timeZone: 'America/Guayaquil' });

  let row;
  if (hoja === 'TRANSFERENCIAS') {
    row = [
      fecha,                                        // FECHA
      '',                                           // MES (automática)
      (datos.sale || '').toUpperCase(),             // SALE
      (datos.entra || '').toUpperCase(),            // ENTRA
      (datos.motivo || '').toUpperCase(),           // MOTIVO
      parseMonto(datos.valor)                       // VALOR
    ];
  } else {
    // GASTOS e INGRESOS tienen la misma estructura
    row = [
      fecha,                                        // FECHA
      '',                                           // MES (automática)
      (datos.categoria || '').toUpperCase(),        // CATEGORIA
      (datos.observaciones || '').toUpperCase(),    // OBSERVACIONES
      (datos.cuenta || '').toUpperCase(),           // CUENTA
      parseMonto(datos.valor)                       // VALOR
    ];
  }

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID_FINANZAS,
    range: `${hoja}!A:A`
  });
  const lastRow = (existing.data.values || []).length;
  const nextRow = lastRow + 1;

  const result = await sheets.spreadsheets.values.update({
    spreadsheetId: SHEETS_ID_FINANZAS,
    range: `${hoja}!A${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });

  return result.data.updates;
}

module.exports = { appendPedido, buscarPedido, actualizarGuia, getPedidosHoy, registrarMovimiento };
