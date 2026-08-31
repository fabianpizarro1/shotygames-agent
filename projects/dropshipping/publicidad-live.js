/**
 * Llena la hoja PUBLICIDAD_DATOS: una fila por DÍA y PRODUCTO, con el gasto de
 * Meta y las ventas reales del Sheet de pedidos. Pensado para correr cada 15
 * min (ver scripts/publicidad-live.sh). Reescribe los últimos 30 días enteros
 * en cada corrida — el día de hoy se va actualizando solo, y los días viejos se
 * corrigen si Meta reajusta el gasto o si un pedido cambia de estado.
 *
 *   node projects/dropshipping/publicidad-live.js
 *
 * El layout de la hoja lo arma `publicidad-sheet.js` (correr esa primero).
 *
 * Requiere META_ADS_TOKEN en .env con permiso ads_read sobre las dos cuentas
 * (Avanora 1284579892343452, Truquito 28155166654115477).
 *
 * ── Decisiones que NO hay que reinterpretar ──
 * - Campañas UNIFICADAS por producto: si un producto tiene 2 campañas activas,
 *   se suma el gasto de las dos en una sola fila. Es lo que pidió Fabián, y
 *   además es lo único honesto: el Sheet no guarda de qué campaña vino cada
 *   pedido, así que repartir el CPA entre campañas sería inventado.
 * - "VENTAS REALES" = pedidos del día excluyendo CANCELADO y
 *   PENDIENTE_CONFIRMACION, por FECHA de creación (que es lo que produjo el ads).
 * - GASTO REAL = gasto de Meta × 1.2 (comisión del banco). CPA y ROAS se
 *   calculan siempre contra el gasto REAL, nunca contra el crudo.
 * - El join pedido→producto es por ID DROPI, no por el texto de PRODUCTO: el
 *   mismo id sale escrito distinto según cómo se registró el pedido
 *   ("Olla Freidora con Canasta" vs "Mini Olla Freidora con Canasta Acero
 *   Inoxidable", los dos son 133468).
 */
require('dotenv').config();
const { google } = require('googleapis');
const campanas = require('./campanas.js');
const { leerPedidos } = require('./sheets-pedidos.js');
const { parseMonto } = require('../../sheets.js');

const SHEET_ID = process.env.SHEETS_ID_DROPSHIPPING;
const HOJA_DATOS = 'PUBLICIDAD_DATOS';
const GRAPH_VERSION = 'v20.0';
const COMISION_BANCARIA = 1.2;
const DIAS = 30;

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

const hoyEC = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });

