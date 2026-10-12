/**
 * Arma la hoja PUBLICIDAD (layout + formato + filtro) y su hoja de datos.
 *
 * Dos hojas:
 *   PUBLICIDAD        → lo que Fabián mira. Dropdowns de producto/período y la
 *                       celda editable de % de devolución en B2/D2/F2.
 *   PUBLICIDAD_DATOS  → oculta. Una fila por día y producto, la escribe
 *                       `publicidad-live.js` cada 15 min.
 *
 * El filtro es por FÓRMULA, no por script: cambiar el dropdown o el % de
 * devolución actualiza la tabla al instante sin esperar la próxima corrida.
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
 * Columna de PUBLICIDAD_DATOS por la que agrupar según el dropdown "Ver por"
 * (D2): A = fecha (día), N = etiqueta de semana, O = mes.
 *
 * Vive en L2 (oculta) — NO puede vivir en una columna visible: la fila 2 es la
 * misma fila del filtro, así que si L fuera visible esta fórmula aparecería
 * como texto suelto ahí. Ver el bug real que causó esto: al agregar las
 * columnas de utilidad, "K" pasó de oculta a visible y esta fórmula (que antes
 * vivía en K2) se hubiera visto flotando junto al filtro de producto.
 */
const COLUMNA_AGRUPACION = '=IF($D$2="SEMANA","N",IF($D$2="MES","O","A"))';

/**
 * Filtra por el producto de B2 ("TODOS" = sin filtro) y agrupa por lo que diga
 * $L$2. Orden ASCENDENTE: el día más nuevo queda abajo.
 *
 * Sale en L6 y ocupa L:V — columnas ocultas. Las de la vista (A:K) leen de acá.
 * 10 sumas: gasto, gasto real, ventas, ingreso, entregados, devueltos, margen
 * entregados, pérdida devueltos, margen pendientes, flete pendientes.
 */
