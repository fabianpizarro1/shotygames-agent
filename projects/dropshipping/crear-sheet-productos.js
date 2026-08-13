/**
 * Crea el Google Sheet de investigación de productos: una hoja por producto.
 *
 * Cada hoja junta lo que hoy está disperso — ficha de DROPI, señal de mercado
 * de la Biblioteca de Anuncios, y una calculadora viva — para poder decidir
 * sin ir a buscar a cinco lados. Los campos amarillos son editables: Fabián
 * ajusta el CPA o el precio y la utilidad se recalcula sola.
 *
 * Uso:
 *   node projects/dropshipping/crear-sheet-productos.js
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

const VERDE  = { red: 0.12, green: 0.30, blue: 0.22 };
const BLANCO = { red: 1, green: 1, blue: 1 };
const CREMA  = { red: 0.98, green: 0.97, blue: 0.94 };
const AMARILLO = { red: 1, green: 0.95, blue: 0.75 };   // celdas editables
const GRIS   = { red: 0.94, green: 0.94, blue: 0.95 };

const libreria = (q) =>
  `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=EC&q=${encodeURIComponent(q)}&search_type=keyword_unordered`;

/**
 * Datos verificados el 2026-08-13: catálogo de DROPI + Biblioteca de Anuncios
 * de Meta (Ecuador, solo anuncios activos).
 */
