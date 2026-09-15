/**
 * Prepara "PEDIDOS LOVABLE" para la pantalla de recuperación. Se corre UNA vez.
 *
 * Hace tres cosas y ninguna toca nada de lo que ya existe:
 *
 *   1. Agrega `FRENADO` a la lista de estados (`DATOS!C6`, la primera celda
 *      libre del rango). La validación de la columna ESTADO ya apunta a
 *      `DATOS!$C$2:$C$19`, así que NO hay que tocar la validación.
 *   2. Agrega las columnas `LOG WA` y `NOTA RECUP` al FINAL de la hoja, después
 *      de DROPI DEVUELTOS. Ningún encabezado existente se mueve ni se renombra
 *      — regla de Fabián desde que n8n se rompió el 2026-08-20 por un
 *      encabezado vacío.
 *   3. Nada más. No escribe en ninguna fila de datos.
 *
 * Es idempotente: si el estado ya está en la lista o las columnas ya existen,
 * las saltea. Corré primero con --dry para ver qué haría.
 *
 * Uso:  node scripts/preparar-recuperacion.js [--dry]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
require('dotenv').config();

const { google } = require('googleapis');

const HOJA = 'PEDIDOS';
const RANGO_ESTADOS = 'DATOS!C2:C19';
const ESTADO_NUEVO = 'FRENADO';
const COLUMNAS_NUEVAS = ['LOG WA', 'NOTA RECUP'];

const DRY = process.argv.includes('--dry');

const letra = (i) => {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const normalizar = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

function getSheets() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Faltan las credenciales de Google en .env / .env.local');
  }
  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth });
}

async function main() {
  const id = process.env.SHEETS_ID_PEDIDOS_WEB;
  if (!id) throw new Error('Falta SHEETS_ID_PEDIDOS_WEB');
  const s = getSheets();

  if (DRY) console.log('— MODO DRY: no se escribe nada —\n');

  // ── 1. El estado nuevo ──────────────────────────────────────
  const est = await s.spreadsheets.values.get({ spreadsheetId: id, range: RANGO_ESTADOS });
  const actuales = (est.data.values ?? []).flat().map((v) => String(v ?? '').trim());
  const llenas = actuales.filter(Boolean);

  console.log('Estados hoy:', llenas.join(' / ') || '(ninguno)');

  if (llenas.some((v) => normalizar(v) === normalizar(ESTADO_NUEVO))) {
    console.log(`✓ "${ESTADO_NUEVO}" ya estaba en la lista`);
  } else {
    // La primera celda libre DENTRO del rango de la validación. Si el rango se
    // llenó, escribir más abajo dejaría el estado fuera del desplegable.
    const fila = 2 + llenas.length;
    if (fila > 19) {
      throw new Error(
        `${RANGO_ESTADOS} está lleno (${llenas.length} estados). Hay que ampliar el rango de ` +
          'la validación a mano antes de agregar otro.'
      );
    }
    console.log(`+ "${ESTADO_NUEVO}" en DATOS!C${fila}`);
    if (!DRY) {
      await s.spreadsheets.values.update({
        spreadsheetId: id,
        range: `DATOS!C${fila}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[ESTADO_NUEVO]] },
      });
    }
  }

  // ── 2. Las columnas de seguimiento ──────────────────────────
  const meta = await s.spreadsheets.get({ spreadsheetId: id });
  const tab = meta.data.sheets.find((x) => x.properties.title === HOJA);
  if (!tab) throw new Error(`La hoja no tiene una pestaña "${HOJA}"`);
  let columnCount = tab.properties.gridProperties.columnCount;

  const enc = await s.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${HOJA}!A1:${letra(columnCount - 1)}1`,
  });
  const titulos = (enc.data.values?.[0] ?? []).map(normalizar);

  const faltan = COLUMNAS_NUEVAS.filter((c) => !titulos.includes(normalizar(c)));
  if (!faltan.length) {
    console.log(`✓ ${COLUMNAS_NUEVAS.join(' y ')} ya existían`);
  } else {
    // Se escribe a partir de la última columna CON TÍTULO, no de columnCount:
    // la grilla suele tener columnas vacías de sobra y ahí el encabezado
    // quedaría separado del resto por un hueco.
    const inicio = titulos.length;
    const necesarias = inicio + faltan.length;

    if (necesarias > columnCount) {
      console.log(`  (ampliando la grilla ${columnCount} → ${necesarias} columnas)`);
      if (!DRY) {
        await s.spreadsheets.batchUpdate({
          spreadsheetId: id,
          requestBody: {
            requests: [
              {
                appendDimension: {
                  sheetId: tab.properties.sheetId,
                  dimension: 'COLUMNS',
                  length: necesarias - columnCount,
                },
              },
            ],
          },
        });
      }
      columnCount = necesarias;
    }

    faltan.forEach((c, i) => console.log(`+ columna "${c}" en ${letra(inicio + i)}1`));
    if (!DRY) {
      await s.spreadsheets.values.update({
        spreadsheetId: id,
        range: `${HOJA}!${letra(inicio)}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [faltan] },
      });
    }
  }

  console.log(DRY ? '\nNada se escribió (--dry).' : '\nListo.');
}

main().catch((e) => {
  console.error('\n❌ FALLÓ:', e.message);
  process.exit(1);
});