const QUERY_HELPER =
  '=IFERROR(QUERY(PUBLICIDAD_DATOS!A2:O, "select "&$L$2&", sum(D), sum(E), sum(F), sum(G), sum(H), sum(I), sum(J), sum(K), sum(L), sum(M) ' +
  'where A is not null "&IF(OR($B$2="",$B$2="TODOS"),""," and C = \'"&$B$2&"\'")&" ' +
  'group by "&$L$2&" order by "&$L$2&" asc ' +
  'label sum(D) \'\', sum(E) \'\', sum(F) \'\', sum(G) \'\', sum(H) \'\', sum(I) \'\', sum(J) \'\', sum(K) \'\', sum(L) \'\', sum(M) \'\'", 0), "")';

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

  const idVista = await asegurarHoja(sheets, HOJA, { filas: FILAS, columnas: 22 });
  await asegurarHoja(sheets, HOJA_DATOS, { filas: 2000, columnas: 15, oculta: true });

  // Encabezado de la hoja de datos (las filas las escribe publicidad-live.js).
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${HOJA_DATOS}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        'FECHA', 'TIENDA', 'PRODUCTO', 'GASTO', 'GASTO REAL', 'VENTAS', 'INGRESO',
        'ENTREGADOS', 'DEVUELTOS',
        'MARGEN ENTREGADOS', 'PERDIDA DEVUELTOS', 'MARGEN PENDIENTES', 'FLETE PENDIENTES',
        'SEMANA', 'MES'
      ]]
    }
  });

  // Lo que Fabián tenga elegido en los filtros se conserva: este script reescribe
  // el layout entero, y sin esto cada corrida le devolvía la vista a TODOS/DÍA/30%.
  let filtroProducto = 'TODOS';
  let filtroVer = 'DÍA';
  let filtroDevolucion = 0.30;
  try {
    const prev = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${HOJA}!B2:F2` });
    const f = prev.data.values?.[0] || [];
    if (f[0]) filtroProducto = f[0];
    if (f[2]) filtroVer = f[2];
    if (typeof f[4] === 'number') filtroDevolucion = f[4];
  } catch { /* hoja recién creada: quedan los defaults */ }

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${HOJA}!A1:V${FILAS}` });

  const productos = [...new Set(campanas.map((p) => p.producto))];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${HOJA}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['PUBLICIDAD — gasto real vs ventas reales · últimos 30 días', '', '', '', '', '', '', '', '', '', ''],
        ['Producto:', filtroProducto, 'Ver por:', filtroVer, '% devolución esperada:', filtroDevolucion, 'Actualizado:', '', ''],
        [
          'TOTAL PERÍODO',
          `=SUM($B$6:$B$${FILAS})`,
          `=SUM($C$6:$C$${FILAS})`,
          `=SUM($D$6:$D$${FILAS})`,
          `=SUM($E$6:$E$${FILAS})`,
          `=SUM($F$6:$F$${FILAS})`,
          `=IF($E$3+$F$3=0,"",$F$3/($E$3+$F$3))`,
          `=IF($D$3=0,"",$C$3/$D$3)`,
          `=IF($C$3=0,"",SUM($P$6:$P${FILAS})/$C$3)`,  // P = suma de INGRESO (ver mapeo de columnas ocultas L:V)
          `=SUM($J$6:$J$${FILAS})`,
          `=SUM($K$6:$K$${FILAS})`,
        ],
        ['', '', '', '', '', '', '', '', '', '', ''],
        [
          '=IF($D$2="SEMANA","SEMANA (lun-dom)",IF($D$2="MES","MES","FECHA"))',
          'GASTO', 'GASTO REAL (+20%)', 'VENTAS REALES',
          'ENTREGADOS', 'DEVUELTOS', '% DEVOLUCIONES', 'CPA REAL', 'ROAS REAL',
          'UTILIDAD SI SE ENTREGA TODO', 'UTILIDAD AJUSTADA (%DEV)'
        ],
        [
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",$L$6:$L$${FILAS}))`,
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",$M$6:$M$${FILAS}))`,
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",$N$6:$N$${FILAS}))`,
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",$O$6:$O$${FILAS}))`,
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",$Q$6:$Q$${FILAS}))`,
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",$R$6:$R$${FILAS}))`,
          // % devoluciones sobre lo YA RESUELTO (entregados + devueltos), no sobre
          // el total: los pedidos en tránsito todavía no votaron.
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",IF($Q$6:$Q$${FILAS}+$R$6:$R$${FILAS}=0,"",$R$6:$R$${FILAS}/($Q$6:$Q$${FILAS}+$R$6:$R$${FILAS}))))`,
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",IF($O$6:$O$${FILAS}=0,"",$N$6:$N$${FILAS}/$O$6:$O$${FILAS})))`,
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",IF($N$6:$N$${FILAS}=0,"",$P$6:$P$${FILAS}/$N$6:$N$${FILAS})))`,
          // UTILIDAD SI SE ENTREGA TODO = margen ya ganado (entregados) − pérdida
          // ya sufrida (devueltos) + margen de lo pendiente SI TODO entregara −
          // gasto real. Lo ya resuelto no se toca; el 100% solo aplica a lo que
          // todavía no se sabe.
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",$S$6:$S$${FILAS}-$T$6:$T$${FILAS}+$U$6:$U$${FILAS}-$N$6:$N$${FILAS}))`,
          // UTILIDAD AJUSTADA (%DEV) = lo mismo, pero lo pendiente se reparte según
          // el % de devolución editable de F2: (1-%dev) entrega, %dev se devuelve
          // y solo pierde el flete. F2 es la única celda que Fabián toca para
          // mover este número — cambia y la tabla entera se recalcula sola.
          `=ARRAYFORMULA(IF($L$6:$L$${FILAS}="","",$S$6:$S$${FILAS}-$T$6:$T$${FILAS}+((1-$F$2)*$U$6:$U$${FILAS})-($F$2*$V$6:$V$${FILAS})-$N$6:$N$${FILAS}))`,
        ],
      ]
    }
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${HOJA}!L2`, values: [[COLUMNA_AGRUPACION]] },
        { range: `${HOJA}!L6`, values: [[QUERY_HELPER]] },
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
        { unmergeCells: { range: rango(0, 1, 0, 11) } },
        { mergeCells: { range: rango(0, 1, 0, 11), mergeType: 'MERGE_ROWS' } },

        // Título
        {
          repeatCell: {
            range: rango(0, 1, 0, 11),
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
            range: rango(1, 2, 0, 11),
            cell: { userEnteredFormat: { backgroundColor: AMBAR, textFormat: { bold: true } } },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        },
        // Fila de totales
        {
          repeatCell: {
            range: rango(2, 3, 0, 11),
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
            range: rango(4, 5, 0, 11),
            cell: {
              userEnteredFormat: {
                backgroundColor: NAVY,
                textFormat: { bold: true, foregroundColor: BLANCO },
                horizontalAlignment: 'CENTER',
                wrapStrategy: 'WRAP'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy)'
          }
        },

        // B,C = plata · D,E,F = conteos · G = % · H = plata (CPA) · I = roas · J,K = plata (utilidad)
        formato(2, 3, 1, 3, MONEDA),
        formato(2, 3, 3, 6, ENTERO),
        formato(2, 3, 6, 7, PORCENTAJE),
        formato(2, 3, 7, 8, MONEDA),
        formato(2, 3, 8, 9, ROAS),
        formato(2, 3, 9, 11, MONEDA),
        formato(5, FILAS, 1, 3, MONEDA),
        formato(5, FILAS, 3, 6, ENTERO),
        formato(5, FILAS, 6, 7, PORCENTAJE),
        formato(5, FILAS, 7, 8, MONEDA),
        formato(5, FILAS, 8, 9, ROAS),
        formato(5, FILAS, 9, 11, MONEDA),

        // F2: el % de devolución editable. Formato porcentaje + borde para que
        // se note que es la única celda de toda la hoja pensada para tocar.
        {
          repeatCell: {
            range: rango(1, 2, 5, 6),
            cell: {
              userEnteredFormat: {
                numberFormat: { type: 'PERCENT', pattern: '0%' },
                borders: {
                  top: { style: 'SOLID_MEDIUM', color: NAVY }, bottom: { style: 'SOLID_MEDIUM', color: NAVY },
                  left: { style: 'SOLID_MEDIUM', color: NAVY }, right: { style: 'SOLID_MEDIUM', color: NAVY }
                }
              }
            },
            fields: 'userEnteredFormat(numberFormat,borders)'
          }
        },

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
        // F2 solo acepta 0–100%: una devolución no puede ser negativa ni pasar el total.
        {
          setDataValidation: {
            range: rango(1, 2, 5, 6),
            rule: {
              condition: { type: 'NUMBER_BETWEEN', values: [{ userEnteredValue: '0' }, { userEnteredValue: '1' }] },
              inputMessage: 'Escribí un número entre 0 y 1 (ej. 0.3 = 30% de devolución esperada)',
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
        { updateDimensionProperties: { range: col(9), properties: { pixelSize: 150 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: col(10), properties: { pixelSize: 150 }, fields: 'pixelSize' } },
        // A:K visibles SIEMPRE y de forma explícita. Sin esto, una versión anterior
        // que ocultaba otro rango dejaba columnas escondidas para siempre: ocultar
        // el rango nuevo no desoculta el viejo.
        {
          updateDimensionProperties: {
            range: { sheetId: idVista, dimension: 'COLUMNS', startIndex: 0, endIndex: 11 },
            properties: { hiddenByUser: false },
            fields: 'hiddenByUser'
          }
        },
        // L:V es el resultado crudo del QUERY — se oculta, no se mira
        {
          updateDimensionProperties: {
            range: { sheetId: idVista, dimension: 'COLUMNS', startIndex: 11, endIndex: 22 },
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