const PRODUCTOS = [
  {
    hoja: '1. Drenaje Aurelys',
    nombre: 'Drenaje Linfático Aurelys 59 ml',
    id: 168103, proveedor: 111202, stock: 613, peso: '80 (son gramos)',
    costo: 5.90, sugerido: 10.00, porDia: 104,
    anuncios: 160, busqueda: 'Aurelys drenaje linfático',
    riesgo: '🟡 MEDIO — evitar "inflamación", "edemas", "sistema inmunológico"',
    precios: [23, 32, 42],
    competidores: [
      ['Bella Essence EC', '$23 (1) · $32 (2)', 'https://www.facebook.com/ads/library/?id=1952192095409868'],
      ['Novy Shop', 'mismo producto exacto', 'https://www.facebook.com/ads/library/?id=1740073640377679'],
      ['Smart Shop', '"Siéntete más ligera"', 'https://www.facebook.com/ads/library/?id=1548070773481580'],
      ['PharmaTodo Ec / Variedad Expreso', 'dropshippers COD', 'https://www.facebook.com/ads/library/?id=2859220067776038']
    ],
    notas: 'ESTADO: landing publicada en avanora.vercel.app/p/drenaje-linfatico — primer test.'
  },
  {
    hoja: '2. Inositol',
    nombre: 'INOSITOL Multivitamin',
    id: 110735, proveedor: 60343, stock: 684, peso: '1 kg',
    costo: 5.00, sugerido: 15.00, porDia: 136,
    anuncios: 29, busqueda: 'inositol',
    riesgo: '🔴 ALTO — la ficha habla de ansiedad, depresión y SOP. Meta lo rechaza.',
    precios: [25, 35, 45],
    competidores: [
      ['Todo x 15', '$15 — ancla de precio baja', 'https://www.facebook.com/ads/library/?id=1428891392627458'],
      ['Laboratorios Blanes', 'laboratorio real, "Bienestar Femenino"', 'https://www.facebook.com/ads/library/?id=930597776717984'],
      ['Comisariato Naturista S.A', 'cadena establecida', 'https://www.facebook.com/ads/library/?id=1308133351073406'],
      ['Tu Endocrino Ec', 'médico endocrinólogo', 'https://www.facebook.com/ads/library/?id=2540749489759725']
    ],
    notas: 'Poca competencia (29 anuncios) pero rivales con respaldo médico y ancla de $15.'
  },
  {
    hoja: '3. FARMAPROX',
    nombre: 'FARMAPROX 30 caps — gel de veneno de abeja',
    id: 102479, proveedor: 63715, stock: 1900, peso: '130 (son gramos)',
    costo: 3.60, sugerido: 10.00, porDia: 112,
    anuncios: 0, busqueda: 'veneno de abeja apitoxina gel',
    riesgo: '🔴 ALTO — la ficha lo llama "analgésico y antiinflamatorio". Claim médico directo.',
    precios: [24, 34, 44],
    competidores: [
      ['NINGUNO', '0 anuncios activos en Ecuador', libreria('veneno de abeja apitoxina')]
    ],
    notas: 'EL MÁS INTERESANTE: cero competencia en la Biblioteca de Anuncios, costo más bajo ($3.60) y stock de 1.900. Sin ancla de precio, el precio lo pones tú. El freno es el riesgo de Meta, no el mercado.'
  },
  {
    hoja: '4. Clorofila',
    nombre: 'Clorofila líquida 59 ml',
    id: 131953, proveedor: 111202, stock: 799, peso: '60 (son gramos)',
    costo: 4.80, sugerido: 15.00, porDia: 36,
    anuncios: 43, busqueda: 'clorofila líquida',
    riesgo: '🟡 MEDIO — evitar "desintoxicar" y "purificante" en el copy.',
    precios: [23, 32, 42],
    competidores: [
      ['Tu tienda aliada Ecuador', '"¿Te sientes hinchada?"', 'https://www.facebook.com/ads/library/?id=1616467239908080'],
      ['Ideal Store', '"Envío gratis + Pago contra entrega"', 'https://www.facebook.com/ads/library/?id=1446472574202263'],
      ['Tu tienda aliada Ecuador', '"Menos hinchazón"', 'https://www.facebook.com/ads/library/?id=925654889893063']
    ],
    notas: 'Mismo proveedor que el Drenaje (111202) — se podrían combinar en un solo envío.'
  },
  {
    hoja: '5. Glucosamina',
    nombre: 'Glucosamina Forte 6 en 1',
    id: 118553, proveedor: 89063, stock: 228, peso: '1 kg',
    costo: 6.50, sugerido: 15.00, porDia: 34,
    anuncios: 46, busqueda: 'glucosamina colágeno articulaciones',
    riesgo: '🟡 MEDIO — hablar de movilidad y actividad, nunca de dolor ni artritis.',
    precios: [28, 39, 49],
    competidores: [
      ['Tiendanexon', '"¿El dolor en tus rodillas no te deja disfrutar?"', 'https://www.facebook.com/ads/library/?id=1510572520756692'],
      ['Tiendanexon', '"No todas las glucosaminas son iguales"', 'https://www.facebook.com/ads/library/?id=1192817720592230'],
      ['Vital Nat Distribuidora Natural', 'distribuidora natural', 'https://www.facebook.com/ads/library/?id=2086926305235125']
    ],
    notas: 'Ticket más alto y público mayor. Tiendanexon usa ángulos de dolor muy directos — copiar la estructura, no el claim.'
  },
  {
    hoja: '6. Melaxin',
    nombre: 'COMBO 2 Melaxin — despigmentante',
    id: 140055, proveedor: 111202, stock: 224, peso: '300 (son gramos)',
    costo: 8.99, sugerido: 20.00, porDia: 30,
    anuncios: 85, busqueda: 'despigmentante manchas piel',
    riesgo: '🔴 ALTO — aclarado de piel es categoría restringida por Meta.',
    precios: [30, 42, 54],
    competidores: [
      ['Dermotienda.ec', '$9.99 a $27.57 (varios productos)', 'https://www.facebook.com/ads/library/?id=1889029358726772'],
      ['Belcosmetics Skincare', 'skincare establecido', 'https://www.facebook.com/ads/library/?id=1016762404695160'],
      ['Dra. Gabriela Villavicencio', 'médica estética', 'https://www.facebook.com/ads/library/?id=2024245604877634']
    ],
    notas: 'Mismo proveedor que Drenaje y Clorofila (111202). El de mayor riesgo — dejarlo para el final.'
  }
];

function filasProducto(p) {
  const f = [];
  const push = (...celdas) => f.push(celdas);

  push(p.nombre);
  push('Ver en DROPI', `https://app.dropi.ec/dashboard/product-details/${p.id}`);
  push();

  push('FICHA DEL PRODUCTO');
  push('ID DROPI', p.id);
  push('Proveedor', p.proveedor);
  push('Stock disponible', p.stock);
  push('Peso declarado', p.peso, '⚠️ los proveedores mezclan gramos y kilos');
  push('COSTO PROVEEDOR', p.costo, '← editable, alimenta la calculadora');
  push('Precio sugerido por DROPI', p.sugerido, 'ignorar: está pensado para mayoristas');
  push('Movimiento medido', p.porDia, 'unidades por día (delta de stock real)');
  push();

  push('SEÑAL DE MERCADO');
  push('Anuncios activos en Ecuador', p.anuncios);
  push('Buscar en Biblioteca de Anuncios', libreria(p.busqueda));
  push('Riesgo en Meta', p.riesgo);
  push();
  push('Competidor', 'Precio / ángulo', 'Anuncio');
  p.competidores.forEach((c) => push(...c));
  push();

  push('CALCULADORA  —  edita las celdas amarillas');
  push('Flete', 6.38, 'lo que descuenta DROPI al entregar');
  push('Flete de retorno', 0, 'DROPI NO lo cobra en contra entrega');
  push('Tasa de entrega', 0.7, 'supuesto hasta tener dato propio');
  push('CPA (costo por pedido en Meta)', 10, '← el número a medir con el primer test');
  push();
  push('Oferta', 'Unid.', 'Precio', 'Costo prod.', 'Utilidad', 'Margen', 'CPA máximo', 'Veredicto');

  return f;
}

