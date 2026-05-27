const { google } = require('googleapis');

const SHEETS_ID = process.env.SHEETS_ID;

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

async function appendPedido(pedido) {
  const sheets = await getSheets();
  const fecha = pedido.fecha || new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const mes = meses[new Date().getMonth()];
  const tel = pedido.telefono?.replace(/^0/, '') || '';
  const linkWA = tel ? `https://wa.me/593${tel}` : '';

  const row = [
    '',                          // ID (auto)
    pedido.nombre || '',
    fecha,
    pedido.mes || mes,
    pedido.telefono || '',
    (pedido.ciudad || '').toUpperCase(),
    pedido.normal || '',
    pedido.picante || '',
    pedido.parejas || '',
    pedido.enganchados || '',
    pedido.dados || '',
    pedido.anticipo || '',
    pedido.saldo || '',
    (pedido.cuenta || '').toUpperCase(),
    (pedido.estado || 'PENDIENTE').toUpperCase(),
    pedido.transportadora || 'SERVIENTREGA',
    pedido.envio || '',
    '',                          // GUIA (se agrega después)
    '',                          // LINK RASTREO
    'Rastrear paquete',
    linkWA,
    'Mandar WhatsApp',
    pedido.notas || '',
    '',                          // FALSE
    '',                          // LOG
    '',                          // COSTOS
    '',                          // UTILIDAD
    (pedido.direccion || '').toUpperCase(),
    (pedido.productos || '').toUpperCase(),
    ''                           // Softr ID
  ];

  const result = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AD',
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

async function actualizarGuia(telefono, guia) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: 'PEDIDOS!A:AD'
  });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const telIdx = headers.indexOf('TELEFONO');
  const guiaIdx = headers.indexOf('GUIA');
  const linkIdx = headers.indexOf('LINK RASTREO');

  for (let i = 1; i < rows.length; i++) {
    const rowTel = rows[i][telIdx]?.replace(/^0/, '');
    const inputTel = telefono.replace(/^0/, '').replace(/^593/, '');
    if (rowTel?.endsWith(inputTel) || inputTel.endsWith(rowTel)) {
      const rowNum = i + 1;
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEETS_ID,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: `PEDIDOS!R${rowNum}`, values: [[guia]] },
            { range: `PEDIDOS!S${rowNum}`, values: [[`https://www.servientrega.com.ec/Tracking/Index/?guia=${guia}`]] }
          ]
        }
      });
      return { updated: true, fila: rowNum };
    }
  }
  return { updated: false };
}

async function getPedidosHoy() {
  const sheets = await getSheets();
  const hoy = new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });
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

module.exports = { appendPedido, buscarPedido, actualizarGuia, getPedidosHoy };
