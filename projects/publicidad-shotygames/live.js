/**
 * Llena PUBLICIDAD_DATOS en el Sheet "2026 REGISTRO DE VENTAS" (Shotygames):
 * una fila por DÍA con el gasto de Meta y las ventas reales del Sheet.
 *
 *   node projects/publicidad-shotygames/live.js
 *
 * El layout lo arma `sheet.js` (correr esa primero).
 * Ver `config.js` para POR QUÉ esto no es una copia de dropshipping.
 *
 * ── Reglas ──
 * - Gasto: cuenta 1451115062090627 completa (no se puede partir por producto).
 * - VENTAS REALES: todo pedido que NO sea devolución. Se guardan dos versiones
 *   —todas y solo las que traen atribución de Meta— y el selector de la hoja
 *   elige cuál mirar sin tener que volver a correr esto.
 * - UTILIDAD: se usa la columna UTILIDAD que el Sheet YA calcula
 *   (ingreso − costo − envío, sin publicidad). No se recalcula: es el número
 *   de Fabián, no uno mío.
 * - Se usa `time_range` explícito y NO `date_preset`: los presets de N días
 *   EXCLUYEN el día en curso — ver feedback_meta_date_preset_hoy.
 */
require('dotenv').config();
const { google } = require('googleapis');
const { parseMonto } = require('../../sheets.js');
const { hoyEC, aFechaLocal } = require('../../fechas.js');
const { CUENTAS_ADS, ESTADOS, COSTO_CAJA, COLUMNAS_CANTIDAD } = require('./config.js');

const SHEET_ID = process.env.SHEETS_ID;
const HOJA_DATOS = 'PUBLICIDAD_DATOS';
const GRAPH_VERSION = 'v20.0';
const COMISION_BANCARIA = 1.2;
/**
 * La ventana arranca el 1 de ENERO del año en curso, no N días atrás.
 *
 * Tiene que coincidir con el alcance del Sheet: se llama "2026 REGISTRO DE
 * VENTAS" y solo tiene pedidos de 2026. Con una ventana rodante de 365 días se
 * colaban sep-dic 2025, que en Meta SÍ tienen gasto ($12.700) pero no tienen
 * ventas en este Sheet: salían 4 meses con ROAS 0 y -$15.000 de utilidad
 * inventada, que además contaminaban el TOTAL.
 */
const inicioDelAnio = () => `${hoyEC().slice(0, 4)}-01-01`;

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

function diasAtras(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function lunesDeLaSemana(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  const dia = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (dia === 0 ? 6 : dia - 1));
  return d.toISOString().slice(0, 10);
}

const etiquetaSemana = (iso) => {
  const lunes = lunesDeLaSemana(iso);
  return `${lunes} → ${diasAtras(lunes, -6).slice(5)}`;
};

/**
 * Gasto por día, SUMANDO todas las cuentas de `CUENTAS_ADS`.
 * Devuelve { 'YYYY-MM-DD': gasto }.
 *
 * Pagina con `after`: un año con `time_increment=1` puede pasarse del límite de
 * una sola respuesta, y si no se pagina se pierden días en silencio.
 */
async function gastoDiario(token, { desde, hasta }) {
  const rango = encodeURIComponent(JSON.stringify({ since: desde, until: hasta }));
  const porFecha = {};

  for (const cuenta of CUENTAS_ADS) {
    let url = `https://graph.facebook.com/${GRAPH_VERSION}/act_${cuenta.id}/insights` +
      `?fields=spend&time_increment=1&time_range=${rango}&limit=200&access_token=${token}`;
    let paginas = 0;
    while (url && paginas < 20) {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(`Meta insights ${cuenta.nombre} (${cuenta.id}): ${JSON.stringify(json.error || json)}`);
      for (const f of json.data || []) {
        porFecha[f.date_start] = (porFecha[f.date_start] || 0) + parseFloat(f.spend || 0);
      }
      url = json.paging?.next || null;
      paginas++;
    }
  }
  return porFecha;
}

const en = (lista, estado) => lista.includes(estado);

