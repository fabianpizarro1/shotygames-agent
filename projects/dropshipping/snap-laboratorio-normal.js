/**
 * Snapshot de DROPI dividido en dos mundos: "laboratorio" (Salud/Bienestar —
 * suplementos, vitaminas, todo lo que compite con Avanora) y "normal" (el resto
 * del catálogo). Saca el top 20 de cada uno por velocidad de venta real (delta
 * de stock) y lo compara contra la ventana anterior para ver quién es un
 * vendedor consistente y quién apareció una sola vez.
 *
 * Uso:
 *   node projects/dropshipping/snap-laboratorio-normal.js
 *   node projects/dropshipping/snap-laboratorio-normal.js --top 20
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { detectarAjustesMasivos, restriccion } = require('./ranking');

const DATA_DIR = path.join(__dirname, 'data');

function snapshotsExistentes() {
  return fs.readdirSync(DATA_DIR)
    .filter(f => /^snapshot-\d{4}-\d{2}-\d{2}(-\d{4})?\.json$/.test(f))
    .sort();
}

function cargar(nombre) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, nombre), 'utf8'));
}

/** Igual que catalogo.js#delta pero recibe los dos snapshots en vez de asumir los últimos 2. */
function deltaEntre(antes, ahora) {
  const horas = (new Date(ahora.tomado || ahora.fecha) - new Date(antes.tomado || antes.fecha)) / 3600000;
  const dias = horas / 24;
  const previos = new Map(antes.productos.map(p => [p.id, p]));

  const movimientos = [];
  const nuevos = [];

  for (const p of ahora.productos) {
    const prev = previos.get(p.id);
    if (!prev) { nuevos.push(p); continue; }
    const vendidas = (prev.stock ?? 0) - (p.stock ?? 0);
    if (vendidas > 0) {
      movimientos.push({ ...p, vendidas, porDia: vendidas / dias, cambioPrecio: p.sale_price - prev.sale_price });
    }
  }

  movimientos.sort((a, b) => b.porDia - a.porDia);
  return { desde: antes.fecha, hasta: ahora.fecha, horas, dias, movimientos, nuevos };
}

/**
 * "Laboratorio" = lo que ranking.js ya clasifica como riesgo en Meta: suplementos,
 * pérdida de peso, salud sexual, condición médica, tratamiento corporal, promesa
 * estética. Es la misma regla de negocio en toda la app — no inventar una nueva.
 *
 * Deliberadamente NO se usa la categoría "Salud"/"Bienestar" del proveedor sola:
 * algunos taggean el producto con las ~26 categorías de DROPI para aparecer en
 * más búsquedas (visto el 2026-08-15: "Boquilla de manguera 3 en 1" y "Parches
 * adelgazantes SLIM" con 26 categorías cada uno). restriccion() mira el NOMBRE
 * contra patrones específicos, así que ese spam de tags no lo engaña.
 */
const esLaboratorio = p => restriccion(p) !== null;

/** Movimientos limpios: sin ajustes masivos de inventario disfrazados de ventas. */
function movimientosLimpios(d) {
  const ajustes = detectarAjustesMasivos(d.movimientos);
  return d.movimientos.filter(p => !ajustes.has(p.id));
}

function analizar({ top = 20 } = {}) {
  const archivos = snapshotsExistentes();
  if (archivos.length < 2) throw new Error(`Hacen falta al menos 2 snapshots (hay ${archivos.length}).`);

  // Ventana actual: los 2 snapshots más nuevos. Ventana anterior: los 2 antes de esos,
  // si existen — sirve para saber si un producto vendía fuerte también la vez pasada.
  const actual = deltaEntre(cargar(archivos[archivos.length - 2]), cargar(archivos[archivos.length - 1]));
  const limpiosActual = movimientosLimpios(actual);

  let anterior = null;
  let limpiosAnterior = [];
  if (archivos.length >= 3) {
    anterior = deltaEntre(cargar(archivos[archivos.length - 3]), cargar(archivos[archivos.length - 2]));
    limpiosAnterior = movimientosLimpios(anterior);
  }
  const porDiaAnteriorPorId = new Map(limpiosAnterior.map(p => [p.id, p.porDia]));
  const topAnteriorIds = new Set(
    [...limpiosAnterior].sort((a, b) => b.porDia - a.porDia).slice(0, top).map(p => p.id)
  );

  function enriquecer(p) {
    const porDiaAntes = porDiaAnteriorPorId.get(p.id);
    return {
      ...p,
      riesgo: restriccion(p),
      vendiaAntes: porDiaAntes !== undefined,
      recurrente: topAnteriorIds.has(p.id),
      porDiaAntes: porDiaAntes ?? null,
      tendencia: porDiaAntes === undefined ? null : p.porDia - porDiaAntes
    };
  }

  const laboratorio = limpiosActual.filter(esLaboratorio).map(enriquecer).slice(0, top);
  const normal = limpiosActual.filter(p => !esLaboratorio(p)).map(enriquecer).slice(0, top);

  return {
    actual,
    anterior,
    totalMovimientos: limpiosActual.length,
    totalLaboratorio: limpiosActual.filter(esLaboratorio).length,
    totalNormal: limpiosActual.filter(p => !esLaboratorio(p)).length,
    laboratorio,
    normal,
    archivos
  };
}

