/**
 * Arma la hoja PUBLICIDAD dentro de "2026 REGISTRO DE VENTAS" (Shotygames).
 *
 *   node projects/publicidad-shotygames/sheet.js
 *
 * Mismas columnas que la de dropshipping, con dos diferencias que salen de los
 * datos reales (ver config.js):
 *
 *  - NO hay filtro por producto: las 2 campañas activas son transversales y el
 *    Sheet no liga pedido→campaña, así que repartir el gasto sería inventado.
 *  - SÍ hay un selector "Ventas a contar" (F2), porque solo el 42% de los
 *    pedidos trae atribución de Meta; el resto es WhatsApp orgánico y recompra.
 *    Contarlos todos contra el gasto hace ver el CPA mejor de lo que es.
 *
 * Correr de nuevo es seguro: reescribe el layout, conserva los selectores.
 *
 * ⚠️ SEPARADOR DE FÓRMULAS SEGÚN EL LOCALE (2026-09-01)
 * Este Sheet está en **es_ES**; el de dropshipping en **en_US**. En locale
 * español el separador de argumentos de fórmula es **;** y no **,** — con coma
 * hasta un `=IF(a,b,c)` devuelve #ERROR!. Por eso el separador se lee del
 * spreadsheet y se arma con `SEP`, en vez de hardcodearlo.
 *
 * OJO: las comas DENTRO del string del QUERY ("select A, sum(B)...") son parte
 * del lenguaje de consulta, NO argumentos de fórmula: esas quedan como coma
 * siempre, en cualquier locale.
 */
require('dotenv').config();
const { google } = require('googleapis');

const SHEET_ID = process.env.SHEETS_ID;
const HOJA = 'PUBLICIDAD';
const HOJA_DATOS = 'PUBLICIDAD_DATOS';

const FILAS = 500;
const NAVY = { red: 0.10, green: 0.16, blue: 0.29 };
const BLANCO = { red: 1, green: 1, blue: 1 };
const GRIS = { red: 0.95, green: 0.95, blue: 0.96 };
const AMBAR = { red: 0.99, green: 0.95, blue: 0.84 };
const MONEDA = '"$"#,##0.00', ENTERO = '#,##0', ROAS = '0.00"x"', PCT = '0.0%';

function getAuth() {
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'urn:ietf:wg:oauth:2.0:oob');
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

// Columna de agrupación según "Ver por" (D2): A=día, T=semana, U=mes. Vive en W2 (oculta).
const colAgrup = (SEP) => `=IF($D$2="SEMANA"${SEP}"T"${SEP}IF($D$2="MES"${SEP}"U"${SEP}"A"))`;

/**
 * Trae TODAS las sumas (bloque "todas" D..K y bloque "solo Meta" L..S) y deja
 * que las columnas visibles elijan cuál mostrar según F2.
 *
 * Se probó primero armar el `select` dinámicamente según F2 y fue un error: la
 * fórmula quedaba ilegible y devolvía #ERROR. Traer las dos y elegir después es
 * más simple y no se rompe.
 *
 * Sale en X6 y ocupa X:AP (ocultas). Orden: periodo, gasto, gastoReal,
 * [ventas, ingreso, entregados, devueltos, margenEnt, perdidaDev, margenPend, fletePend] x2
 */
const queryHelper = (SEP) =>
  `=IFERROR(QUERY(PUBLICIDAD_DATOS!A2:U${SEP} `
  + `"select "&$W$2&", sum(B), sum(C), sum(D), sum(E), sum(F), sum(G), sum(H), sum(I), sum(J), sum(K), sum(L), sum(M), sum(N), sum(O), sum(P), sum(Q), sum(R), sum(S) `
  + `where A is not null group by "&$W$2&" order by "&$W$2&" asc `
  + `label sum(B) '', sum(C) '', sum(D) '', sum(E) '', sum(F) '', sum(G) '', sum(H) '', sum(I) '', sum(J) '', sum(K) '', sum(L) '', sum(M) '', sum(N) '', sum(O) '', sum(P) '', sum(Q) '', sum(R) '', sum(S) ''"${SEP} 0)${SEP} "")`;