async function crear() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const { data: ss } = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'AVANORA — Investigación de productos', locale: 'en_US' },
      sheets: [
        { properties: { title: 'RESUMEN', gridProperties: { rowCount: 30, columnCount: 10 } } },
        ...PRODUCTOS.map((p) => ({
          properties: { title: p.hoja, gridProperties: { rowCount: 60, columnCount: 8 } }
        }))
      ]
    }
  });

  const spreadsheetId = ss.spreadsheetId;
  const idHoja = {};
  ss.sheets.forEach((s) => (idHoja[s.properties.title] = s.properties.sheetId));

  // ── Contenido por producto ────────────────────────────────────────────────
  const requests = [];

  for (const p of PRODUCTOS) {
    const filas = filasProducto(p);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${p.hoja}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: filas }
    });

    // Filas de la calculadora: una por combo, con fórmulas vivas
    const filaEncabezado = filas.length;          // 1-indexado = última escrita
    const primeraCombo = filaEncabezado + 1;
    const C = 9;   // fila del COSTO PROVEEDOR
    const F = filaEncabezado - 5;  // Flete
    const R = filaEncabezado - 4;  // retorno
    const E = filaEncabezado - 3;  // entrega
    const A = filaEncabezado - 2;  // CPA

    const combos = p.precios.map((precio, i) => {
      const u = i + 1;
      const r = primeraCombo + i;
      return [
        `${u} unidad${u > 1 ? 'es' : ''}`,
        u,
        precio,
        `=$B$${C}*B${r}`,
        `=$B$${E}*(C${r}-D${r}-$B$${F})-(1-$B$${E})*($B$${F}+$B$${R})-$B$${A}`,
        `=IFERROR(E${r}/($B$${E}*C${r}),"")`,
        `=$B$${E}*(C${r}-D${r}-$B$${F})-(1-$B$${E})*($B$${F}+$B$${R})`,
        `=IF(E${r}>=0,IF(F${r}>=0.2,"🟢 sirve","🟡 justo"),"🔴 pierde")`
      ];
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${p.hoja}'!A${primeraCombo}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: combos }
    });

    const filaNotas = primeraCombo + combos.length + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${p.hoja}'!A${filaNotas}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['MIS NOTAS'], [p.notas], [''], [''], [''], ['']] }
    });

    // ── Formato de esta hoja ──
    const sid = idHoja[p.hoja];
    const titulo = (fila) => ({
      repeatCell: {
        range: { sheetId: sid, startRowIndex: fila - 1, endRowIndex: fila, startColumnIndex: 0, endColumnIndex: 8 },
        cell: { userEnteredFormat: { backgroundColor: VERDE, textFormat: { bold: true, foregroundColor: BLANCO } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
      }
    });

    requests.push(
      { repeatCell: {
          range: { sheetId: sid, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
          fields: 'userEnteredFormat.textFormat'
      }},
      titulo(4), titulo(14), titulo(filaEncabezado - 6), titulo(filaEncabezado), titulo(filaNotas),
      // Celdas editables en amarillo
      ...[C, F, R, E, A].map((fila) => ({
        repeatCell: {
          range: { sheetId: sid, startRowIndex: fila - 1, endRowIndex: fila, startColumnIndex: 1, endColumnIndex: 2 },
          cell: { userEnteredFormat: { backgroundColor: AMARILLO } },
          fields: 'userEnteredFormat.backgroundColor'
        }
      })),
      ...p.precios.map((_, i) => ({
        repeatCell: {
          range: { sheetId: sid, startRowIndex: primeraCombo + i - 1, endRowIndex: primeraCombo + i, startColumnIndex: 2, endColumnIndex: 3 },
          cell: { userEnteredFormat: { backgroundColor: AMARILLO } },
          fields: 'userEnteredFormat.backgroundColor'
        }
      })),
      // Moneda y porcentaje en la calculadora
      { repeatCell: {
          range: { sheetId: sid, startRowIndex: primeraCombo - 1, endRowIndex: primeraCombo + 3, startColumnIndex: 2, endColumnIndex: 5 },
          cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
          fields: 'userEnteredFormat.numberFormat'
      }},
      { repeatCell: {
          range: { sheetId: sid, startRowIndex: primeraCombo - 1, endRowIndex: primeraCombo + 3, startColumnIndex: 6, endColumnIndex: 7 },
          cell: { userEnteredFormat: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } } },
          fields: 'userEnteredFormat.numberFormat'
      }},
      { repeatCell: {
          range: { sheetId: sid, startRowIndex: primeraCombo - 1, endRowIndex: primeraCombo + 3, startColumnIndex: 5, endColumnIndex: 6 },
          cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0%' } } },
          fields: 'userEnteredFormat.numberFormat'
      }},
      { repeatCell: {
          range: { sheetId: sid, startRowIndex: E - 1, endRowIndex: E, startColumnIndex: 1, endColumnIndex: 2 },
          cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0%' } } },
          fields: 'userEnteredFormat.numberFormat'
      }},
      { updateDimensionProperties: {
          range: { sheetId: sid, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
          properties: { pixelSize: 250 }, fields: 'pixelSize'
      }},
      { updateDimensionProperties: {
          range: { sheetId: sid, dimension: 'COLUMNS', startIndex: 1, endIndex: 3 },
          properties: { pixelSize: 150 }, fields: 'pixelSize'
      }},
      { updateDimensionProperties: {
          range: { sheetId: sid, dimension: 'COLUMNS', startIndex: 3, endIndex: 8 },
          properties: { pixelSize: 130 }, fields: 'pixelSize'
      }}
    );
  }

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  const resumen = [
    ['AVANORA — PRODUCTOS EN EVALUACIÓN'],
    ['Una hoja por producto. Las celdas amarillas son editables y la calculadora se recalcula sola.'],
    ['Datos verificados el 2026-08-13 contra el catálogo de DROPI y la Biblioteca de Anuncios de Meta (Ecuador).'],
    [],
    ['Producto', 'ID DROPI', 'Costo', 'u/día', 'Anuncios EC', 'Riesgo Meta', 'Orden de testeo'],
    ...PRODUCTOS.map((p, i) => [
      p.nombre, p.id, p.costo, p.porDia, p.anuncios,
      p.riesgo.split('—')[0].trim(),
      ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 1', 'Semana 2', 'Semana 3'][i]
    ]),
    [],
    ['LO QUE HAY QUE RECORDAR'],
    ['El CPA de $10 viene de Shotygames. Para Avanora todavía no se ha medido — ese es el objetivo del primer test.'],
    ['El peso de los productos viene en gramos, no en kilos. Falta verificar si DROPI cobra flete por peso.'],
    ['El copy del anuncio NO puede repetir los claims médicos de la ficha del proveedor: es rechazo seguro.'],
    ['FARMAPROX no tiene competencia en la Biblioteca de Anuncios — sin ancla de precio, pero con el riesgo de Meta más alto.']
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'RESUMEN!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: resumen }
  });

  const sidR = idHoja['RESUMEN'];
  requests.push(
    { repeatCell: {
        range: { sheetId: sidR, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
        fields: 'userEnteredFormat.textFormat'
    }},
    { repeatCell: {
        range: { sheetId: sidR, startRowIndex: 4, endRowIndex: 5 },
        cell: { userEnteredFormat: { backgroundColor: VERDE, textFormat: { bold: true, foregroundColor: BLANCO } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},
    { repeatCell: {
        range: { sheetId: sidR, startRowIndex: 12, endRowIndex: 13 },
        cell: { userEnteredFormat: { backgroundColor: VERDE, textFormat: { bold: true, foregroundColor: BLANCO } } },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }},
    { updateDimensionProperties: {
        range: { sheetId: sidR, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 330 }, fields: 'pixelSize'
    }},
    { updateDimensionProperties: {
        range: { sheetId: sidR, dimension: 'COLUMNS', startIndex: 1, endIndex: 7 },
        properties: { pixelSize: 120 }, fields: 'pixelSize'
    }}
  );

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });

  return { url: ss.spreadsheetUrl, hojas: PRODUCTOS.length + 1 };
}

if (require.main === module) {
  crear()
    .then((r) => console.log(`\n✅ ${r.hojas} hojas creadas\n   ${r.url}\n`))
    .catch((e) => { console.error('❌ ' + (e.errors?.[0]?.message || e.message)); process.exit(1); });
}

module.exports = { crear, PRODUCTOS };
