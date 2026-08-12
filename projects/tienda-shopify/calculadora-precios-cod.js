/**
 * Crea la "Calculadora de Precios COD Ecuador" en un Google Sheet nuevo.
 * Adaptada a Shotygames: USD (no COP), envío ya incluido en el precio
 * (no lo paga el cliente aparte), plataforma COD = Releasit.
 *
 * Uso: node projects/tienda-shopify/calculadora-precios-cod.js
 *
 * Los números en amarillo son EDITABLES — son placeholders de ejemplo,
 * no datos reales de Fabián. Todo lo demás se recalcula solo.
 *
 * Layout explícito por número de fila (evita desfases entre fórmulas
 * y formato — la versión anterior tenía ese bug):
 *
 *   Izquierda (B/C/D)              Derecha (F/G)
 *   4  Header costos               4  Header resultados
 *   5  COGS                        5  Precio de venta      =C23
 *   6  Empaque                     6  − Costo producto     =-C8
 *   7  Insumos                     7  − Logística           =-C15
 *   8  Costo total producto        8  − Comisión COD        =-(C23*C14)
 *   9  (vacío)                     9  − CAC                 =-C18
 *   10 Header logística            10 GANANCIA POR UNIDAD   =SUM(G5:G9)
 *   11 Flete envío                 11 (vacío)
 *   12 Flete devolución RTO        12 Header métricas
 *   13 Tasa devolución %           13 Margen neto %
 *   14 Comisión Releasit %         14 Múltiplo sobre COGS
 *   15 Costo logístico ponderado   15 ROAS implícito
 *   16 (vacío)                     16 Break-even mensual
 *   17 Header marketing            17 (vacío)
 *   18 CAC                         18 Header semáforo
 *   19 Presupuesto mensual ads     19 Estado del precio
 *   20 ROAS objetivo               20 (vacío)
 *   21 (vacío)                     21 Header precios mínimos
 *   22 Header precio de venta      22 Precio break-even exacto
 *   23 PRECIO DE VENTA             23 Precio con margen 15%
 *   24 (vacío)                     24 Precio con margen 25%
 *   25 (vacío)                     25 Precio con margen 35%
 */

require('dotenv').config();
const { google } = require('googleapis');

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

// Paleta
const NAVY = { red: 0.10, green: 0.16, blue: 0.29 };
const GOLD = { red: 0.79, green: 0.64, blue: 0.15 };
const AMARILLO = { red: 1, green: 0.95, blue: 0.75 };
const GRIS = { red: 0.93, green: 0.93, blue: 0.94 };
const BLANCO = { red: 1, green: 1, blue: 1 };

