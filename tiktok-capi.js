// Manda el Purchase real a TikTok Events API, mismo criterio que meta-capi.js:
// lo que entra a las hojas de ventas ES una venta, y solo se procesan filas
// que sí vinieron del checkout de la web (acá, con ttclid o _ttp guardado).
//
// PENDIENTE DE ACTIVAR — ver decisions/log.md:
// 1. Captura de ttclid/_ttp en CheckoutModal.tsx (twin de getAtribucionMeta)
//    y columnas TTCLID/TTP en PEDIDOS y VENTAS DIGITALES — no se tocan solas,
//    Fabián tiene que confirmar antes (regla dura desde que se rompió n8n el
//    2026-08-20 por un encabezado vacío).
// 2. Columna CAPI_TIKTOK como flag de "ya se mandó" (paralela a CAPI, que es
//    de Meta — no se reusa la misma para no pisar el envío de la otra
//    plataforma).
// 3. TIKTOK_ACCESS_TOKEN en .env — token de TikTok Events API (Business
//    Center > Events Manager > tu pixel > Configurar > API de conversiones).
//
// Hasta que 1-3 estén listos, este módulo no se importa desde index.js y no
// hace nada.
if (require.main === module) require('dotenv').config();

const { google } = require('googleapis');
const crypto = require('crypto');
const { parseMonto, idxToCol } = require('./sheets.js');

const PIXEL_CODE = process.env.TIKTOK_PIXEL_CODE || 'DAN0CDBC77U903A3N4AG';
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const API_VERSION = 'v1.3';
const EVENTS_URL = `https://business-api.tiktok.com/open_api/${API_VERSION}/event/track/`;

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

function slugContentId(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function enviarPurchase({ idPedido, telefono, email, value, contentName, ttclid, ttp }, { testEventCode } = {}) {
  const user = {};
  if (telefono) user.phone = [sha256(telefonoE164(telefono))];
  if (email) user.email = [sha256(email)];
  if (ttclid) user.ttclid = ttclid;
  if (ttp) user.ttp = ttp;

  const body = {
    event_source: 'web',
    event_source_id: PIXEL_CODE,
    data: [{
      event: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: idPedido,
      user,
      properties: {
        contents: [{
          content_id: slugContentId(contentName),
          content_type: 'product',
          content_name: contentName || '',
        }],
        currency: 'USD',
        value,
      },
      page: { url: 'https://www.shotygames.com/' },
    }],
  };
  if (testEventCode) body.test_event_code = testEventCode;

  const res = await fetch(EVENTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Access-Token': ACCESS_TOKEN },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.code !== 0) throw new Error(JSON.stringify(json));
  return json;
}

// Config de cada hoja: cómo leerla, cómo filtrarla, cómo armar el pedido.
// TTCLID/TTP y CAPI_TIKTOK todavía no existen en los Sheets reales — ver
// nota de arriba. Cuando se agreguen, esto queda simétrico a meta-capi.js.
const FUENTES = [
  {
    nombre: 'PEDIDOS (físicos)',
    spreadsheetId: process.env.SHEETS_ID,
    range: 'PEDIDOS!A:AN',
    columnasRequeridas: ['TELEFONO', 'CAPI_TIKTOK', 'IDPEDIDO', 'TTCLID', 'TTP'],
    extraer(row, idx, i) {
      const ttclid = row[idx('TTCLID')] || '';
      const ttp = row[idx('TTP')] || '';
      if (!row[idx('TELEFONO')] || (!ttclid && !ttp)) return null; // no vino de la web (vía TikTok)
      return {
        idPedido: row[idx('IDPEDIDO')] || `SG-ROW-${i + 1}`,
        contentName: row[idx('PRODUCTOS')] || '',
        telefono: row[idx('TELEFONO')] || '',
        value: (parseMonto(row[idx('ANTICIPO')]) || 0) + (parseMonto(row[idx('SALDO')]) || 0),
        ttclid,
        ttp,
      };
    },
  },
  {
    nombre: 'VENTAS DIGITALES',
    spreadsheetId: process.env.SHEETS_ID_VENTAS_DIGITALES,
    range: 'VENTAS!A:P',
    columnasRequeridas: ['ESTADO', 'CAPI_TIKTOK', 'ID', 'TTCLID', 'TTP'],
    extraer(row, idx, i) {
      const ttclid = row[idx('TTCLID')] || '';
      const ttp = row[idx('TTP')] || '';
      const estado = String(row[idx('ESTADO')] || '').toUpperCase();
      if (estado !== 'PAGADO' || (!ttclid && !ttp)) return null; // no cobrado, o no vino de TikTok
      return {
        idPedido: row[idx('ID')] || `SGD-ROW-${i + 1}`,
        email: row[idx('CORREO')] || '',
        telefono: row[idx('NUMERO')] || '',
        contentName: row[idx('PRODUCTOS')] || '',
        value: parseMonto(row[idx('INGRESOS')]) || 0,
        ttclid,
        ttp,
      };
    },
  },
];

async function procesarHoja(sheetsApi, fuente, { dryRun, testEventCode }) {
  if (!fuente.spreadsheetId) {
    console.log(`tiktok-capi [${fuente.nombre}]: desactivado (falta el spreadsheetId en env)`);
    return [];
  }

  const res = await sheetsApi.spreadsheets.values.get({ spreadsheetId: fuente.spreadsheetId, range: fuente.range });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const idx = (nombre) => headers.indexOf(nombre);
  const iCapi = idx('CAPI_TIKTOK');

  const faltantes = fuente.columnasRequeridas.filter((c) => idx(c) === -1);
  if (faltantes.length) {
    throw new Error(`tiktok-capi [${fuente.nombre}]: faltan columnas ${faltantes.join(', ')}`);
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

  console.log(`tiktok-capi [${fuente.nombre}]: ${pendientes.length} pedido(s) pendiente(s) de enviar.`);

  const enviados = [];
  for (const p of pendientes) {
    try {
      if (dryRun) {
        console.log(`[DRY RUN][${fuente.nombre}] mandaría Purchase:`, { idPedido: p.idPedido, value: p.value, ttclid: !!p.ttclid, ttp: !!p.ttp });
      } else {
        const resp = await enviarPurchase(p, { testEventCode });
        console.log(`tiktok-capi [${fuente.nombre}]: enviado ${p.idPedido} (fila ${p.rowNum})`);
        await sheetsApi.spreadsheets.values.update({
          spreadsheetId: fuente.spreadsheetId,
          range: `${fuente.range.split('!')[0]}!${idxToCol(iCapi)}${p.rowNum}`,
          valueInputOption: 'RAW',
          resource: { values: [['TRUE']] },
        });
      }
      enviados.push(p.idPedido);
    } catch (e) {
      console.error(`tiktok-capi [${fuente.nombre}]: error enviando ${p.idPedido} (fila ${p.rowNum}):`, e.message);
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
    .then((r) => console.log('tiktok-capi: listo.', JSON.stringify(r)))
    .catch((e) => { console.error('tiktok-capi: fallo general:', e); process.exit(1); });
}