// ─── Google Sheets ───────────────────────────────────────────────────────────

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

const NAVY  = { red: 0.10, green: 0.16, blue: 0.29 };
const BLANCO = { red: 1, green: 1, blue: 1 };
const GRIS  = { red: 0.95, green: 0.95, blue: 0.96 };
const VERDE = { red: 0.85, green: 0.94, blue: 0.88 };
const AMBAR = { red: 0.99, green: 0.93, blue: 0.80 };

const COLUMNAS = [
  { titulo: '#',              ancho: 40 },
  { titulo: 'Producto',       ancho: 300 },
  { titulo: 'ID DROPI',       ancho: 85 },
  { titulo: 'Proveedor',      ancho: 85 },
  { titulo: 'Categorías',     ancho: 140 },
  { titulo: 'Stock',          ancho: 65 },
  { titulo: 'Vendidos (ventana)', ancho: 110 },
  { titulo: 'Unid./día',      ancho: 80 },
  { titulo: 'Costo',          ancho: 80 },
  { titulo: 'PVP sugerido',   ancho: 100 },
  { titulo: 'Riesgo Meta',    ancho: 150 },
  { titulo: 'Recurrente',     ancho: 90 },
  { titulo: 'Tendencia u/día', ancho: 110 },
  { titulo: 'Ver en DROPI',   ancho: 130 }
];

function filasDe(lista) {
  return lista.map((p, i) => [
    i + 1,
    p.name,
    p.id,
    p.user_id,
    (p.categorias || []).join(', '),
    p.stock ?? '',
    p.vendidas,
    Number(p.porDia.toFixed(1)),
    p.sale_price,
    p.suggested_price,
    p.riesgo ? p.riesgo.motivo : 'sin restricción',
    p.recurrente ? 'sí — top también la ventana pasada' : (p.vendiaAntes ? 'no' : 'sin dato anterior'),
    p.tendencia === null ? '' : Number(p.tendencia.toFixed(1)),
    `https://app.dropi.ec/dashboard/product-details/${p.id}`
  ]);
}