async function crear() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('Creando spreadsheet...');
  const { data: ss } = await sheets.spreadsheets.create({
    requestBody: {
      // en_US: fórmulas usan "." como decimal — es_EC rompe las fórmulas con decimales
      properties: { title: 'Shotygames — Calculadora de Precios COD Ecuador', locale: 'en_US' },
      sheets: [{ properties: { title: 'Calculadora', gridProperties: { rowCount: 27, columnCount: 8 } } }],
    },
  });
  const spreadsheetId = ss.spreadsheetId;
  const sheetId = ss.sheets[0].properties.sheetId;
  console.log(`✅ ${ss.spreadsheetUrl}`);

  // ── Construcción por número de fila explícito (1-indexado, como en Sheets) ──
  const TOTAL_FILAS = 25;
  const filas = Array.from({ length: TOTAL_FILAS }, () => ['', '', '', '', '', '', '']);
  // set(fila, {B,C,D,F,G}) — columnas B..H mapeadas a índices 0..4 dentro de cada array
  // (el array representa el rango B:H, así B=idx0, C=idx1, D=idx2, E=idx3, F=idx4, G=idx5)
  const set = (fila, { B, C, D, F, G } = {}) => {
    const r = filas[fila - 1];
    if (B !== undefined) r[0] = B;
    if (C !== undefined) r[1] = C;
    if (D !== undefined) r[2] = D;
    if (F !== undefined) r[4] = F;
    if (G !== undefined) r[5] = G;
  };

  set(1, { B: 'SHOTYGAMES — CALCULADORA DE PRECIOS COD ECUADOR' });
  set(2, { B: 'Modelo Contraentrega (COD) · Envío incluido en el precio · Escalado con Meta Ads' });

  set(4, { B: '💰 COSTOS DEL PRODUCTO', F: '💵 RESULTADOS POR UNIDAD' });
  set(5, { B: 'COGS (fabricación + empaque)', C: 10, D: '✏️ EDITABLE — pon tu costo real de producción', F: 'Precio de venta', G: '=C23' });
  set(6, { B: 'Caja / empaque adicional', C: 1, D: '✏️ Editable', F: '− Costo producto', G: '=-C8' });
  set(7, { B: 'Insumos extra (vaso, dado, etc.)', C: 0.5, D: '✏️ Editable si aplica', F: '− Logística ponderada', G: '=-C15' });
  set(8, { B: 'Costo total de producto', C: '=C5+C6+C7', D: 'Auto-calculado', F: '− Comisión COD (Releasit)', G: '=-(C23*C14)' });
  set(9, { F: '− CAC (Meta Ads)', G: '=-C18' });

  set(10, { B: '🚚 LOGÍSTICA COD', F: 'GANANCIA POR UNIDAD', G: '=SUM(G5:G9)' });
  set(11, { B: 'Flete de envío (Shotygames lo asume)', C: 5, D: '✏️ Editable — antes se lo cobrabas al cliente aparte' });
  set(12, { B: 'Flete de devolución (RTO)', C: 5, D: '✏️ Editable — si el pedido no se entrega, este costo también lo asumes', F: '📊 MÉTRICAS DE RENTABILIDAD' });
  set(13, { B: 'Tasa de devolución RTO (%)', C: 0.2, D: '✏️ Ecuador COD prom. 15-30% — AJUSTA con tus datos reales de DROPI', F: 'Margen neto (%)', G: '=IFERROR(G10/C23,0)' });
  set(14, { B: 'Comisión Releasit / plataforma COD (%)', C: 0.025, D: '✏️ Confirma tu tarifa real con Releasit', F: 'Múltiplo sobre COGS', G: '=IFERROR(C23/C8,0)' });
  set(15, { B: 'Costo logístico ponderado', C: '=C11+C12*C13', D: 'Auto-calculado: incluye riesgo de devolución', F: 'ROAS implícito (precio/CAC)', G: '=IFERROR(C23/C18,0)' });
  set(16, { F: 'Break-even mensual (unidades)', G: '=IFERROR(C19/MAX(G10,0.01),0)' });

  set(17, { B: '📣 MARKETING & ADS' });
  set(18, { B: 'CAC — costo de adquisición (Meta Ads)', C: 6, D: '✏️ Ajusta según tu CPA real de campañas', F: '🚦 SEMÁFORO DE PRECIO' });
  set(19, { B: 'Presupuesto mensual de ads', C: 300, D: '✏️ Editable — para calcular unidades necesarias', F: 'Estado del precio', G: '=IF(G13>=0.25,"🟢 SANO — buen margen",IF(G13>=0.15,"🟡 ACEPTABLE — optimiza CAC o logística","🔴 BAJO — sube precio o baja costos"))' });
  set(20, { B: 'ROAS objetivo', C: 3.5, D: '✏️ Mínimo 3x para escalar sano' });

  set(21, { F: '📉 PRECIOS MÍNIMOS RECOMENDADOS' });
  set(22, { B: '🎯 PRECIO DE VENTA', G: '=($C$8+$C$15+$C$18)/(1-$C$14)', F: 'Precio break-even exacto' });
  set(23, { B: 'PRECIO DE VENTA (ajusta aquí)', C: 28, D: '✏️ EDITABLE — todo el sheet se recalcula solo', F: 'Precio con margen 15%', G: '=($C$8+$C$15+$C$18)/(1-$C$14-0.15)' });
  set(24, { F: 'Precio con margen 25%', G: '=($C$8+$C$15+$C$18)/(1-$C$14-0.25)' });
  set(25, { F: 'Precio con margen 35%', G: '=($C$8+$C$15+$C$18)/(1-$C$14-0.35)' });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Calculadora!B1:H${TOTAL_FILAS}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: filas },
  });

  // ── Formato ──────────────────────────────────────────────────
  // Índices ABSOLUTOS de columna (A=0,B=1,C=2,D=3,E=4,F=5,G=6,H=7) —
  // nombrados para no repetir la confusión relativo-vs-absoluto de antes.
  const COL = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7 };

  const req = [];
  const R = (n) => n - 1; // fila 1-indexada -> rowIndex 0-indexado para la API

  const merge = (fila1, c1, fila2, c2) => req.push({
    mergeCells: { range: { sheetId, startRowIndex: R(fila1), endRowIndex: R(fila2) + 1, startColumnIndex: c1, endColumnIndex: c2 }, mergeType: 'MERGE_ALL' },
  });
  // fmt() de uso único por celda (nadie más la vuelve a tocar): mask completa OK.
  const fmt = (fila1, c1, fila2, c2, cell) => req.push({
    repeatCell: { range: { sheetId, startRowIndex: R(fila1), endRowIndex: R(fila2) + 1, startColumnIndex: c1, endColumnIndex: c2 }, cell, fields: 'userEnteredFormat' },
  });
  // patch() para celdas que reciben MÁS de una llamada de formato (ej. color de
  // fondo en una pasada y formato numérico en otra): la fields mask es parcial,
  // así que cada llamada solo pisa su propio sub-campo y no borra al resto.
  // (bug real de la primera versión: dos fmt() con mask completa sobre la misma
  // celda hacían que la segunda llamada borrara el fondo puesto por la primera)
  const patch = (fila1, c1, fila2, c2, cell, campos) => req.push({
    repeatCell: { range: { sheetId, startRowIndex: R(fila1), endRowIndex: R(fila2) + 1, startColumnIndex: c1, endColumnIndex: c2 }, cell, fields: campos.map((c) => `userEnteredFormat.${c}`).join(',') },
  });
  const fmtCol = (fila, col, cell) => fmt(fila, COL[col], fila, COL[col] + 1, cell);
  const patchCol = (fila, col, cell, campos) => patch(fila, COL[col], fila, COL[col] + 1, cell, campos);

  // Título y subtítulo (nadie más las toca — fmt con mask completa está bien)
  merge(1, COL.B, 1, COL.H + 1);
  fmt(1, COL.B, 1, COL.H + 1, { userEnteredFormat: { backgroundColor: NAVY, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { foregroundColor: BLANCO, bold: true, fontSize: 15 } } });
  merge(2, COL.B, 2, COL.H + 1);
  fmt(2, COL.B, 2, COL.H + 1, { userEnteredFormat: { backgroundColor: GOLD, horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { foregroundColor: NAVY, bold: true, fontSize: 10 } } });

  // Headers de sección (nadie más las toca)
  [4, 10, 17, 22].forEach((f) => { merge(f, COL.B, f, COL.D + 1); fmt(f, COL.B, f, COL.D + 1, { userEnteredFormat: { backgroundColor: NAVY, textFormat: { foregroundColor: BLANCO, bold: true }, verticalAlignment: 'MIDDLE' } }); });
  [4, 12, 18, 21].forEach((f) => { merge(f, COL.F, f, COL.G + 1); fmt(f, COL.F, f, COL.G + 1, { userEnteredFormat: { backgroundColor: NAVY, textFormat: { foregroundColor: BLANCO, bold: true }, verticalAlignment: 'MIDDLE' } }); });

  // Celdas editables (fondo amarillo) — columna C. Todas reciben DESPUÉS un
  // formato numérico (moneda/%/x), así que van con patch(), solo 'backgroundColor'.
  [5, 6, 7, 11, 12, 13, 14, 18, 19, 20].forEach((f) => patchCol(f, 'C', { userEnteredFormat: { backgroundColor: AMARILLO } }, ['backgroundColor']));
  // Precio de venta: label (B23, nadie más la toca) + valor (C23, sí recibe moneda después)
  fmtCol(23, 'B', { userEnteredFormat: { backgroundColor: AMARILLO, textFormat: { bold: true, fontSize: 12 } } });
  patchCol(23, 'C', { userEnteredFormat: { backgroundColor: AMARILLO, textFormat: { bold: true, fontSize: 12 } } }, ['backgroundColor', 'textFormat']);

  // Totales auto-calculados (fondo gris, bold) — columna C. También reciben moneda después.
  [8, 15].forEach((f) => patchCol(f, 'C', { userEnteredFormat: { backgroundColor: GRIS, textFormat: { bold: true } } }, ['backgroundColor', 'textFormat']));

  // Ganancia por unidad: label F10 (nadie más la toca) + valor G10 (recibe moneda después)
  fmtCol(10, 'F', { userEnteredFormat: { backgroundColor: GRIS, textFormat: { bold: true, fontSize: 12 } } });
  patchCol(10, 'G', { userEnteredFormat: { backgroundColor: GRIS, textFormat: { bold: true, fontSize: 12 } } }, ['backgroundColor', 'textFormat']);

  // Estado del precio (G19): nadie más la toca (no está en las listas de formato numérico)
  fmtCol(19, 'G', { userEnteredFormat: { horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { bold: true } } });

  // ── Formatos numéricos — van todos con patch(), solo tocan 'numberFormat' ──
  const moneda = { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } };
  const pct = { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.0%' } } };
  const multiplo = { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '0.0"x"' } } };
  const unidades = { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '0 "uds/mes"' } } };
  const soloNumero = ['numberFormat'];

  // Columna C (izquierda): moneda en costos, % en tasas
  [5, 6, 7, 8, 11, 12, 15, 18, 19, 23].forEach((f) => patchCol(f, 'C', moneda, soloNumero));
  [13, 14].forEach((f) => patchCol(f, 'C', pct, soloNumero));
  patchCol(20, 'C', multiplo, soloNumero); // ROAS objetivo (3.5x)

  // Columna G (derecha): moneda en resultados y precios mínimos
  [5, 6, 7, 8, 9, 10, 22, 23, 24, 25].forEach((f) => patchCol(f, 'G', moneda, soloNumero));
  patchCol(13, 'G', pct, soloNumero);       // margen neto %
  patchCol(14, 'G', multiplo, soloNumero);  // múltiplo sobre COGS
  patchCol(15, 'G', multiplo, soloNumero);  // ROAS implícito
  patchCol(16, 'G', unidades, soloNumero);  // break-even mensual

  // Notas (columna D) — nadie más la toca
  fmt(1, COL.D, 25, COL.D + 1, { userEnteredFormat: { textFormat: { italic: true, fontSize: 8, foregroundColor: { red: 0.45, green: 0.45, blue: 0.45 } }, wrapStrategy: 'WRAP' } });

  // Anchos de columna
  const anchoCol = (idx, px) => req.push({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: idx, endIndex: idx + 1 }, properties: { pixelSize: px }, fields: 'pixelSize' } });
  anchoCol(0, 20);   // A margen
  anchoCol(1, 270);  // B etiquetas izq
  anchoCol(2, 110);  // C valores izq
  anchoCol(3, 260);  // D notas
  anchoCol(4, 20);   // E margen
  anchoCol(5, 250);  // F etiquetas der
  anchoCol(6, 260);  // G valores der / estado

  // Congelar título + subtítulo
  req.push({ updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 2 } }, fields: 'gridProperties.frozenRowCount' } });

  // Conditional formatting para "Estado del precio" (G19) según el margen (G13)
  const cf = (formula, color) => req.push({
    addConditionalFormatRule: {
      rule: {
        ranges: [{ sheetId, startRowIndex: R(19), endRowIndex: 19, startColumnIndex: COL.G, endColumnIndex: COL.G + 1 }],
        booleanRule: { condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: formula }] }, format: { backgroundColor: color } },
      },
      index: 0,
    },
  });
  cf('=$G$13>=0.25', { red: 0.80, green: 0.94, blue: 0.83 });
  cf('=AND($G$13>=0.15,$G$13<0.25)', { red: 1, green: 0.95, blue: 0.75 });
  cf('=$G$13<0.15', { red: 0.98, green: 0.80, blue: 0.80 });

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: req } });

  console.log('\n✅ Calculadora lista.');
  console.log(`   ${ss.spreadsheetUrl}`);
  console.log('\nCeldas amarillas = editables (son ejemplos, pon tus números reales).');
  console.log('Todo lo demás se recalcula solo.');
  return { spreadsheetId, url: ss.spreadsheetUrl };
}

if (require.main === module) {
  crear().catch((e) => {
    console.error('❌', e.message);
    if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
    process.exit(1);
  });
}

module.exports = { crear };
