// Manda el Purchase real a Meta por Conversions API, leyendo de las hojas
// donde se registran las ventas reales — la regla de Fabián es que todo lo
// que entra ahí ES una venta. Solo se procesan filas que tengan fbc o fbp
// guardado (o sea, que sí vinieron del checkout de la web); pedidos de
// otras fuentes no tienen esos datos y se saltan solos.
//
// Dos fuentes, arquitecturas distintas:
// - PEDIDOS (físicos): una sola hoja oficial, se registra cuando la venta ya
//   se confirmó por WhatsApp — cualquier fila con fbc/fbp cuenta.
// - VENTAS DIGITALES: se registra al momento del checkout (PENDIENTE) y la
//   MISMA fila pasa a PAGADO cuando se cobra — solo se manda si ESTADO=PAGADO.
//
// En ambas, la columna CAPI es el flag de "ya se mandó" — se marca TRUE
// después de un envío exitoso para no duplicar la conversión si el cron
// corre de nuevo.
if (require.main === module) require('dotenv').config();

const { google } = require('googleapis');
const crypto = require('crypto');
const { parseMonto, idxToCol } = require('./sheets.js');

const PIXEL_ID = process.env.META_PIXEL_ID;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const GRAPH_VERSION = 'v20.0';

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2Client;
}

function sha256(valor) {
  return crypto.createHash('sha256').update(String(valor || '').trim().toLowerCase()).digest('hex');
}

// Mismo formato que usa la subida de audiencias a Meta: 593 + número sin el 0 inicial.
function telefonoE164(tel) {
  let s = String(tel || '').replace(/\D/g, '');
  if (s.startsWith('593')) s = s.slice(3);
  if (s.startsWith('0')) s = s.slice(1);
  return '593' + s;
}

async function enviarPurchase({ idPedido, nombre, telefono, email, ciudad, value, fbc, fbp }, { testEventCode } = {}) {
  const [firstName, ...resto] = String(nombre || '').trim().split(/\s+/);
  const lastName = resto.join(' ');

  const userData = {};
  if (telefono) userData.ph = [sha256(telefonoE164(telefono))];
  if (email) userData.em = [sha256(email)];
  if (firstName) userData.fn = [sha256(firstName)];
  if (lastName) userData.ln = [sha256(lastName)];
  if (ciudad) userData.ct = [sha256(ciudad)];
  if (fbc) userData.fbc = fbc;
  if (fbp) userData.fbp = fbp;

  const body = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: idPedido,
      action_source: 'website',
      event_source_url: 'https://www.shotygames.com/',
      user_data: userData,
      custom_data: {
        currency: 'USD',
        value,
        content_type: 'product',
        order_id: idPedido
      }
    }]
  };
  if (testEventCode) body.test_event_code = testEventCode;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

// Config de cada hoja: cómo leerla, cómo filtrarla, cómo armar el pedido.
const FUENTES = [
  {
    nombre: 'PEDIDOS (físicos)',
    spreadsheetId: process.env.SHEETS_ID,
    range: 'PEDIDOS!A:AN',
    columnasRequeridas: ['TELEFONO', 'CAPI', 'IDPEDIDO', 'FBC', 'FBP'],
    extraer(row, idx, i) {
      const fbc = row[idx('FBC')] || '';
      const fbp = row[idx('FBP')] || '';
      if (!row[idx('TELEFONO')] || (!fbc && !fbp)) return null; // no vino de la web
      return {
        idPedido: row[idx('IDPEDIDO')] || `SG-ROW-${i + 1}`,
        nombre: row[idx('NOMBRE')] || '',
        telefono: row[idx('TELEFONO')] || '',
        ciudad: row[idx('CIUDAD')] || '',
        value: (parseMonto(row[idx('ANTICIPO')]) || 0) + (parseMonto(row[idx('SALDO')]) || 0),
        fbc,
        fbp
      };
    }
  },
  {
    nombre: 'VENTAS DIGITALES',
    spreadsheetId: process.env.SHEETS_ID_VENTAS_DIGITALES,
    range: 'VENTAS!A:P',
    columnasRequeridas: ['ESTADO', 'CAPI', 'ID', 'FBC', 'FBP'],
    extraer(row, idx, i) {
      const fbc = row[idx('FBC')] || '';
      const fbp = row[idx('FBP')] || '';
      const estado = String(row[idx('ESTADO')] || '').toUpperCase();
      if (estado !== 'PAGADO' || (!fbc && !fbp)) return null; // todavía no se cobró, o no vino de la web
      return {
        idPedido: row[idx('ID')] || `SGD-ROW-${i + 1}`,
        email: row[idx('CORREO')] || '',
        telefono: row[idx('NUMERO')] || '',
        value: parseMonto(row[idx('INGRESOS')]) || 0,
        fbc,
        fbp
      };
    }
  }
];