function formatoHoja(sheetId, filas) {
  const primeraFila = 6;
  const ultimaFila = primeraFila + filas.length + 1;
  return [
    { repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    { repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 4 },
        cell: { userEnteredFormat: { textFormat: { fontSize: 9, foregroundColor: { red: 0.35, green: 0.38, blue: 0.42 } } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    { repeatCell: {
        range: { sheetId, startRowIndex: primeraFila - 1, endRowIndex: primeraFila },
        cell: { userEnteredFormat: {
          backgroundColor: NAVY,
          textFormat: { bold: true, foregroundColor: BLANCO, fontSize: 10 },
          horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', wrapStrategy: 'WRAP'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)'
    }},
    ...[8, 9].map(col => ({
      repeatCell: {
        range: { sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: col, endColumnIndex: col + 1 },
        cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    })),
    { repeatCell: {
        range: { sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: 7, endColumnIndex: 8 },
        cell: { userEnteredFormat: { backgroundColor: VERDE, textFormat: { bold: true } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},
    { addBanding: {
        bandedRange: {
          range: { sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: 0, endColumnIndex: COLUMNAS.length },
          rowProperties: { firstBandColor: BLANCO, secondBandColor: GRIS }
        }
    }},
    { addConditionalFormatRule: {
        rule: {
          ranges: [{ sheetId, startRowIndex: primeraFila, endRowIndex: ultimaFila, startColumnIndex: 10, endColumnIndex: 11 }],
          booleanRule: {
            condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: '=$K7<>"sin restricción"' }] },
            format: { backgroundColor: AMBAR, textFormat: { bold: true } }
          }
        },
        index: 0
    }},
    ...COLUMNAS.map((c, i) => ({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: c.ancho },
        fields: 'pixelSize'
      }
    })),
    { setBasicFilter: {
        filter: { range: { sheetId, startRowIndex: primeraFila - 1, endRowIndex: ultimaFila, startColumnIndex: 0, endColumnIndex: COLUMNAS.length } }
    }}
  ];
}

async function exportar({ top = 20 } = {}) {
  const a = analizar({ top });
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const hoy = new Date().toLocaleDateString('es-EC');
  const titulo = `DROPI Ecuador — Laboratorio vs Normal (${hoy})`;

  const { data: ss } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: titulo, locale: 'en_US' },
      sheets: [
        { properties: { title: 'Laboratorio', gridProperties: { rowCount: top + 12, columnCount: COLUMNAS.length, frozenRowCount: 6 } } },
        { properties: { title: 'Normal', gridProperties: { rowCount: top + 12, columnCount: COLUMNAS.length, frozenRowCount: 6 } } },
        { properties: { title: 'Resumen', gridProperties: { rowCount: 20, columnCount: 6 } } }
      ]
    }
  });

  const spreadsheetId = ss.spreadsheetId;
  const sheetLab = ss.sheets[0].properties.sheetId;
  const sheetNormal = ss.sheets[1].properties.sheetId;
  const sheetResumen = ss.sheets[2].properties.sheetId;

  const encabezado = (etiqueta, total) => [
    [`${titulo.toUpperCase()} — ${etiqueta}`],
    [`Ventana: ${a.actual.desde} → ${a.actual.hasta} (${a.actual.horas.toFixed(1)}h) · ${total} productos de esta categoría con movimiento de stock`],
    [a.anterior ? `Ventana anterior para comparar: ${a.anterior.desde} → ${a.anterior.hasta} (${a.anterior.horas.toFixed(1)}h)` : 'No hay ventana anterior — es el segundo snapshot que existe.'],
    [`"Recurrente" = estuvo en el top ${top} también en la ventana anterior (vendedor consistente, no un pico de un día). "Tendencia" = cuánto subió o bajó su unid./día vs esa ventana.`],
    [],
    COLUMNAS.map(c => c.titulo)
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId, range: 'Laboratorio!A1', valueInputOption: 'USER_ENTERED',
    requestBody: { values: [...encabezado('SALUD / BIENESTAR', a.totalLaboratorio), ...filasDe(a.laboratorio)] }
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: 'Normal!A1', valueInputOption: 'USER_ENTERED',
    requestBody: { values: [...encabezado('RESTO DEL CATÁLOGO', a.totalNormal), ...filasDe(a.normal)] }
  });

  const recurrentesLab = a.laboratorio.filter(p => p.recurrente).length;
  const recurrentesNormal = a.normal.filter(p => p.recurrente).length;

  const filasResumen = [
    ['RESUMEN — comparación con la ventana anterior'],
    [],
    ['', 'Ventana actual', 'Ventana anterior'],
    ['Desde', a.actual.desde, a.anterior ? a.anterior.desde : '—'],
    ['Hasta', a.actual.hasta, a.anterior ? a.anterior.hasta : '—'],
    ['Horas', Number(a.actual.horas.toFixed(1)), a.anterior ? Number(a.anterior.horas.toFixed(1)) : '—'],
    [],
    ['Total productos con movimiento (limpio de ajustes de inventario)', a.totalMovimientos],
    ['  · Laboratorio (Salud/Bienestar)', a.totalLaboratorio],
    ['  · Normal (resto del catálogo)', a.totalNormal],
    ['Productos nuevos en el catálogo', a.actual.nuevos.length],
    [],
    [`Del top ${top} de Laboratorio, cuántos ya vendían fuerte la ventana pasada`, `${recurrentesLab}/${a.laboratorio.length}`],
    [`Del top ${top} de Normal, cuántos ya vendían fuerte la ventana pasada`, `${recurrentesNormal}/${a.normal.length}`],
    [],
    ['Snapshots usados', a.archivos.slice(-3).join(' · ')]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId, range: 'Resumen!A1', valueInputOption: 'USER_ENTERED', requestBody: { values: filasResumen }
  });

  const req = [
    ...formatoHoja(sheetLab, a.laboratorio),
    ...formatoHoja(sheetNormal, a.normal),
    { repeatCell: {
        range: { sheetId: sheetResumen, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    { repeatCell: {
        range: { sheetId: sheetResumen, startRowIndex: 2, endRowIndex: 3 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    { updateDimensionProperties: {
        range: { sheetId: sheetResumen, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 420 }, fields: 'pixelSize'
    }},
    { updateDimensionProperties: {
        range: { sheetId: sheetResumen, dimension: 'COLUMNS', startIndex: 1, endIndex: 3 },
        properties: { pixelSize: 140 }, fields: 'pixelSize'
    }}
  ];

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: req } });

  return { url: ss.spreadsheetUrl, a };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const top = args.includes('--top') ? parseInt(args[args.indexOf('--top') + 1], 10) : 20;

  exportar({ top })
    .then(({ url, a }) => {
      console.log(`\n✅ Laboratorio: ${a.laboratorio.length} · Normal: ${a.normal.length}`);
      console.log(`   ${url}\n`);
    })
    .catch(e => {
      console.error('❌ ' + (e.errors?.[0]?.message || e.message));
      console.error(e.stack);
      process.exit(1);
    });
}

module.exports = { analizar, exportar, esLaboratorio };