async function idDeHoja(sheets, titulo) {
  const { data } = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const h = data.sheets.find((s) => s.properties.title === titulo);
  return h ? h.properties.sheetId : null;
}

async function asegurarHoja(sheets, titulo, { filas, columnas, oculta = false }) {
  let id = await idDeHoja(sheets, titulo);
  if (id === null) {
    const { data } = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: titulo, hidden: oculta, gridProperties: { rowCount: filas, columnCount: columnas } } } }] }
    });
    id = data.replies[0].addSheet.properties.sheetId;
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ updateSheetProperties: { properties: { sheetId: id, hidden: oculta, gridProperties: { rowCount: filas, columnCount: columnas } }, fields: 'hidden,gridProperties(rowCount,columnCount)' } }] }
    });
  }
  return id;
}

async function main() {
  if (!SHEET_ID) throw new Error('Falta SHEETS_ID en .env');
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });

  // El separador de fórmulas depende del locale del Sheet: "," en en_US, ";" en es_*.
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'properties.locale' });
  const locale = meta.data.properties.locale || 'en_US';
  const SEP = locale.startsWith('es') ? ';' : ',';
  console.log(`Locale del Sheet: ${locale} → separador de fórmulas "${SEP}"`);

  const idVista = await asegurarHoja(sheets, HOJA, { filas: FILAS, columnas: 42 });
  await asegurarHoja(sheets, HOJA_DATOS, { filas: 2000, columnas: 21, oculta: true });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: `${HOJA_DATOS}!A1`, valueInputOption: 'RAW',
    requestBody: { values: [[
      'FECHA', 'GASTO', 'GASTO REAL',
      'VENTAS', 'INGRESO', 'ENTREGADOS', 'DEVUELTOS', 'MARGEN ENT', 'PERDIDA DEV', 'MARGEN PEND', 'FLETE PEND',
      'M_VENTAS', 'M_INGRESO', 'M_ENTREGADOS', 'M_DEVUELTOS', 'M_MARGEN ENT', 'M_PERDIDA DEV', 'M_MARGEN PEND', 'M_FLETE PEND',
      'SEMANA', 'MES'
    ]] }
  });

  // Conservar lo que Fabián tenga elegido
  let verPor = 'DÍA', ventas = 'TODAS', devol = 0.10;
  try {
    const p = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${HOJA}!D2:J2` });
    const f = p.data.values?.[0] || [];
    if (f[0]) verPor = f[0];
    if (f[2]) ventas = f[2];
    if (typeof f[6] === 'number') devol = f[6];
  } catch { /* hoja nueva */ }

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${HOJA}!A1:AP${FILAS}` });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: `${HOJA}!A1`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [
      ['PUBLICIDAD SHOTYGAMES — gasto real vs ventas reales · desde enero', '', '', '', '', '', '', '', '', '', ''],
      ['Actualizado:', '', 'Ver por:', verPor, 'Ventas a contar:', ventas, '% devolución esperada:', devol, '', '', ''],
      ['TOTAL PERÍODO',
        `=SUM($B$6:$B$${FILAS})`, `=SUM($C$6:$C$${FILAS})`, `=SUM($D$6:$D$${FILAS})`,
        `=SUM($E$6:$E$${FILAS})`, `=SUM($F$6:$F$${FILAS})`,
        `=IF($E$3+$F$3=0${SEP}""${SEP}$F$3/($E$3+$F$3))`,
        `=IF($D$3=0${SEP}""${SEP}$C$3/$D$3)`,
        `=IF($C$3=0${SEP}""${SEP}SUM(IF($F$2="SOLO META"${SEP}$AJ$6:$AJ$${FILAS}${SEP}$AB$6:$AB$${FILAS}))/$C$3)`,
        `=SUM($J$6:$J$${FILAS})`, `=SUM($K$6:$K$${FILAS})`],
      ['', '', '', '', '', '', '', '', '', '', ''],
      [`=IF($D$2="SEMANA"${SEP}"SEMANA (lun-dom)"${SEP}IF($D$2="MES"${SEP}"MES"${SEP}"FECHA"))`,
        'GASTO', 'GASTO REAL (+20%)', 'VENTAS REALES', 'ENTREGADOS', 'DEVUELTOS',
        '% DEVOLUCIONES', 'CPA REAL', 'ROAS REAL', 'UTILIDAD SI SE ENTREGA TODO', 'UTILIDAD AJUSTADA (%DEV)'],
      // El QUERY deja en X:AP -> X=periodo, Y=gasto, Z=gastoReal,
      // bloque TODAS  : AA=ventas AB=ingreso AC=entreg AD=devue AE=margenEnt AF=perdDev AG=margenPend AH=fletePend
      // bloque METAxx : AI=ventas AJ=ingreso AK=entreg AL=devue AM=margenEnt AN=perdDev AO=margenPend AP=fletePend
      // F2 elige el bloque. El gasto (Y,Z) es el mismo en los dos casos.
      [
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}$X$6:$X$${FILAS}))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}$Y$6:$Y$${FILAS}))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}$Z$6:$Z$${FILAS}))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}IF($F$2="SOLO META"${SEP}$AI$6:$AI$${FILAS}${SEP}$AA$6:$AA$${FILAS})))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}IF($F$2="SOLO META"${SEP}$AK$6:$AK$${FILAS}${SEP}$AC$6:$AC$${FILAS})))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}IF($F$2="SOLO META"${SEP}$AL$6:$AL$${FILAS}${SEP}$AD$6:$AD$${FILAS})))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}IF($E$6:$E$${FILAS}+$F$6:$F$${FILAS}=0${SEP}""${SEP}$F$6:$F$${FILAS}/($E$6:$E$${FILAS}+$F$6:$F$${FILAS}))))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}IF($D$6:$D$${FILAS}=0${SEP}""${SEP}$C$6:$C$${FILAS}/$D$6:$D$${FILAS})))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}IF($C$6:$C$${FILAS}=0${SEP}""${SEP}IF($F$2="SOLO META"${SEP}$AJ$6:$AJ$${FILAS}${SEP}$AB$6:$AB$${FILAS})/$C$6:$C$${FILAS})))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}IF($F$2="SOLO META"${SEP}$AM$6:$AM$${FILAS}-$AN$6:$AN$${FILAS}+$AO$6:$AO$${FILAS}${SEP}$AE$6:$AE$${FILAS}-$AF$6:$AF$${FILAS}+$AG$6:$AG$${FILAS})-$C$6:$C$${FILAS}))`,
        `=ARRAYFORMULA(IF($X$6:$X$${FILAS}=""${SEP}""${SEP}IF($F$2="SOLO META"${SEP}$AM$6:$AM$${FILAS}-$AN$6:$AN$${FILAS}+((1-$H$2)*$AO$6:$AO$${FILAS})-($H$2*$AP$6:$AP$${FILAS})${SEP}$AE$6:$AE$${FILAS}-$AF$6:$AF$${FILAS}+((1-$H$2)*$AG$6:$AG$${FILAS})-($H$2*$AH$6:$AH$${FILAS}))-$C$6:$C$${FILAS}))`,
      ],
    ] }
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: [
      { range: `${HOJA}!W2`, values: [[colAgrup(SEP)]] },
      { range: `${HOJA}!X6`, values: [[queryHelper(SEP)]] },
    ] }
  });

  const col = (i) => ({ sheetId: idVista, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 });
  const rango = (r0, r1, c0, c1) => ({ sheetId: idVista, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 });
  const fmt = (r0, r1, c0, c1, pattern) => ({ repeatCell: { range: rango(r0, r1, c0, c1), cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern } } }, fields: 'userEnteredFormat.numberFormat' } });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: [
      { unmergeCells: { range: rango(0, 1, 0, 11) } },
      { mergeCells: { range: rango(0, 1, 0, 11), mergeType: 'MERGE_ROWS' } },
      { repeatCell: { range: rango(0, 1, 0, 11), cell: { userEnteredFormat: { backgroundColor: NAVY, textFormat: { bold: true, fontSize: 12, foregroundColor: BLANCO }, horizontalAlignment: 'LEFT', padding: { left: 8 } } }, fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,padding)' } },
      { repeatCell: { range: rango(1, 2, 0, 11), cell: { userEnteredFormat: { backgroundColor: AMBAR, textFormat: { bold: true } } }, fields: 'userEnteredFormat(backgroundColor,textFormat)' } },
      { repeatCell: { range: rango(2, 3, 0, 11), cell: { userEnteredFormat: { backgroundColor: GRIS, textFormat: { bold: true }, borders: { bottom: { style: 'SOLID_MEDIUM' } } } }, fields: 'userEnteredFormat(backgroundColor,textFormat,borders)' } },
      { repeatCell: { range: rango(4, 5, 0, 11), cell: { userEnteredFormat: { backgroundColor: NAVY, textFormat: { bold: true, foregroundColor: BLANCO }, horizontalAlignment: 'CENTER', wrapStrategy: 'WRAP' } }, fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy)' } },

      fmt(2, 3, 1, 3, MONEDA), fmt(2, 3, 3, 6, ENTERO), fmt(2, 3, 6, 7, PCT), fmt(2, 3, 7, 8, MONEDA), fmt(2, 3, 8, 9, ROAS), fmt(2, 3, 9, 11, MONEDA),
      fmt(5, FILAS, 1, 3, MONEDA), fmt(5, FILAS, 3, 6, ENTERO), fmt(5, FILAS, 6, 7, PCT), fmt(5, FILAS, 7, 8, MONEDA), fmt(5, FILAS, 8, 9, ROAS), fmt(5, FILAS, 9, 11, MONEDA),

      // H2 = % devolución editable
      { repeatCell: { range: rango(1, 2, 7, 8), cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0%' }, borders: { top: { style: 'SOLID_MEDIUM', color: NAVY }, bottom: { style: 'SOLID_MEDIUM', color: NAVY }, left: { style: 'SOLID_MEDIUM', color: NAVY }, right: { style: 'SOLID_MEDIUM', color: NAVY } } } }, fields: 'userEnteredFormat(numberFormat,borders)' } },

      { setDataValidation: { range: rango(1, 2, 3, 4), rule: { condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'DÍA' }, { userEnteredValue: 'SEMANA' }, { userEnteredValue: 'MES' }] }, showCustomUi: true, strict: true } } },
      { setDataValidation: { range: rango(1, 2, 5, 6), rule: { condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'TODAS' }, { userEnteredValue: 'SOLO META' }] }, showCustomUi: true, strict: true,
        inputMessage: 'TODAS = todos los pedidos del Sheet (incluye WhatsApp orgánico y recompra).\n\nSOLO META = solo los que traen atribución de Meta (fbc/fbp). OJO: la captura de fbc/fbp arrancó en AGOSTO 2026 — antes de eso no hay ninguno, así que enero-julio salen en cero y esta vista solo sirve de agosto en adelante.' } } },
      { setDataValidation: { range: rango(1, 2, 7, 8), rule: { condition: { type: 'NUMBER_BETWEEN', values: [{ userEnteredValue: '0' }, { userEnteredValue: '1' }] }, inputMessage: 'Número entre 0 y 1 (ej. 0.1 = 10% de devolución esperada)', strict: true } } },

      ...[175, 100, 150, 125, 110, 105, 135, 100, 100, 150, 150].map((px, i) => ({ updateDimensionProperties: { range: col(i), properties: { pixelSize: px }, fields: 'pixelSize' } })),
      { updateDimensionProperties: { range: { sheetId: idVista, dimension: 'COLUMNS', startIndex: 0, endIndex: 11 }, properties: { hiddenByUser: false }, fields: 'hiddenByUser' } },
      { updateDimensionProperties: { range: { sheetId: idVista, dimension: 'COLUMNS', startIndex: 11, endIndex: 42 }, properties: { hiddenByUser: true }, fields: 'hiddenByUser' } },
      { updateSheetProperties: { properties: { sheetId: idVista, gridProperties: { frozenRowCount: 5 } }, fields: 'gridProperties.frozenRowCount' } },
    ] }
  });

  console.log(`Listo. Hoja ${HOJA} de Shotygames armada.`);
  console.log('Los datos los llena: node projects/publicidad-shotygames/live.js');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