/** Ventas por día, en dos versiones: todas y solo las atribuidas a Meta. */
async function pedidosDiarios({ desde }) {
  const api = google.sheets({ version: 'v4', auth: getAuth() });
  const r = await api.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'PEDIDOS!A1:AZ5000' });
  const filas = r.data.values || [];
  const head = filas[0] || [];
  const idx = (n) => head.indexOf(n);

  const vacio = () => ({
    ventas: 0, ingreso: 0, entregados: 0, devueltos: 0,
    margenEntregados: 0, perdidaDevueltos: 0, margenPendientes: 0, fletePendientes: 0,
  });
  const porFecha = {};

  for (const f of filas.slice(1)) {
    if (!f || (!f[idx('NOMBRE')] && !f[idx('TELEFONO')])) continue;
    const fecha = aFechaLocal(f[idx('FECHA')]);
    if (!fecha || fecha < desde) continue;

    // El Sheet mezcla "PAGADO"/"Pagado"/"DEVOLUCION"/"Devuelto": normalizar SIEMPRE.
    const estado = String(f[idx('ESTADO')] || '').toUpperCase().trim();
    const conMeta = Boolean(f[idx('FBC')] || f[idx('FBP')] || f[idx('FBCLID')]);

    const ingreso = (parseMonto(f[idx('ANTICIPO')]) || 0) + (parseMonto(f[idx('SALDO')]) || 0);
    const envio = parseMonto(f[idx('ENVIO')]) || 0;
    const utilidad = parseMonto(f[idx('UTILIDAD')]) || 0;

    // Una devolución cuesta el envío de ida MÁS $1 por caja: vuelve aplastada y
    // hay que reponerla antes de revender. El juego en sí no se pierde (es stock
    // propio), por eso los COSTOS no entran.
    const cajas = COLUMNAS_CANTIDAD.reduce((n, c) => n + (parseMonto(f[idx(c)]) || 0), 0);
    const perdidaSiSeDevuelve = envio + cajas * COSTO_CAJA;

    porFecha[fecha] ||= { todas: vacio(), meta: vacio() };
    const cubos = conMeta ? [porFecha[fecha].todas, porFecha[fecha].meta] : [porFecha[fecha].todas];

    for (const d of cubos) {
      if (en(ESTADOS.devueltos, estado)) {
        d.devueltos += 1;
        d.perdidaDevueltos += perdidaSiSeDevuelve;
        continue;
      }
      d.ventas += 1;
      d.ingreso += ingreso;
      if (en(ESTADOS.entregados, estado)) {
        d.entregados += 1;
        d.margenEntregados += utilidad;
      } else if (en(ESTADOS.pendientes, estado)) {
        d.margenPendientes += utilidad;
        // Mismo criterio para lo que todavía no se sabe: si se devuelve, cuesta
        // envío + cajas. Es lo que multiplica el % de devolución esperada.
        d.fletePendientes += perdidaSiSeDevuelve;
      }
    }
  }
  return porFecha;
}

const usd = (n) => Math.round(n * 100) / 100;

/** Una fila por día. Las columnas de "todas" y "meta" van lado a lado. */
function calcularFilas({ gastoPorFecha, pedidosPorFecha, desde }) {
  const fechas = [...new Set([...Object.keys(gastoPorFecha), ...Object.keys(pedidosPorFecha)])]
    .filter((f) => f >= desde).sort();
  const vacio = { ventas: 0, ingreso: 0, entregados: 0, devueltos: 0, margenEntregados: 0, perdidaDevueltos: 0, margenPendientes: 0, fletePendientes: 0 };
  const filas = [];

  for (const fecha of fechas) {
    const gasto = gastoPorFecha[fecha] || 0;
    const { todas = vacio, meta = vacio } = pedidosPorFecha[fecha] || {};
    if (gasto === 0 && todas.ventas === 0 && todas.devueltos === 0) continue;

    filas.push([
      fecha,
      usd(gasto), usd(gasto * COMISION_BANCARIA),
      todas.ventas, usd(todas.ingreso), todas.entregados, todas.devueltos,
      usd(todas.margenEntregados), usd(todas.perdidaDevueltos), usd(todas.margenPendientes), usd(todas.fletePendientes),
      meta.ventas, usd(meta.ingreso), meta.entregados, meta.devueltos,
      usd(meta.margenEntregados), usd(meta.perdidaDevueltos), usd(meta.margenPendientes), usd(meta.fletePendientes),
      etiquetaSemana(fecha), fecha.slice(0, 7),
    ]);
  }
  return filas;
}

async function escribirDatos(filas) {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${HOJA_DATOS}!A2:U2000` });
  if (filas.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID, range: `${HOJA_DATOS}!A2`,
      valueInputOption: 'RAW', requestBody: { values: filas }
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: 'PUBLICIDAD!B2',
    valueInputOption: 'RAW',
    requestBody: { values: [[new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })]] }
  });
}

async function correr() {
  if (!SHEET_ID) throw new Error('Falta SHEETS_ID en .env');
  // OJO: el token de Shotygames es META_CAPI_TOKEN, no META_ADS_TOKEN (otro business).
  const token = process.env.META_CAPI_TOKEN;
  if (!token) throw new Error('Falta META_CAPI_TOKEN en .env (es el que lee la cuenta de Shotygames)');

  const hoy = hoyEC();
  const desde = inicioDelAnio();
  const gastoPorFecha = await gastoDiario(token, { desde, hasta: hoy });
  const pedidosPorFecha = await pedidosDiarios({ desde });
  const filas = calcularFilas({ gastoPorFecha, pedidosPorFecha, desde });

  await escribirDatos(filas);
  console.log(`Listo — ${filas.length} días desde ${desde}.`);
}

module.exports = { correr, gastoDiario, pedidosDiarios, calcularFilas, escribirDatos, diasAtras, inicioDelAnio };

if (require.main === module) {
  correr().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
}