function diasAtras(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana que contiene `iso`. La semana SIEMPRE es lunes-domingo. */
function lunesDeLaSemana(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  const dia = d.getUTCDay();  // 0 = domingo
  d.setUTCDate(d.getUTCDate() - (dia === 0 ? 6 : dia - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * "2026-08-24 → 08-30". Arranca con la fecha del lunes a propósito: así el
 * QUERY de la hoja la ordena cronológicamente aunque sea texto.
 */
function etiquetaSemana(iso) {
  const lunes = lunesDeLaSemana(iso);
  return `${lunes} → ${diasAtras(lunes, -6).slice(5)}`;
}

/** Gasto por día de una campaña. Devuelve { 'YYYY-MM-DD': gasto }. */
async function insightsDiarios(campaignId, token) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${campaignId}/insights` +
    `?fields=spend&time_increment=1&date_preset=last_30d&limit=100&access_token=${token}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(`Meta insights ${campaignId}: ${JSON.stringify(json)}`);

  const porFecha = {};
  for (const f of json.data || []) porFecha[f.date_start] = parseFloat(f.spend || 0);
  return porFecha;
}

function aISO(val) {
  if (!val) return null;
  const m = String(val).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[0] : null;
}

/**
 * Ventas, ingreso, entregados y devueltos por día.
 * Devuelve { 'tienda|idDropi': { fecha: {ventas, ingreso, entregados, devueltos} } }.
 *
 * ── Qué es una DEVOLUCIÓN acá ──
 * Ni el Sheet ni DROPI tienen un estado `DEVUELTO` (verificado el 2026-08-31
 * contra las 91 órdenes reales de la cuenta 12054: los estados que existen son
 * ENTREGADO, PENDIENTE, CANCELADO, NOVEDAD, GUIA_GENERADA y variantes de
 * tránsito). Lo único que distingue "se cayó antes de despachar" de "salió y
 * volvió" es la GUÍA: si el pedido llegó a tener guía y terminó CANCELADO, el
 * paquete se movió y volvió. Sin guía, nunca salió y no es una devolución.
 *
 * Al 2026-08-31 esto da 0 devoluciones sobre 18 cancelados — los 18 se cayeron
 * antes de que el paquete existiera. Si algún día DROPI empieza a devolver un
 * estado propio de devolución, cambiar ACÁ y nada más.
 */
async function pedidosDiarios({ desde }) {
  const todos = await leerPedidos();
  const porClave = {};

  for (const { datos, C } of todos) {
    const estado = String(datos[C.ESTADO] || '').toUpperCase().trim();
    if (estado === 'PENDIENTE_CONFIRMACION') continue;

    const tieneGuia = String(datos[C.GUIA] || '').trim() !== '';
    const devuelto = estado === 'CANCELADO' && tieneGuia;
    // Cancelado sin guía = el paquete nunca salió. No es venta ni devolución.
    if (estado === 'CANCELADO' && !devuelto) continue;

    const fecha = aISO(datos[C.FECHA]);
    if (!fecha || fecha < desde) continue;

    const clave = `${String(datos[C.TIENDA] || '').toLowerCase().trim()}|${String(datos[C.ID_DROPI] || '').trim()}`;
    porClave[clave] ||= {};
    const d = (porClave[clave][fecha] ||= { ventas: 0, ingreso: 0, entregados: 0, devueltos: 0 });

    if (devuelto) {
      d.devueltos += 1;
    } else {
      d.ventas += 1;
      d.ingreso += parseMonto(datos[C.TOTAL]) || 0;
      if (estado === 'ENTREGADO' || estado === 'PAGADO') d.entregados += 1;
    }
  }
  return porClave;
}

const usd = (n) => Math.round(n * 100) / 100;

/** Una fila por día y producto, con las campañas del producto ya sumadas. */
function calcularFilas({ gastoPorCampaña, pedidosPorClave, desde }) {
  const filas = [];

  for (const p of campanas) {
    const gastoPorFecha = {};
    for (const c of p.campañas) {
      for (const [fecha, gasto] of Object.entries(gastoPorCampaña[c.id] || {})) {
        if (fecha < desde) continue;
        gastoPorFecha[fecha] = (gastoPorFecha[fecha] || 0) + gasto;
      }
    }

    const pedidosPorFecha = pedidosPorClave[`${p.tienda}|${p.idDropi}`] || {};
    const fechas = [...new Set([...Object.keys(gastoPorFecha), ...Object.keys(pedidosPorFecha)])].sort();

    for (const fecha of fechas) {
      const gasto = gastoPorFecha[fecha] || 0;
      const { ventas = 0, ingreso = 0, entregados = 0, devueltos = 0 } = pedidosPorFecha[fecha] || {};
      if (gasto === 0 && ventas === 0 && devueltos === 0) continue;  // día sin nada: no ensucia la tabla

      filas.push([
        fecha,
        p.tienda.toUpperCase(),
        p.producto,
        usd(gasto),
        usd(gasto * COMISION_BANCARIA),
        ventas,
        usd(ingreso),
        entregados,
        devueltos,
        etiquetaSemana(fecha),   // J — la hoja agrupa por acá cuando se elige SEMANA
        fecha.slice(0, 7),       // K — y por acá cuando se elige MES
      ]);
    }
  }
  return filas;
}

async function escribirDatos(filas) {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${HOJA_DATOS}!A2:K2000` });
  if (filas.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${HOJA_DATOS}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: filas }
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'PUBLICIDAD!H2',
    valueInputOption: 'RAW',
    requestBody: { values: [[new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })]] }
  });
}

async function main() {
  if (!SHEET_ID) throw new Error('Falta SHEETS_ID_DROPSHIPPING en .env');
  const token = process.env.META_ADS_TOKEN;
  if (!token) throw new Error('Falta META_ADS_TOKEN en .env (permiso ads_read en las 2 cuentas)');

  const desde = diasAtras(hoyEC(), DIAS);

  const gastoPorCampaña = {};
  for (const p of campanas) {
    for (const c of p.campañas) gastoPorCampaña[c.id] = await insightsDiarios(c.id, token);
  }

  const pedidosPorClave = await pedidosDiarios({ desde });
  const filas = calcularFilas({ gastoPorCampaña, pedidosPorClave, desde });

  await escribirDatos(filas);
  console.log(`Listo — ${filas.length} filas (día × producto) desde ${desde}.`);
}

module.exports = { insightsDiarios, pedidosDiarios, calcularFilas, escribirDatos, diasAtras, hoyEC, DIAS };

if (require.main === module) {
  main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
}
