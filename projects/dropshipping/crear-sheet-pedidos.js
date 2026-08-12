/**
 * Crea el Google Sheet de pedidos de dropshipping (Truquito + Avanora).
 *
 * Un solo Sheet para las dos tiendas, con columna TIENDA: n8n usa un solo nodo
 * de append, y comparar los dos negocios es un filtro en vez de un reporte.
 *
 * Uso:
 *   node projects/dropshipping/crear-sheet-pedidos.js
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

const NAVY   = { red: 0.10, green: 0.16, blue: 0.29 };
const BLANCO = { red: 1, green: 1, blue: 1 };
const GRIS   = { red: 0.95, green: 0.95, blue: 0.96 };
const AZUL   = { red: 0.87, green: 0.92, blue: 0.98 };  // datos del cliente
const VERDE  = { red: 0.85, green: 0.94, blue: 0.88 };  // plata
const AMBAR  = { red: 0.99, green: 0.95, blue: 0.84 };  // fechas de control

/**
 * Los estados siguen el recorrido real del pedido. EN_DROPI existe porque entre
 * que el bot crea el pedido y que el proveedor genera la guía pueden pasar días
 * — sin ese estado, esos pedidos quedan invisibles.
 */
const ESTADOS = [
  'PENDIENTE_CONFIRMACION',
  'EN_DROPI',
  'GUIA_GENERADA',
  'ENTREGADO',
  'PAGADO',
  'CANCELADO'
];

const COLUMNAS = [
  { t: 'ID PEDIDO',        w: 100, grupo: 'base' },
  { t: 'FECHA',            w: 140, grupo: 'base' },
  { t: 'TIENDA',           w: 90,  grupo: 'base' },
  { t: 'ESTADO',           w: 175, grupo: 'base' },
  { t: 'NOMBRE',           w: 170, grupo: 'cliente' },
  { t: 'TELÉFONO',         w: 110, grupo: 'cliente' },
  { t: 'PROVINCIA',        w: 120, grupo: 'cliente' },
  { t: 'CIUDAD',           w: 120, grupo: 'cliente' },
  { t: 'DIRECCIÓN',        w: 260, grupo: 'cliente' },
  { t: 'REFERENCIAS',      w: 200, grupo: 'cliente' },
  { t: 'PRODUCTO',         w: 220, grupo: 'producto' },
  { t: 'ID DROPI',         w: 85,  grupo: 'producto' },
  { t: 'CANTIDAD',         w: 80,  grupo: 'producto' },
  { t: 'TOTAL COBRAR',     w: 110, grupo: 'plata' },
  { t: 'COSTO PROVEEDOR',  w: 130, grupo: 'plata' },
  { t: 'FLETE',            w: 90,  grupo: 'plata' },
  { t: 'CPA',              w: 90,  grupo: 'plata' },
  { t: 'UTILIDAD REAL',    w: 120, grupo: 'plata' },
  { t: 'ORDEN DROPI',      w: 110, grupo: 'dropi' },
  { t: 'GUÍA',             w: 130, grupo: 'dropi' },
  { t: 'FECHA CONFIRMACIÓN', w: 140, grupo: 'fechas' },
  { t: 'FECHA GUÍA',       w: 130, grupo: 'fechas' },
  { t: 'FECHA ENTREGA',    w: 130, grupo: 'fechas' },
  { t: 'FECHA PAGO',       w: 130, grupo: 'fechas' },
  { t: 'NOTAS',            w: 260, grupo: 'base' }
];

const COL = {};
COLUMNAS.forEach((c, i) => (COL[c.t] = i));

const FILAS = 1000;

