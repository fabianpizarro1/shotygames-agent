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
  'NOVEDAD',     // problema en la entrega, el paquete sigue vivo
  'ENTREGADO',
  'PAGADO',
  'CANCELADO',   // se cayó ANTES de despachar: se pierde solo el CPA
  'DEVUELTO'     // salió y volvió: se pierde el CPA y el flete de ida
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

/**
 * Letras de columna de PEDIDOS que necesitan las fórmulas del RESUMEN,
 * resueltas por TÍTULO a partir del encabezado real.
 *
 * ⚠️ Antes estaban escritas a mano ("N" para TOTAL COBRAR). El 2026-08-31 se le
 * agregaron 3 columnas al Sheet (PRODUCTO2/IDDROPI2/CANTIDAD2), todo se corrió
 * y esas letras pasaron a apuntar a otra cosa: "Cobrado" sumaba IDs de producto
 * ($678.696) y "Utilidad" sumaba el flete. Mismo motivo por el que
 * `sheets-pedidos.js` lee por título — acá se hace igual.
 */
const TITULOS_RESUMEN = {
  tienda: 'TIENDA',
  estado: 'ESTADO',
  fecha: 'FECHA',
  total: 'TOTAL COBRAR',
  utilidad: 'UTILIDAD REAL',
  fPago: 'FECHA PAGO',
};

const normalizarTitulo = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();

function columnaAletra(i) {
  let s = '';
  i += 1;
  while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); }
  return s;
}

/** `['ID PEDIDO','FECHA',...]` → `{ tienda:'C', estado:'D', total:'P', ... }` */
function letrasDesdeEncabezado(encabezados) {
  const norm = encabezados.map(normalizarTitulo);
  const letras = {};
  for (const [clave, titulo] of Object.entries(TITULOS_RESUMEN)) {
    const i = norm.indexOf(normalizarTitulo(titulo));
    if (i < 0) throw new Error(`La hoja PEDIDOS no tiene la columna "${titulo}" que necesita el RESUMEN`);
    letras[clave] = columnaAletra(i);
  }
  return letras;
}

/**
 * Contenido de la hoja RESUMEN. Vive en una función y no suelto adentro de
 * `crear()` porque `patch-resumen.js` la reaplica sobre el Sheet que ya está en
 * uso: si el layout estuviera duplicado en dos lados, se desincronizarían.
 *
 * ⚠️ Las fórmulas apuntan a filas fijas (B7, B15, B18...). Si se agrega o mueve
 * una fila hay que recontar las de abajo — por eso van numeradas en el comentario.
 */
function filasResumen(L) {
  const P = 'PEDIDOS!';
  const cuenta = (estado) =>
    `=IF($B$4="",COUNTIF(${P}${L.estado}:${L.estado},"${estado}"),` +
    `COUNTIFS(${P}${L.estado}:${L.estado},"${estado}",${P}${L.tienda}:${L.tienda},$B$4))`;

  return [
    /*  1 */ ['RESUMEN DE OPERACIÓN'],
    /*  2 */ ['Se actualiza solo. Filtra por tienda escribiendo en la celda B4.'],
    /*  3 */ [],
    /*  4 */ ['Tienda (deja vacío para ver todo)', ''],
    /*  5 */ [],
    /*  6 */ ['PEDIDOS POR ESTADO'],
    /*  7 */ ['Pendiente confirmación', cuenta('PENDIENTE_CONFIRMACION')],
    /*  8 */ ['En DROPI (esperando guía)', cuenta('EN_DROPI')],
    /*  9 */ ['Guía generada', cuenta('GUIA_GENERADA')],
    /* 10 */ ['Novedad (entrega con problema)', cuenta('NOVEDAD')],
    /* 11 */ ['Entregado', cuenta('ENTREGADO')],
    /* 12 */ ['Pagado', cuenta('PAGADO')],
    /* 13 */ ['Cancelado (no llegó a salir)', cuenta('CANCELADO')],
    /* 14 */ ['Devuelto (salió y volvió)', cuenta('DEVUELTO')],
    /* 15 */ ['TOTAL PEDIDOS', '=SUM(B7:B14)'],
    /* 16 */ [],
    /* 17 */ ['LA MÉTRICA QUE MANDA'],
    // Despachado = el paquete salió. Incluye NOVEDAD (está en ruta con un problema)
    // y DEVUELTO (salió y volvió). NO incluye CANCELADO: ese nunca se despachó.
    // Si el devuelto no fuera al denominador, la tasa se vería mejor de lo que es.
    /* 18 */ ['Despachados (guía o más)', '=B9+B10+B11+B12+B14'],
    /* 19 */ ['Entregados (entregado o pagado)', '=B11+B12'],
    /* 20 */ ['TASA DE ENTREGA REAL', '=IFERROR(B19/B18,"—")'],
    /* 21 */ ['', 'La calculadora asume 70%. Este es tu número de verdad.'],
    /* 22 */ [],
    /* 23 */ ['PLATA'],
    /* 24 */ ['Cobrado (entregados y pagados)', `=SUMIFS(${P}${L.total}:${L.total},${P}${L.estado}:${L.estado},"ENTREGADO")+SUMIFS(${P}${L.total}:${L.total},${P}${L.estado}:${L.estado},"PAGADO")`],
    /* 25 */ ['Utilidad real acumulada', `=SUM(${P}${L.utilidad}:${L.utilidad})`],
    /* 26 */ ['Utilidad por pedido generado', '=IFERROR(B25/B15,"—")'],
    /* 27 */ ['Ticket promedio', '=IFERROR(B24/B19,"—")'],
    /* 28 */ [],
    /* 29 */ ['CICLO DE CAJA'],
    /* 30 */ ['Días promedio de pedido a pago', `=IFERROR(AVERAGEIF(${P}${L.fPago}:${L.fPago},">0",${P}${L.fPago}:${L.fPago})-AVERAGEIF(${P}${L.fecha}:${L.fecha},">0",${P}${L.fecha}:${L.fecha}),"—")`],
    /* 31 */ ['', 'Cuántos días tarda un pedido en volverse efectivo.']
  ];
}

