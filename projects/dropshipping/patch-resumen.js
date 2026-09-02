/**
 * Reaplica la hoja RESUMEN sobre el Sheet de pedidos que YA está en uso.
 *
 * `crear-sheet-pedidos.js` crea un Sheet nuevo desde cero — no sirve para
 * actualizar el que está operando. Este script solo reescribe el bloque RESUMEN
 * con el layout vigente de `filasResumen()`, sin tocar la hoja PEDIDOS.
 *
 * Correr después de agregar o renombrar un ESTADO, si no las cuentas por estado
 * quedan incompletas y TOTAL PEDIDOS no cuadra.
 *
 * Uso:
 *   node projects/dropshipping/patch-resumen.js            # muestra el antes/después
 *   node projects/dropshipping/patch-resumen.js --aplicar  # escribe
 */
require('dotenv').config();
const { google } = require('googleapis');
const { filasResumen, formatosResumen, letrasDesdeEncabezado } = require('./crear-sheet-pedidos.js');

const SHEET_ID = process.env.SHEETS_ID_DROPSHIPPING;
const HOJA = 'RESUMEN';

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

async function main() {
  if (!SHEET_ID) throw new Error('Falta SHEETS_ID_DROPSHIPPING en .env');
  const aplicar = process.argv.includes('--aplicar');
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });

  // Las letras salen del encabezado REAL de PEDIDOS, no de constantes: al Sheet
  // en uso se le agregaron columnas después de crearlo y las fórmulas escritas a
  // mano quedaron apuntando a otra cosa.
  const enc = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'PEDIDOS!A1:AZ1' });
  const L = letrasDesdeEncabezado((enc.data.values || [[]])[0] || []);
  console.log('Columnas resueltas por título:',
    Object.entries(L).map(([k, v]) => `${k}=${v}`).join(' · '));

  const filas = filasResumen(L);

  // B4 es el filtro de tienda que Fabián haya dejado puesto: se conserva.
  const previo = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${HOJA}!A1:B40` });
  const antes = previo.data.values || [];
  const filtroTienda = (antes[3] || [])[1] || '';
  if (filtroTienda) filas[3][1] = filtroTienda;

  console.log(`Filtro de tienda actual: ${filtroTienda ? `"${filtroTienda}"` : '(vacío = todas)'}`);
  console.log(`\nFilas actuales: ${antes.length} · filas nuevas: ${filas.length}\n`);
  console.log('Estados que va a contar:');
  for (const f of filas.slice(6, 14)) console.log(`  · ${f[0]}`);

  if (!aplicar) {
    console.log('\n(simulación — nada escrito. Correr con --aplicar para escribir)');
    return;
  }

  // Se limpia primero: el bloque nuevo es más largo que el viejo y, si quedaran
  // filas del anterior debajo, se leerían como parte del resumen.
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${HOJA}!A1:B40` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${HOJA}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: filas }
  });

  // El formato NO viene con los valores: vive pegado a la celda. Si el contenido
  // se corre de fila y el formato no se reaplica, cada celda hereda el de la
  // fila que ocupaba antes (un conteo con formato de porcentaje = "5400.0%").
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const idHoja = meta.data.sheets.find((s) => s.properties.title === HOJA)?.properties.sheetId;
  if (idHoja === undefined) throw new Error(`No existe la hoja ${HOJA}`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: formatosResumen(idHoja) }
  });

  console.log('\nRESUMEN actualizado (contenido y formato).');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
