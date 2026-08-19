// Manda el Purchase real a Meta por Conversions API, leyendo directo de la
// hoja "PEDIDOS" — la regla de Fabián es que todo lo que entra ahí ES una
// venta. Solo se procesan filas que tengan fbc o fbp guardado (o sea, que
// sí vinieron del checkout de la web); pedidos registrados manualmente de
// otras fuentes no tienen esos datos y se saltan solos.
//
// La columna CAPI es el flag de "ya se mandó" — se marca TRUE después de
// un envío exitoso para no duplicar la conversión si el cron corre de nuevo.
if (require.main === module) require('dotenv').config();

const { google } = require('googleapis');
const crypto = require('crypto');
const { parseMonto, idxToCol } = require('./sheets.js');

const SHEETS_ID = process.env.SHEETS_ID;
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

async function enviarPurchase({ idPedido, nombre, telefono, ciudad, value, fbc, fbp }, { testEventCode } = {}) {
  const [firstName, ...resto] = String(nombre || '').trim().split(/\s+/);
  const lastName = resto.join(' ');

  const userData = {};
  if (telefono) userData.ph = [sha256(telefonoE164(telefono))];
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

async function procesarPendientes({ dryRun = false, testEventCode } = {}) {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEETS_ID, range: 'PEDIDOS!A:AN' });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const idx = (nombre) => headers.indexOf(nombre);

  const iNombre = idx('NOMBRE'), iTel = idx('TELEFONO'), iCiudad = idx('CIUDAD'),
        iAnticipo = idx('ANTICIPO'), iSaldo = idx('SALDO'),
        iCapi = idx('CAPI'), iIdPedido = idx('IDPEDIDO'), iFbc = idx('FBC'), iFbp = idx('FBP');

  if ([iTel, iCapi, iIdPedido, iFbc, iFbp].includes(-1)) {
    throw new Error('meta-capi: faltan columnas esperadas en PEDIDOS (TELEFONO/CAPI/IDPEDIDO/FBC/FBP)');
  }

  const pendientes = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[iTel]) continue;

    const fbc = row[iFbc] || '';
    const fbp = row[iFbp] || '';
    if (!fbc && !fbp) continue; // no vino de la web, no hay nada que atribuir

    if (String(row[iCapi] || '').toUpperCase() === 'TRUE') continue; // ya enviado

    const idPedido = row[iIdPedido] || `SG-ROW-${i + 1}`;
    const value = (parseMonto(row[iAnticipo]) || 0) + (parseMonto(row[iSaldo]) || 0);

    pendientes.push({
      rowNum: i + 1,
      idPedido,
      nombre: row[iNombre] || '',
      telefono: row[iTel] || '',
      ciudad: row[iCiudad] || '',
      value,
      fbc,
      fbp
    });
  }

  console.log(`meta-capi: ${pendientes.length} pedido(s) pendiente(s) de enviar.`);

  const enviados = [];
  for (const p of pendientes) {
    try {
      if (dryRun) {
        console.log('[DRY RUN] mandaría Purchase:', { idPedido: p.idPedido, value: p.value, telefono: p.telefono, fbc: !!p.fbc, fbp: !!p.fbp });
      } else {
        const resp = await enviarPurchase(p, { testEventCode });
        console.log(`meta-capi: enviado ${p.idPedido} (fila ${p.rowNum}) — events_received=${resp.events_received}`);
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEETS_ID,
          range: `PEDIDOS!${idxToCol(iCapi)}${p.rowNum}`,
          valueInputOption: 'RAW',
          resource: { values: [['TRUE']] }
        });
      }
      enviados.push(p.idPedido);
    } catch (e) {
      console.error(`meta-capi: error enviando ${p.idPedido} (fila ${p.rowNum}):`, e.message);
    }
  }

  return enviados;
}

module.exports = { procesarPendientes, enviarPurchase };

if (require.main === module) {
  const dryRun = process.argv.includes('--dry');
  const testEventCodeArg = process.argv.find(a => a.startsWith('--test-code='));
  const testEventCode = testEventCodeArg ? testEventCodeArg.split('=')[1] : undefined;

  procesarPendientes({ dryRun, testEventCode })
    .then((r) => console.log('meta-capi: listo.', r))
    .catch((e) => { console.error('meta-capi: fallo general:', e); process.exit(1); });
}