/**
 * Formato de la hoja RESUMEN. Va junto a `filasResumen()` porque depende de las
 * MISMAS filas: si el contenido se corre y el formato no, cada celda hereda el
 * formato de la fila que ocupaba antes (pasó el 2026-08-31 al agregar NOVEDAD y
 * DEVUELTO: "Despachados 54" se mostraba como "5400.0%").
 *
 * Los índices son 0-based; el número del comentario es la fila real del Sheet.
 */
function formatosResumen(sheetId) {
  const enFila = (fila0, cell, fields, c0 = 0, c1 = 2) => ({
    repeatCell: { range: { sheetId, startRowIndex: fila0, endRowIndex: fila0 + 1, startColumnIndex: c0, endColumnIndex: c1 }, cell, fields }
  });
  const numero = (pattern, type = 'NUMBER') => ({ userEnteredFormat: { numberFormat: { type, pattern } } });

  return [
    // Título (fila 1)
    { repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    // Encabezados de sección: filas 6, 17, 23, 29
    ...[5, 16, 22, 28].map((f) => enFila(f,
      { userEnteredFormat: { backgroundColor: NAVY, textFormat: { bold: true, foregroundColor: BLANCO } } },
      'userEnteredFormat(backgroundColor,textFormat)')),
    // Conteos por estado + total: filas 7-15
    ...[6, 7, 8, 9, 10, 11, 12, 13, 14].map((f) => enFila(f, numero('#,##0'), 'userEnteredFormat.numberFormat', 1, 2)),
    // Despachados y entregados: filas 18-19
    ...[17, 18].map((f) => enFila(f, numero('#,##0'), 'userEnteredFormat.numberFormat', 1, 2)),
    // TASA DE ENTREGA REAL: fila 20
    enFila(19,
      { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.0%' }, textFormat: { bold: true, fontSize: 13 } } },
      'userEnteredFormat(numberFormat,textFormat)', 1, 2),
    // Plata: filas 24-27
    ...[23, 24, 25, 26].map((f) => enFila(f, numero('$#,##0.00', 'CURRENCY'), 'userEnteredFormat.numberFormat', 1, 2)),
    // Días promedio: fila 30
    enFila(29, numero('#,##0.0'), 'userEnteredFormat.numberFormat', 1, 2),
    { updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 260 }, fields: 'pixelSize'
    }},
    { updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
        properties: { pixelSize: 150 }, fields: 'pixelSize'
    }}
  ];
}

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
  const resumen = filasResumen(letrasDesdeEncabezado(COLUMNAS.map((c) => c.t)));

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
      ['NOVEDAD',                { red: 1, green: 0.90, blue: 0.75 }],
      ['ENTREGADO',              { red: 0.88, green: 0.96, blue: 0.90 }],
      ['PAGADO',                 { red: 0.80, green: 0.94, blue: 0.84 }],
      ['CANCELADO',              { red: 0.96, green: 0.92, blue: 0.92 }],
      ['DEVUELTO',               { red: 0.99, green: 0.85, blue: 0.82 }]
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
    ...formatosResumen(hojaResumen)
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

module.exports = { crear, ESTADOS, COLUMNAS, filasResumen, formatosResumen, letrasDesdeEncabezado };