async function procesarHoja(sheetsApi, fuente, { dryRun, testEventCode }) {
  if (!fuente.spreadsheetId) {
    console.log(`meta-capi [${fuente.nombre}]: desactivado (falta el spreadsheetId en env)`);
    return [];
  }

  const res = await sheetsApi.spreadsheets.values.get({ spreadsheetId: fuente.spreadsheetId, range: fuente.range });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const idx = (nombre) => headers.indexOf(nombre);
  const iCapi = idx('CAPI');

  const faltantes = fuente.columnasRequeridas.filter((c) => idx(c) === -1);
  if (faltantes.length) {
    throw new Error(`meta-capi [${fuente.nombre}]: faltan columnas ${faltantes.join(', ')}`);
  }

  const pendientes = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    if (String(row[iCapi] || '').toUpperCase() === 'TRUE') continue; // ya enviado

    const pedido = fuente.extraer(row, idx, i);
    if (!pedido) continue;
    pendientes.push({ ...pedido, rowNum: i + 1 });
  }

  console.log(`meta-capi [${fuente.nombre}]: ${pendientes.length} pedido(s) pendiente(s) de enviar.`);

  const enviados = [];
  for (const p of pendientes) {
    try {
      if (dryRun) {
        console.log(`[DRY RUN][${fuente.nombre}] mandaría Purchase:`, { idPedido: p.idPedido, value: p.value, fbc: !!p.fbc, fbp: !!p.fbp });
      } else {
        const resp = await enviarPurchase(p, { testEventCode });
        console.log(`meta-capi [${fuente.nombre}]: enviado ${p.idPedido} (fila ${p.rowNum}) — events_received=${resp.events_received}`);
        await sheetsApi.spreadsheets.values.update({
          spreadsheetId: fuente.spreadsheetId,
          range: `${fuente.range.split('!')[0]}!${idxToCol(iCapi)}${p.rowNum}`,
          valueInputOption: 'RAW',
          resource: { values: [['TRUE']] }
        });
      }
      enviados.push(p.idPedido);
    } catch (e) {
      console.error(`meta-capi [${fuente.nombre}]: error enviando ${p.idPedido} (fila ${p.rowNum}):`, e.message);
    }
  }

  return enviados;
}

async function procesarPendientes({ dryRun = false, testEventCode } = {}) {
  const sheetsApi = google.sheets({ version: 'v4', auth: getAuth() });
  const resultados = {};
  for (const fuente of FUENTES) {
    resultados[fuente.nombre] = await procesarHoja(sheetsApi, fuente, { dryRun, testEventCode });
  }
  return resultados;
}

module.exports = { procesarPendientes, enviarPurchase };

if (require.main === module) {
  const dryRun = process.argv.includes('--dry');
  const testEventCodeArg = process.argv.find(a => a.startsWith('--test-code='));
  const testEventCode = testEventCodeArg ? testEventCodeArg.split('=')[1] : undefined;

  procesarPendientes({ dryRun, testEventCode })
    .then((r) => console.log('meta-capi: listo.', JSON.stringify(r)))
    .catch((e) => { console.error('meta-capi: fallo general:', e); process.exit(1); });
}
