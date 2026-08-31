/**
 * Arma la hoja PUBLICIDAD (layout + formato + filtro) y su hoja de datos.
 *
 * Dos hojas:
 *   PUBLICIDAD        → lo que Fabián mira. Dropdown de producto en B2 y una
 *                       tabla día a día que se filtra sola con fórmulas.
 *   PUBLICIDAD_DATOS  → oculta. Una fila por día y producto, la escribe
 *                       `publicidad-live.js` cada 15 min.
 *
 * El filtro es por FÓRMULA, no por script: cambiar el dropdown actualiza la
 * tabla al instante sin esperar la próxima corrida del cron.
 *
 * Correr de nuevo es seguro: limpia y reescribe el layout, no toca los datos.
 *
 * Uso:
 *   node projects/dropshipping/publicidad-sheet.js
 */
require('dotenv').config();
const { google } = require('googleapis');
const campanas = require('./campanas.js');

const SHEET_ID = process.env.SHEETS_ID_DROPSHIPPING;
const HOJA = 'PUBLICIDAD';
const HOJA_DATOS = 'PUBLICIDAD_DATOS';

const FILAS = 500;
const NAVY = { red: 0.10, green: 0.16, blue: 0.29 };
const BLANCO = { red: 1, green: 1, blue: 1 };
const GRIS = { red: 0.95, green: 0.95, blue: 0.96 };
const AMBAR = { red: 0.99, green: 0.95, blue: 0.84 };

const MONEDA = '"$"#,##0.00';
const ENTERO = '#,##0';
const ROAS = '0.00"x"';
const PORCENTAJE = '0.0%';

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

/**
 * Columna por la que agrupar según el dropdown "Ver por" (D2):
 * A = fecha (día), J = etiqueta de semana, K = mes. Las escribe publicidad-live.js.
 */
const COLUMNA_AGRUPACION = '=IF($D$2="SEMANA","J",IF($D$2="MES","K","A"))';

/**
 * Filtra por el producto de B2 ("TODOS" = sin filtro) y agrupa por lo que diga
 * $K$2. Orden ASCENDENTE: el día más nuevo queda abajo, como pidió Fabián.
 *
 * Sale en K6 y ocupa K:Q — columnas ocultas. Las de la vista (A:I) leen de acá.
 */
const QUERY_HELPER =
  '=IFERROR(QUERY(PUBLICIDAD_DATOS!A2:K, "select "&$K$2&", sum(D), sum(E), sum(F), sum(G), sum(H), sum(I) ' +
  'where A is not null "&IF(OR($B$2="",$B$2="TODOS"),""," and C = \'"&$B$2&"\'")&" ' +
  'group by "&$K$2&" order by "&$K$2&" asc ' +
  'label sum(D) \'\', sum(E) \'\', sum(F) \'\', sum(G) \'\', sum(H) \'\', sum(I) \'\'", 0), "")';

async function idDeHoja(sheets, titulo) {
  const { data } = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const hoja = data.sheets.find((s) => s.properties.title === titulo);
  return hoja ? hoja.properties.sheetId : null;
}

async function asegurarHoja(sheets, titulo, { filas, columnas, oculta = false }) {
  let id = await idDeHoja(sheets, titulo);
  if (id === null) {
    const { data } = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: titulo,
              hidden: oculta,
              gridProperties: { rowCount: filas, columnCount: columnas }
            }
          }
        }]
      }
    });
    id = data.replies[0].addSheet.properties.sheetId;
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          updateSheetProperties: {
            properties: { sheetId: id, hidden: oculta, gridProperties: { rowCount: filas, columnCount: columnas } },
            fields: 'hidden,gridProperties(rowCount,columnCount)'
          }
        }]
      }
    });
  }
  return id;
}

