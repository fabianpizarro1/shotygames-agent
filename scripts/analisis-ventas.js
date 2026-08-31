#!/usr/bin/env node
/**
 * Resumen de ventas reales desde los Sheets — para el análisis nocturno de campañas.
 *
 *   node scripts/analisis-ventas.js            → JSON con hoy / ayer / semana / total
 *   node scripts/analisis-ventas.js --fecha 2026-08-25   → toma esa fecha como "hoy"
 *
 * Fuentes de verdad:
 *   - 2026 REGISTRO DE VENTAS   → hoja PEDIDOS.  TODA fila es venta real (cualquier ESTADO).
 *   - 2026 VENTAS DIGITALES     → hoja VENTAS.   Solo ESTADO = PAGADO es venta.
 *   - PEDIDOS LOVABLE           → hoja PEDIDOS.  Pedidos web; ESTADO = SIN COMPRAR = carrito abandonado.
 *   - DROPSHIPPING — Pedidos    → hoja PEDIDOS.  Truquito + Avanora, contra entrega (COD).
 *                                 Pedido generado != plata cobrada: solo ESTADO = PAGADO es venta cobrada.
 */
require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const api = google.sheets({ version: 'v4', auth });

function monto(val) {
  if (val === '' || val == null) return 0;
  let s = String(val).replace(/\$/g, '').trim();
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// "05/01/2026" o "1/01/2026" → "2026-01-05". Soporta también seriales de Sheets.
function aISO(val) {
  if (val === '' || val == null) return null;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + parseFloat(s) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m2 ? m2[0] : null;
}

function diasAtras(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Lunes de la semana calendario que contiene `iso`. "Semana" siempre es lunes-domingo, no rolling 7 días.
function lunesDeEstaSemana(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  const diaSemana = d.getUTCDay(); // 0=domingo ... 6=sábado
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

async function leer(spreadsheetId, range) {
  const r = await api.spreadsheets.values.get({ spreadsheetId, range });
  const filas = r.data.values || [];
  const head = filas[0] || [];
  const idx = (nombre) => head.indexOf(nombre);
  return { filas: filas.slice(1), idx };
}

function vacio() { return { pedidos: 0, ingreso: 0, utilidad: 0 }; }

function acumular(cubos, iso, ventanas, ingreso, utilidad) {
  for (const [nombre, test] of ventanas) {
    if (test(iso)) {
      cubos[nombre].pedidos += 1;
      cubos[nombre].ingreso += ingreso;
      cubos[nombre].utilidad += utilidad;
    }
  }
}

function redondear(cubos) {
  for (const c of Object.values(cubos)) {
    c.ingreso = Math.round(c.ingreso * 100) / 100;
    c.utilidad = Math.round(c.utilidad * 100) / 100;
  }
  return cubos;
}

async function main() {
  const argFecha = (() => {
    const i = process.argv.indexOf('--fecha');
    return i > -1 ? process.argv[i + 1] : null;
  })();
  const hoy = argFecha || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
  const ayer = diasAtras(hoy, 1);
  const inicioSemana = lunesDeEstaSemana(hoy); // semana calendario lunes-domingo, no rolling 7 días

  const ventanas = [
    ['hoy', (d) => d === hoy],
    ['ayer', (d) => d === ayer],
    ['semana', (d) => d >= inicioSemana && d <= hoy],
    ['total', () => true],
  ];
  const nuevosCubos = () => Object.fromEntries(ventanas.map(([n]) => [n, vacio()]));

  const salida = { generado: new Date().toISOString(), hoy, ayer, semana_desde: inicioSemana };

  // --- 2026 REGISTRO DE VENTAS / PEDIDOS: toda fila es venta real ---
  {
    const { filas, idx } = await leer(process.env.SHEETS_ID, 'PEDIDOS!A1:AZ5000');
    const c = nuevosCubos();
    const productos = {};
    let sinFecha = 0;
    for (const row of filas) {
      if (!row[idx('NOMBRE')] && !row[idx('TELEFONO')]) continue;
      const iso = aISO(row[idx('FECHA')]);
      if (!iso) { sinFecha++; continue; }
      const ingreso = monto(row[idx('ANTICIPO')]) + monto(row[idx('SALDO')]);
      acumular(c, iso, ventanas, ingreso, monto(row[idx('UTILIDAD')]));
      if (iso >= inicioSemana) {
        const p = String(row[idx('PRODUCTOS')] || 'SIN DETALLE').toUpperCase();
        productos[p] = (productos[p] || 0) + 1;
      }
    }
    salida.fisicos = { fuente: '2026 REGISTRO DE VENTAS / PEDIDOS', regla: 'toda fila = venta real', ...redondear(c), productos_semana: productos, filas_sin_fecha: sinFecha };
  }

  // --- 2026 VENTAS DIGITALES / VENTAS: solo ESTADO = PAGADO ---
  {
    const { filas, idx } = await leer(process.env.SHEETS_ID_VENTAS_DIGITALES, 'VENTAS!A1:AZ5000');
    const c = nuevosCubos();
    const pend = nuevosCubos();
    for (const row of filas) {
      const iso = aISO(row[idx('FECHA')]);
      if (!iso) continue;
      const ingreso = monto(row[idx('INGRESOS')]);
      const estado = String(row[idx('ESTADO')] || '').trim().toUpperCase();
      if (estado === 'PAGADO') acumular(c, iso, ventanas, ingreso, ingreso);
      else acumular(pend, iso, ventanas, ingreso, 0);
    }
    salida.digitales = { fuente: '2026 VENTAS DIGITALES / VENTAS', regla: 'solo ESTADO = PAGADO cuenta como venta', ...redondear(c), no_pagados: redondear(pend) };
  }

  // --- PEDIDOS LOVABLE: contexto web, NO son ventas confirmadas ---
  {
    const { filas, idx } = await leer(process.env.SHEETS_ID_PEDIDOS_WEB, 'PEDIDOS!A1:AZ5000');
    const c = nuevosCubos();
    const abandonados = nuevosCubos();
    const conAtribucionMeta = nuevosCubos();
    for (const row of filas) {
      const iso = aISO(row[idx('FECHA')]);
      if (!iso) continue;
      const ingreso = monto(row[idx('INGRESO')]);
      acumular(c, iso, ventanas, ingreso, 0);
      const estado = String(row[idx('ESTADO')] || '').trim().toUpperCase();
      if (estado === 'SIN COMPRAR') acumular(abandonados, iso, ventanas, ingreso, 0);
      if (row[idx('FBC')] || row[idx('FBP')] || row[idx('FBCLID')]) acumular(conAtribucionMeta, iso, ventanas, ingreso, 0);
    }
    salida.web_lovable = {
      fuente: 'PEDIDOS LOVABLE / PEDIDOS',
      regla: 'NO son ventas confirmadas — solo contexto de checkout',
      todos: redondear(c),
      abandonados: redondear(abandonados),
      con_atribucion_meta: redondear(conAtribucionMeta),
    };
  }

  // --- DROPSHIPPING (Truquito + Avanora): COD, pedido generado != plata cobrada ---
  {
    const { filas, idx } = await leer(process.env.SHEETS_ID_DROPSHIPPING, 'PEDIDOS!A1:AZ5000');
    const iTienda = idx('TIENDA'), iEstado = idx('ESTADO'), iFecha = idx('FECHA'),
          iFPago = idx('FECHA PAGO'), iTotal = idx('TOTAL COBRAR'), iUtil = idx('UTILIDAD REAL'),
          iProd = idx('PRODUCTO'), iCPA = idx('CPA');

    const porTienda = {};
    const tienda = (n) => (porTienda[n] ||= {
      generados: nuevosCubos(),      // por FECHA de creación — lo que produjo el ads
      cobrados: nuevosCubos(),       // por FECHA PAGO — plata que entró de verdad
      en_ruta: nuevosCubos(),        // EN_DROPI / GUIA_GENERADA — todavía no se sabe
      cancelados: nuevosCubos(),
      sin_confirmar: nuevosCubos(),  // PENDIENTE_CONFIRMACION
      productos_semana: {},
    });

    for (const row of filas) {
      if (!row[0]) continue;
      const t = String(row[iTienda] || 'sin-tienda').toLowerCase().trim();
      const est = String(row[iEstado] || '').toUpperCase().trim();
      const iso = aISO(row[iFecha]);
      const total = monto(row[iTotal]);
      const util = monto(row[iUtil]);
      const d = tienda(t);

      if (iso) {
        if (est !== 'CANCELADO') acumular(d.generados, iso, ventanas, total, util);
        if (est === 'CANCELADO') acumular(d.cancelados, iso, ventanas, total, 0);
        if (est === 'PENDIENTE_CONFIRMACION') acumular(d.sin_confirmar, iso, ventanas, total, 0);
        if (est === 'EN_DROPI' || est === 'GUIA_GENERADA') acumular(d.en_ruta, iso, ventanas, total, 0);
        if (iso >= inicioSemana && est !== 'CANCELADO') {
          const p = String(row[iProd] || 'SIN DETALLE').trim();
          d.productos_semana[p] = (d.productos_semana[p] || 0) + 1;
        }
      }
      if (est === 'PAGADO') {
        const isoPago = aISO(row[iFPago]) || iso;
        if (isoPago) acumular(d.cobrados, isoPago, ventanas, total, util);
      }
    }

    const todas = { generados: nuevosCubos(), cobrados: nuevosCubos(), en_ruta: nuevosCubos(), cancelados: nuevosCubos(), sin_confirmar: nuevosCubos() };
    for (const d of Object.values(porTienda)) {
      for (const k of Object.keys(todas)) {
        for (const [n] of ventanas) {
          todas[k][n].pedidos += d[k][n].pedidos;
          todas[k][n].ingreso += d[k][n].ingreso;
          todas[k][n].utilidad += d[k][n].utilidad;
        }
      }
      for (const k of ['generados', 'cobrados', 'en_ruta', 'cancelados', 'sin_confirmar']) redondear(d[k]);
    }
    for (const k of Object.keys(todas)) redondear(todas[k]);

    // Tasa de entrega real: de los pedidos que ya se resolvieron, cuántos se cobraron.
    const cerrados = todas.cobrados.total.pedidos + todas.cancelados.total.pedidos;
    salida.dropshipping = {
      fuente: 'DROPSHIPPING — Pedidos (Truquito + Avanora) / PEDIDOS',
      regla: 'COD: pedido generado NO es venta. Solo ESTADO = PAGADO es plata cobrada. "generados" va por FECHA de creación (atribuible al ads), "cobrados" por FECHA PAGO.',
      por_tienda: porTienda,
      todas,
      tasa_cobro_historica: cerrados >= 10
        ? Math.round((todas.cobrados.total.pedidos / cerrados) * 1000) / 10 + '%'
        : `muestra chica (${cerrados} pedidos resueltos) — no sirve todavía para decidir`,
      pendientes_de_resolver: todas.en_ruta.total.pedidos + todas.sin_confirmar.total.pedidos,
    };
  }

  const combinado = nuevosCubos();
  for (const [n] of ventanas) {
    combinado[n].pedidos = salida.fisicos[n].pedidos + salida.digitales[n].pedidos;
    combinado[n].ingreso = Math.round((salida.fisicos[n].ingreso + salida.digitales[n].ingreso) * 100) / 100;
    combinado[n].utilidad = Math.round((salida.fisicos[n].utilidad + salida.digitales[n].utilidad) * 100) / 100;
  }
  salida.ventas_reales_totales = combinado;

  console.log(JSON.stringify(salida, null, 2));
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
