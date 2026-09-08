#!/usr/bin/env node
/**
 * sheets-cli.js — Leer y escribir cualquier Google Sheet desde la terminal.
 *
 * Usa las MISMAS credenciales OAuth2 que el agente Shotygames (sheets.js).
 * Requiere en .env:  GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET · GOOGLE_REFRESH_TOKEN
 *
 * Uso:
 *   node scripts/sheets-cli.js tabs   <sheetId>
 *   node scripts/sheets-cli.js read   <sheetId> "<Hoja!A1:D20>"
 *   node scripts/sheets-cli.js write  <sheetId> "<Hoja!B5>"  '[["valor"]]'
 *   node scripts/sheets-cli.js append <sheetId> "<Hoja!A:L>" '[["2026-09-08","Coco s/alcohol",2]]'
 *   node scripts/sheets-cli.js clear  <sheetId> "<Hoja!A5:L500>"
 *
 * Las formulas se escriben tal cual: '[["=SUM(A1:A9)"]]'
 * Los valores van SIEMPRE como JSON de array de filas.
 */
require('dotenv').config();
const { google } = require('googleapis');

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error(`
FALTAN CREDENCIALES EN .env

Copialas desde EasyPanel (servicio del agente Shotygames > Environment):
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  GOOGLE_REFRESH_TOKEN=...

El .env ya esta en .gitignore, no se sube a GitHub.
`);
  process.exit(1);
}

function client() {
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth });
}

async function main() {
  const [cmd, sheetId, range, json] = process.argv.slice(2);
  if (!cmd || !sheetId) {
    console.error('Uso: node scripts/sheets-cli.js <tabs|read|write|append|clear> <sheetId> [rango] [valoresJSON]');
    process.exit(1);
  }
  const sheets = client();

  if (cmd === 'tabs') {
    const { data } = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    console.log(`\n${data.properties.title}\n`);
    data.sheets.forEach((s) => {
      const p = s.properties;
      console.log(`  ${p.title.padEnd(20)} ${p.gridProperties.rowCount} filas x ${p.gridProperties.columnCount} cols`);
    });
    return;
  }

  if (cmd === 'read') {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId, range,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    console.log(JSON.stringify(data.values || [], null, 2));
    return;
  }

  if (cmd === 'write') {
    const { data } = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId, range,
      valueInputOption: 'USER_ENTERED',   // interpreta formulas y fechas
      requestBody: { values: JSON.parse(json) },
    });
    console.log(`OK  ${data.updatedCells} celdas actualizadas en ${data.updatedRange}`);
    return;
  }

  if (cmd === 'append') {
    const { data } = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId, range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: JSON.parse(json) },
    });
    console.log(`OK  fila(s) agregada(s) en ${data.updates.updatedRange}`);
    return;
  }

  if (cmd === 'clear') {
    const { data } = await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range });
    console.log(`OK  limpiado ${data.clearedRange}`);
    return;
  }

  console.error(`Comando desconocido: ${cmd}`);
  process.exit(1);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  if (String(e.message).includes('invalid_grant')) {
    console.error('El refresh token expiro o fue revocado. Regenerar con: node scripts/reauth-google.js url');
  }
  process.exit(1);
});
