/**
 * Exporta el top de candidatos a un Google Sheet nuevo.
 *
 * Uso:
 *   node projects/dropshipping/exportar-sheet.js
 *   node projects/dropshipping/exportar-sheet.js --top 50
 *
 * Crea una hoja nueva cada vez (no pisa la anterior), así queda historial de
 * qué se veía cada semana.
 */

require('dotenv').config();
const { google } = require('googleapis');
const { analizar } = require('./ranking');
const { DEFAULTS } = require('./calculadora');

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
const VERDE  = { red: 0.85, green: 0.94, blue: 0.88 };
const AMBAR  = { red: 0.99, green: 0.93, blue: 0.80 };

const COLUMNAS = [
  { titulo: '#',                ancho: 40 },
  { titulo: 'Producto',         ancho: 300 },
  { titulo: 'ID DROPI',         ancho: 85 },
  { titulo: 'Proveedor',        ancho: 85 },
  { titulo: 'Stock',            ancho: 70 },
  { titulo: 'Unid./día',        ancho: 80 },
  { titulo: 'Costo',            ancho: 80 },
  { titulo: 'PVP sugerido',     ancho: 100 },
  { titulo: 'VENDER A',         ancho: 100 },
  { titulo: 'Múltiplo',         ancho: 80 },
  { titulo: 'CPA máximo',       ancho: 100 },
  { titulo: 'Utilidad/pedido',  ancho: 115 },
  { titulo: 'Sobre sugerido',   ancho: 110 },
  { titulo: 'Riesgo Meta',      ancho: 165 },
  { titulo: 'Ver en DROPI',     ancho: 130 }
];

async function exportar(top = 30) {
  const a = analizar({ top });
  const d = a.ventana;

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const hoy = new Date().toLocaleDateString('es-EC');
  const titulo = `Dropshipping — Top ${top} candidatos (${hoy})`;

  console.log('Creando spreadsheet...');
  const { data: ss } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: titulo, locale: 'en_US' },
      sheets: [{
        properties: {
          title: 'Candidatos',
          gridProperties: { rowCount: top + 12, columnCount: COLUMNAS.length, frozenRowCount: 6 }
        }
      }]
    }
  });

  const spreadsheetId = ss.spreadsheetId;
  const sheetId = ss.sheets[0].properties.sheetId;

  // ── Contenido ──────────────────────────────────────────────────────────────
  const filas = [];

  filas.push([titulo.toUpperCase()]);
  filas.push([`Ventana medida: ${d.horas.toFixed(1)} horas · ${a.total} productos con movimiento de stock en el catálogo`]);
  filas.push([`Supuestos: flete $${DEFAULTS.flete.toFixed(2)} · retorno $${DEFAULTS.retorno.toFixed(2)} · entrega ${(DEFAULTS.entrega * 100).toFixed(0)}% · CPA $${DEFAULTS.cpa.toFixed(2)} · margen objetivo 25%`]);
  filas.push(['"VENDER A" es el precio necesario para 25% de margen neto — no el sugerido por DROPI. "CPA máximo" es el techo que se puede pagar en Meta por pedido.']);
  filas.push([]);
  filas.push(COLUMNAS.map(c => c.titulo));

  a.viables.forEach((p, i) => {
    filas.push([
      i + 1,
      p.name,
      p.id,
      p.user_id,
      p.stock ?? '',
      Number(p.porDia.toFixed(1)),
      p.sale_price,
      p.suggested_price,
      Number(p.precioObjetivo.toFixed(2)),
      Number(p.multiploNecesario.toFixed(2)),
      Number(p.cpaMaximo.toFixed(2)),
      Number(p.utilidad.toFixed(2)),
      p.sobreSugerido ? Number(p.sobreSugerido.toFixed(2)) : '',
      p.restriccion ? p.restriccion.motivo : 'sin restricción',
      `https://app.dropi.ec/dashboard/product-details/${p.id}`
    ]);
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Candidatos!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: filas }
  });

  // ── Formato ────────────────────────────────────────────────────────────────
  const primeraFila = 6;                    // índice 0 de la fila de encabezados
  const ultimaFila = primeraFila + a.viables.length + 1;

  const req = [
    // Título
    { repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    // Notas de contexto en gris
    { repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 4 },
        cell: { userEnteredFormat: { textFormat: { fontSize: 9, foregroundColor: { red: 0.35, green: 0.38, blue: 0.42 } } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    // Encabezados de tabla
    { repeatCell: {
        range: { sheetId, startRowIndex: primeraFila - 1, endRowIndex: primeraFila },
        cell: { userEnteredFormat: {
          backgroundColor: NAVY,
          textFormat: { bold: true, foregroundColor: BLANCO, fontSize: 10 },
          horizontalAlignment: 'CENTER',
          verticalAlignment: 'MIDDLE',
          wrapStrategy: 'WRAP'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)'
    }},
    // Moneda: costo, sugerido, vender a, CPA máx, utilidad
    ...[6, 7, 8, 10, 11].map(col => ({
      repeatCell: {
        range: { sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: col, endColumnIndex: col + 1 },
        cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    })),
    // Múltiplo y sobre-sugerido con "x"
    ...[9, 12].map(col => ({
      repeatCell: {
        range: { sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: col, endColumnIndex: col + 1 },
        cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '0.0"x"' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    })),
    // Columna "VENDER A" destacada
    { repeatCell: {
        range: { sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: 8, endColumnIndex: 9 },
        cell: { userEnteredFormat: { backgroundColor: VERDE, textFormat: { bold: true } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},
    // Filas alternas
    { addBanding: {
        bandedRange: {
          range: { sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: 0, endColumnIndex: COLUMNAS.length },
          rowProperties: { firstBandColor: BLANCO, secondBandColor: GRIS }
        }
    }},
    // Los productos con riesgo en Meta se marcan en ámbar, no se esconden
    { addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: 13, endColumnIndex: 14 }],
          // TEXT_NOT_EQ no existe en formato condicional — hay que usar fórmula.
          // La fila 7 es la primera de datos (encabezados en la 6).
          booleanRule: {
            condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: '=$N7<>"sin restricción"' }] },
            format: { backgroundColor: AMBAR, textFormat: { bold: true } }
          }
        },
        index: 0
    }},
    // Anchos de columna
    ...COLUMNAS.map((c, i) => ({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: c.ancho },
        fields: 'pixelSize'
      }
    })),
    // Filtro para ordenar por lo que quiera
    { setBasicFilter: {
        filter: { range: { sheetId, startRowIndex: primeraFila - 1, endRowIndex: ultimaFila, startColumnIndex: 0, endColumnIndex: COLUMNAS.length } }
    }}
  ];

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: req } });

  return { url: ss.spreadsheetUrl, total: a.viables.length, conRiesgo: a.conRiesgoMeta };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const top = args.includes('--top') ? parseInt(args[args.indexOf('--top') + 1], 10) : 30;

  exportar(top)
    .then(r => {
      console.log(`\n✅ ${r.total} productos exportados (${r.conRiesgo} con riesgo en Meta, marcados en ámbar)`);
      console.log(`   ${r.url}\n`);
    })
    .catch(e => {
      console.error('❌ ' + (e.errors?.[0]?.message || e.message));
      process.exit(1);
    });
}

module.exports = { exportar };