async function crear() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('Creando spreadsheet...');
  const { data: ss } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'DROPSHIPPING — Pedidos (Truquito + Avanora)', locale: 'en_US' },
      sheets: [
        { properties: { title: 'PEDIDOS', gridProperties: { rowCount: FILAS, columnCount: COLUMNAS.length, frozenRowCount: 1, frozenColumnCount: 1 } } },
        { properties: { title: 'RESUMEN', gridProperties: { rowCount: 40, columnCount: 6 } } }
      ]
    }
  });

  const spreadsheetId = ss.spreadsheetId;
  const hojaPedidos = ss.sheets[0].properties.sheetId;
  const hojaResumen = ss.sheets[1].properties.sheetId;

  // ── Encabezados ────────────────────────────────────────────────────────────
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'PEDIDOS!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [COLUMNAS.map((c) => c.t)] }
  });

  // ── Fórmula de utilidad real, sensible al estado ───────────────────────────
  // Entregado/Pagado → cobras y pagas todo. Cancelado → solo perdiste el ads
  // (si ya se había despachado, poner el flete de retorno en FLETE).
  const formulas = [];
  for (let f = 2; f <= FILAS; f++) {
    formulas.push([
      `=IF($A${f}="","",IF(OR($D${f}="ENTREGADO",$D${f}="PAGADO"),N${f}-O${f}-P${f}-Q${f},IF($D${f}="CANCELADO",-Q${f},"")))`
    ]);
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'PEDIDOS!R2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: formulas }
  });

  // ── RESUMEN ────────────────────────────────────────────────────────────────
  const P = 'PEDIDOS!';
  const resumen = [
    ['RESUMEN DE OPERACIÓN'],
    ['Se actualiza solo. Filtra por tienda cambiando la celda B3.'],
    [],
    ['Tienda (deja vacío para ver todo)', ''],
    [],
    ['PEDIDOS POR ESTADO'],
    ['Pendiente confirmación', `=IF($B$4="",COUNTIF(${P}D:D,"PENDIENTE_CONFIRMACION"),COUNTIFS(${P}D:D,"PENDIENTE_CONFIRMACION",${P}C:C,$B$4))`],
    ['En DROPI (esperando guía)', `=IF($B$4="",COUNTIF(${P}D:D,"EN_DROPI"),COUNTIFS(${P}D:D,"EN_DROPI",${P}C:C,$B$4))`],
    ['Guía generada', `=IF($B$4="",COUNTIF(${P}D:D,"GUIA_GENERADA"),COUNTIFS(${P}D:D,"GUIA_GENERADA",${P}C:C,$B$4))`],
    ['Entregado', `=IF($B$4="",COUNTIF(${P}D:D,"ENTREGADO"),COUNTIFS(${P}D:D,"ENTREGADO",${P}C:C,$B$4))`],
    ['Pagado', `=IF($B$4="",COUNTIF(${P}D:D,"PAGADO"),COUNTIFS(${P}D:D,"PAGADO",${P}C:C,$B$4))`],
    ['Cancelado', `=IF($B$4="",COUNTIF(${P}D:D,"CANCELADO"),COUNTIFS(${P}D:D,"CANCELADO",${P}C:C,$B$4))`],
    ['TOTAL PEDIDOS', '=SUM(B7:B12)'],
    [],
    ['LA MÉTRICA QUE MANDA'],
    ['Despachados (guía o más)', '=B9+B10+B11'],
    ['Entregados (entregado o pagado)', '=B10+B11'],
    ['TASA DE ENTREGA REAL', '=IFERROR(B17/B16,"—")'],
    ['', 'La calculadora asume 70%. Este es tu número de verdad.'],
    [],
    ['PLATA'],
    ['Cobrado (entregados y pagados)', `=SUMIFS(${P}N:N,${P}D:D,"ENTREGADO")+SUMIFS(${P}N:N,${P}D:D,"PAGADO")`],
    ['Utilidad real acumulada', `=SUM(${P}R:R)`],
    ['Utilidad por pedido generado', '=IFERROR(B23/B13,"—")'],
    ['Ticket promedio', '=IFERROR(B22/B17,"—")'],
    [],
    ['CICLO DE CAJA'],
    ['Días promedio de pedido a pago', `=IFERROR(AVERAGEIF(${P}X:X,">0",${P}X:X)-AVERAGEIF(${P}B:B,">0",${P}B:B),"—")`],
    ['', 'Cuántos días tarda un pedido en volverse efectivo.']
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'RESUMEN!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: resumen }
  });

  // ── Formato ────────────────────────────────────────────────────────────────
  const rangoCols = (grupo) => {
    const idx = COLUMNAS.map((c, i) => (c.grupo === grupo ? i : -1)).filter((i) => i >= 0);
    return { start: Math.min(...idx), end: Math.max(...idx) + 1 };
  };

  const req = [
    // Encabezado
    { repeatCell: {
        range: { sheetId: hojaPedidos, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: {
          backgroundColor: NAVY,
          textFormat: { bold: true, foregroundColor: BLANCO, fontSize: 10 },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', wrapStrategy: 'WRAP'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)'
    }},
    { updateDimensionProperties: {
        range: { sheetId: hojaPedidos, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 42 }, fields: 'pixelSize'
    }},

    // Bloques de color por tipo de dato
    ...['cliente', 'plata', 'fechas'].map((g) => {
      const r = rangoCols(g);
      const color = g === 'cliente' ? AZUL : g === 'plata' ? VERDE : AMBAR;
      return { repeatCell: {
        range: { sheetId: hojaPedidos, startRowIndex: 0, endRowIndex: 1, startColumnIndex: r.start, endColumnIndex: r.end },
        cell: { userEnteredFormat: { backgroundColor: { red: color.red * 0.55, green: color.green * 0.55, blue: color.blue * 0.75 } } },
        fields: 'userEnteredFormat.backgroundColor'
      }};
    }),

    // Desplegable de estados — evita que se escriban a mano con typos
    { setDataValidation: {
        range: { sheetId: hojaPedidos, startRowIndex: 1, endRowIndex: FILAS, startColumnIndex: COL['ESTADO'], endColumnIndex: COL['ESTADO'] + 1 },
        rule: {
          condition: { type: 'ONE_OF_LIST', values: ESTADOS.map((e) => ({ userEnteredValue: e })) },
          showCustomUi: true, strict: false
        }
    }},

    // Moneda
    ...['TOTAL COBRAR', 'COSTO PROVEEDOR', 'FLETE', 'CPA', 'UTILIDAD REAL'].map((t) => ({
      repeatCell: {
        range: { sheetId: hojaPedidos, startRowIndex: 1, endRowIndex: FILAS, startColumnIndex: COL[t], endColumnIndex: COL[t] + 1 },
        cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    })),

    // Utilidad real destacada: es la columna que dice si el negocio sirve
    { repeatCell: {
        range: { sheetId: hojaPedidos, startRowIndex: 1, endRowIndex: FILAS, startColumnIndex: COL['UTILIDAD REAL'], endColumnIndex: COL['UTILIDAD REAL'] + 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    { addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId: hojaPedidos, startRowIndex: 1, endRowIndex: FILAS, startColumnIndex: COL['UTILIDAD REAL'], endColumnIndex: COL['UTILIDAD REAL'] + 1 }],
          booleanRule: {
            condition: { type: 'NUMBER_LESS', values: [{ userEnteredValue: '0' }] },
            format: { backgroundColor: { red: 0.98, green: 0.87, blue: 0.86 }, textFormat: { foregroundColor: { red: 0.65, green: 0.13, blue: 0.1 } } }
          }
        }, index: 0
    }},

    // Colores por estado, en toda la fila
    ...[
      ['PENDIENTE_CONFIRMACION', { red: 1, green: 0.97, blue: 0.85 }],
      ['EN_DROPI',               { red: 0.93, green: 0.95, blue: 1 }],
      ['GUIA_GENERADA',          { red: 0.90, green: 0.95, blue: 1 }],
      ['ENTREGADO',              { red: 0.88, green: 0.96, blue: 0.90 }],
      ['PAGADO',                 { red: 0.80, green: 0.94, blue: 0.84 }],
      ['CANCELADO',              { red: 0.96, green: 0.92, blue: 0.92 }]
    ].map(([estado, color], i) => ({
      addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId: hojaPedidos, startRowIndex: 1, endRowIndex: FILAS, startColumnIndex: 0, endColumnIndex: COLUMNAS.length }],
          booleanRule: {
            condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: `=$D2="${estado}"` }] },
            format: { backgroundColor: color }
          }
        }, index: i + 1
      }
    })),

    // Anchos
    ...COLUMNAS.map((c, i) => ({
      updateDimensionProperties: {
        range: { sheetId: hojaPedidos, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: c.w }, fields: 'pixelSize'
      }
    })),

    { setBasicFilter: {
        filter: { range: { sheetId: hojaPedidos, startRowIndex: 0, endRowIndex: FILAS, startColumnIndex: 0, endColumnIndex: COLUMNAS.length } }
    }},

    // RESUMEN
    { repeatCell: {
        range: { sheetId: hojaResumen, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    ...[5, 14, 20, 26].map((fila) => ({
      repeatCell: {
        range: { sheetId: hojaResumen, startRowIndex: fila, endRowIndex: fila + 1, startColumnIndex: 0, endColumnIndex: 2 },
        cell: { userEnteredFormat: { backgroundColor: NAVY, textFormat: { bold: true, foregroundColor: BLANCO } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
      }
    })),
    { repeatCell: {
        range: { sheetId: hojaResumen, startRowIndex: 17, endRowIndex: 18, startColumnIndex: 1, endColumnIndex: 2 },
        cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.0%' }, textFormat: { bold: true, fontSize: 13 } } },
        fields: 'userEnteredFormat(numberFormat,textFormat)'
    }},
    ...[21, 22, 23, 24].map((fila) => ({
      repeatCell: {
        range: { sheetId: hojaResumen, startRowIndex: fila, endRowIndex: fila + 1, startColumnIndex: 1, endColumnIndex: 2 },
        cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    })),
    { updateDimensionProperties: {
        range: { sheetId: hojaResumen, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 260 }, fields: 'pixelSize'
    }},
    { updateDimensionProperties: {
        range: { sheetId: hojaResumen, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
        properties: { pixelSize: 150 }, fields: 'pixelSize'
    }}
  ];

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: req } });

  return { url: ss.spreadsheetUrl, spreadsheetId, columnas: COLUMNAS.length };
}

if (require.main === module) {
  crear()
    .then((r) => {
      console.log(`\n✅ Sheet creado — ${r.columnas} columnas`);
      console.log(`   ${r.url}`);
      console.log(`   SHEETS_ID_DROPSHIPPING=${r.spreadsheetId}\n`);
    })
    .catch((e) => {
      console.error('❌ ' + (e.errors?.[0]?.message || e.message));
      process.exit(1);
    });
}

module.exports = { crear, ESTADOS, COLUMNAS };