async function main() {
  if (!SHEET_ID) throw new Error('Falta SHEETS_ID_DROPSHIPPING en .env');
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });

  const idVista = await asegurarHoja(sheets, HOJA, { filas: FILAS, columnas: 17 });
  await asegurarHoja(sheets, HOJA_DATOS, { filas: 2000, columnas: 11, oculta: true });

  // Encabezado de la hoja de datos (las filas las escribe publicidad-live.js).
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${HOJA_DATOS}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['FECHA', 'TIENDA', 'PRODUCTO', 'GASTO', 'GASTO REAL', 'VENTAS', 'INGRESO',
                'ENTREGADOS', 'DEVUELTOS', 'SEMANA', 'MES']]
    }
  });

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${HOJA}!A1:Q${FILAS}` });

  const productos = [...new Set(campanas.map((p) => p.producto))];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${HOJA}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['PUBLICIDAD — gasto real vs ventas reales · últimos 30 días', '', '', '', '', '', '', '', ''],
        ['Producto:', 'TODOS', 'Ver por:', 'DÍA', '', '', 'Actualizado:', '', ''],
        [
          'TOTAL PERÍODO',
          `=SUM($B$6:$B$${FILAS})`,
          `=SUM($C$6:$C$${FILAS})`,
          `=SUM($D$6:$D$${FILAS})`,
          `=SUM($E$6:$E$${FILAS})`,
          `=SUM($F$6:$F$${FILAS})`,
          `=IF($E$3+$F$3=0,"",$F$3/($E$3+$F$3))`,
          `=IF($D$3=0,"",$C$3/$D$3)`,
          `=IF($C$3=0,"",SUM($O$6:$O$${FILAS})/$C$3)`,
        ],
        ['', '', '', '', '', '', '', '', ''],
        [
          '=IF($D$2="SEMANA","SEMANA (lun-dom)",IF($D$2="MES","MES","FECHA"))',
          'GASTO', 'GASTO REAL (+20%)', 'VENTAS REALES',
          'ENTREGADOS', 'DEVUELTOS', '% DEVOLUCIONES', 'CPA REAL', 'ROAS REAL'
        ],
        [
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",$K$6:$K$${FILAS}))`,
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",$L$6:$L$${FILAS}))`,
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",$M$6:$M$${FILAS}))`,
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",$N$6:$N$${FILAS}))`,
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",$P$6:$P$${FILAS}))`,
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",$Q$6:$Q$${FILAS}))`,
          // % devoluciones sobre lo YA RESUELTO (entregados + devueltos), no sobre
          // el total: los pedidos en tránsito todavía no votaron.
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",IF($P$6:$P$${FILAS}+$Q$6:$Q$${FILAS}=0,"",$Q$6:$Q$${FILAS}/($P$6:$P$${FILAS}+$Q$6:$Q$${FILAS}))))`,
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",IF($N$6:$N$${FILAS}=0,"",$M$6:$M$${FILAS}/$N$6:$N$${FILAS})))`,
          `=ARRAYFORMULA(IF($K$6:$K$${FILAS}="","",IF($M$6:$M$${FILAS}=0,"",$O$6:$O$${FILAS}/$M$6:$M$${FILAS})))`,
        ],
      ]
    }
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${HOJA}!K2`, values: [[COLUMNA_AGRUPACION]] },
        { range: `${HOJA}!K6`, values: [[QUERY_HELPER]] },
      ]
    }
  });

  const col = (i) => ({ sheetId: idVista, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 });
  const rango = (r0, r1, c0, c1) => ({ sheetId: idVista, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 });
  const formato = (r0, r1, c0, c1, pattern) => ({
    repeatCell: {
      range: rango(r0, r1, c0, c1),
      cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern } } },
      fields: 'userEnteredFormat.numberFormat'
    }
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        { unmergeCells: { range: rango(0, 1, 0, 9) } },
        { mergeCells: { range: rango(0, 1, 0, 9), mergeType: 'MERGE_ROWS' } },

        // Título
        {
          repeatCell: {
            range: rango(0, 1, 0, 9),
            cell: {
              userEnteredFormat: {
                backgroundColor: NAVY,
                textFormat: { bold: true, fontSize: 12, foregroundColor: BLANCO },
                horizontalAlignment: 'LEFT',
                padding: { left: 8 }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,padding)'
          }
        },
        // Fila del filtro
        {
          repeatCell: {
            range: rango(1, 2, 0, 9),
            cell: { userEnteredFormat: { backgroundColor: AMBAR, textFormat: { bold: true } } },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        },
        // Fila de totales
        {
          repeatCell: {
            range: rango(2, 3, 0, 9),
            cell: {
              userEnteredFormat: {
                backgroundColor: GRIS,
                textFormat: { bold: true },
                borders: { bottom: { style: 'SOLID_MEDIUM' } }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,borders)'
          }
        },
        // Encabezado de la tabla diaria
        {
          repeatCell: {
            range: rango(4, 5, 0, 9),
            cell: {
              userEnteredFormat: {
                backgroundColor: NAVY,
                textFormat: { bold: true, foregroundColor: BLANCO },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        },

        // B,C = plata · D,E,F = conteos · G = % · H = plata · I = roas
        formato(2, 3, 1, 3, MONEDA),
        formato(2, 3, 3, 6, ENTERO),
        formato(2, 3, 6, 7, PORCENTAJE),
        formato(2, 3, 7, 8, MONEDA),
        formato(2, 3, 8, 9, ROAS),
        formato(5, FILAS, 1, 3, MONEDA),
        formato(5, FILAS, 3, 6, ENTERO),
        formato(5, FILAS, 6, 7, PORCENTAJE),
        formato(5, FILAS, 7, 8, MONEDA),
        formato(5, FILAS, 8, 9, ROAS),

        // Dropdown de producto (B2)
        {
          setDataValidation: {
            range: rango(1, 2, 1, 2),
            rule: {
              condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'TODOS' }, ...productos.map((p) => ({ userEnteredValue: p }))] },
              showCustomUi: true,
              strict: true
            }
          }
        },
        // Dropdown de granularidad (D2)
        {
          setDataValidation: {
            range: rango(1, 2, 3, 4),
            rule: {
              condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'DÍA' }, { userEnteredValue: 'SEMANA' }, { userEnteredValue: 'MES' }] },
              showCustomUi: true,
              strict: true
            }
          }
        },

        { updateDimensionProperties: { range: col(0), properties: { pixelSize: 175 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(1), properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(2), properties: { pixelSize: 150 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(3), properties: { pixelSize: 125 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(4), properties: { pixelSize: 110 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(5), properties: { pixelSize: 105 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(6), properties: { pixelSize: 135 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(7), properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(8), properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        // K:Q es el resultado crudo del QUERY — se oculta, no se mira
        {
          updateDimensionProperties: {
            range: { sheetId: idVista, dimension: 'COLUMNS', startIndex: 10, endIndex: 17 },
            properties: { hiddenByUser: true },
            fields: 'hiddenByUser'
          }
        },
        {
          updateSheetProperties: {
            properties: { sheetId: idVista, gridProperties: { frozenRowCount: 5 } },
            fields: 'gridProperties.frozenRowCount'
          }
        },
      ]
    }
  });

  console.log(`Listo. Hoja ${HOJA} lista con dropdown (${productos.length} productos) y ${HOJA_DATOS} oculta.`);
  console.log('Los datos los llena: node projects/dropshipping/publicidad-live.js');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
