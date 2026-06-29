/**
 * notificaciones.js — Reportes automáticos de todos los bots
 *
 * OPS:   8am, 12pm, 3pm  — pedidos pendientes + stock
 * DROPI: 10pm             — saldo DROPI
 * CONTA: 8am              — total en cuentas
 * CONTA: 10pm             — cierre del día (ingresos, gastos, saldos teóricos)
 */

const https = require('https');
const sheets = require('./sheets');
const conta = require('./sheets-conta');
const dropi = require('./dropi');

const CHAT = process.env.TELEGRAM_ADMIN_IDS?.split(',')[0];
const TOKENS = {
  ops:      process.env.TELEGRAM_BOT_TOKEN,
  conta:    process.env.TELEGRAM_CONTA_TOKEN,
  dropi:    process.env.TELEGRAM_DROPI_TOKEN,
  personal: process.env.TELEGRAM_PERSONAL_TOKEN,
};

// ── Helper: enviar mensaje Telegram ─────────────────────────
function tg(bot, text) {
  const token = TOKENS[bot];
  if (!token || !CHAT) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function fechaHoyEC() {
  return new Date().toLocaleDateString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Guayaquil'
  });
}

function calcularDiasPendiente(fechaStr) {
  if (!fechaStr) return 0;
  const parts = fechaStr.split('/');
  if (parts.length !== 3) return 0;
  const [d, m, y] = parts;
  const fecha = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((hoy - fecha) / 86400000));
}

function horaEC() {
  return new Date().toLocaleTimeString('es-EC', {
    timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit'
  });
}

// ── Helper: leer hoja de finanzas y filtrar por hoy ─────────
async function leerMovimientosHoy() {
  const SHEET_FIN = process.env.SHEETS_ID_FINANZAS;
  const auth = (() => {
    const { google } = require('googleapis');
    const a = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    a.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return google.sheets({ version: 'v4', auth: a });
  })();

  const hoy = fechaHoyEC();

  async function getHoja(nombre) {
    const res = await auth.spreadsheets.values.get({ spreadsheetId: SHEET_FIN, range: `${nombre}!A:F` });
    const rows = (res.data.values || []).slice(1);
    return rows.filter(r => r[0] === hoy);
  }

  const [gastos, ingresos, transferencias] = await Promise.all([
    getHoja('GASTOS'), getHoja('INGRESOS'), getHoja('TRANSFERENCIAS')
  ]);

  // Calcular totales
  const totalGastos = gastos.reduce((s, r) => s + (parseFloat(r[5]) || 0), 0);
  const totalIngresos = ingresos.reduce((s, r) => s + (parseFloat(r[5]) || 0), 0);

  // Movimiento por cuenta hoy
  const movCuenta = {};
  ingresos.forEach(r => {
    const c = r[4]?.toUpperCase() || 'CAJA';
    movCuenta[c] = (movCuenta[c] || 0) + (parseFloat(r[5]) || 0);
  });
  gastos.forEach(r => {
    const c = r[4]?.toUpperCase() || 'CAJA';
    movCuenta[c] = (movCuenta[c] || 0) - (parseFloat(r[5]) || 0);
  });
  transferencias.forEach(r => {
    const sale = r[2]?.toUpperCase();
    const entra = r[3]?.toUpperCase();
    const val = parseFloat(r[5]) || 0;
    if (sale) movCuenta[sale] = (movCuenta[sale] || 0) - val;
    if (entra) movCuenta[entra] = (movCuenta[entra] || 0) + val;
  });

  return { gastos, ingresos, transferencias, totalGastos, totalIngresos, movCuenta };
}

// ════════════════════════════════════════════════════════════
// BOT OPS — 8am / 12pm / 3pm
// ════════════════════════════════════════════════════════════
async function enviarReporteOPS(hora = '') {
  if (!TOKENS.ops || !CHAT) return;
  try {
    const reporte = await sheets.reportePedidos('PENDIENTES', 'PENDIENTE');
    const totalPendientes = reporte?.total ?? 0;
    const pedidos = reporte?.pedidos ?? [];
    const stock = await sheets.leerStock();

    const ahora = hora || horaEC();
    let msg = `📦 <b>REPORTE OPS — ${ahora}</b>\n\n`;

    if (totalPendientes === 0) {
      msg += `✅ Sin pedidos pendientes\n`;
    } else {
      msg += `🔴 <b>PENDIENTES: ${totalPendientes}</b>\n`;
      pedidos.slice(0, 8).forEach(p => {
        const dias = calcularDiasPendiente(p.fecha);
        const diasStr = dias >= 1 ? ` ⏳${dias}d` : '';
        const ciudad = p.ciudad ? ` — ${p.ciudad}` : '';
        const prods = p.productos || '';
        msg += `• ${p.nombre}${diasStr}${ciudad}${prods ? ` — ${prods}` : ''}\n`;
      });
      if (totalPendientes > 8) msg += `... y ${totalPendientes - 8} más\n`;
    }

    if (stock.length > 0) {
      msg += `\n📦 <b>STOCK:</b>\n`;
      stock.forEach(s => {
        msg += `${s.falta > 0 ? '❌' : '✅'} ${s.juego}: ${s.tengo}${s.falta > 0 ? ` ← FALTAN ${s.falta}` : ''}\n`;
      });
    }

    await tg('ops', msg);
    console.log(`[NOTIF] OPS enviado — ${ahora}`);
  } catch (err) {
    console.error('[NOTIF OPS]', err.message);
  }
}

// ════════════════════════════════════════════════════════════
// BOT DROPI — 10pm — Saldo DROPI
// ════════════════════════════════════════════════════════════
async function enviarSaldoDropi() {
  if (!TOKENS.dropi || !CHAT) return;
  try {
    const { saldo, congelado } = await dropi.getSaldoDropi();
    const msg = `💰 <b>SALDO DROPI — ${horaEC()}</b>\n\n<b>$${parseFloat(saldo || 0).toFixed(2)}</b>${congelado ? '\n\n⚠️ Saldo congelado' : ''}`;
    await tg('dropi', msg);
    console.log('[NOTIF] Saldo DROPI enviado');
  } catch (err) {
    console.error('[NOTIF DROPI]', err.message);
  }
}

// ════════════════════════════════════════════════════════════
// BOT CONTA — 8am — Total en cuentas
// ════════════════════════════════════════════════════════════
async function enviarSaldosMañana() {
  if (!TOKENS.conta || !CHAT) return;
  try {
    const { saldos, total } = await conta.leerSaldosReales();

    let msg = `💰 <b>BUENOS DÍAS — SALDOS AL ${fechaHoyEC()}</b>\n\n`;
    saldos.forEach(s => {
      msg += `• ${s.cuenta}: <b>$${s.saldo.toFixed(2)}</b> (al ${s.actualizado})\n`;
    });
    msg += `\n<b>TOTAL: $${total.toFixed(2)}</b>`;

    if (total < 200) msg += `\n\n⚠️ Liquidez crítica — menos de $200.`;

    await tg('conta', msg);
    console.log('[NOTIF] Saldos mañana enviado');
  } catch (err) {
    console.error('[NOTIF CONTA mañana]', err.message);
  }
}

// ════════════════════════════════════════════════════════════
// BOT CONTA — 10pm — Cierre del día
// ════════════════════════════════════════════════════════════
async function enviarCierreNoche() {
  if (!TOKENS.conta || !CHAT) return;
  try {
    const { gastos, ingresos, transferencias, totalGastos, totalIngresos, movCuenta } = await leerMovimientosHoy();
    const { saldos, total: totalAnterior } = await conta.leerSaldosReales();

    const netoDia = totalIngresos - totalGastos;

    let msg = `📊 <b>CIERRE DEL DÍA — ${fechaHoyEC()}</b>\n\n`;

    // Resumen del día
    msg += `✅ <b>INGRESÓ:</b> $${totalIngresos.toFixed(2)}`;
    if (ingresos.length) {
      ingresos.slice(0, 5).forEach(r => msg += `\n  · ${r[2]} — $${parseFloat(r[5]).toFixed(2)}`);
    }

    msg += `\n\n❌ <b>SALIÓ:</b> $${totalGastos.toFixed(2)}`;
    if (gastos.length) {
      gastos.slice(0, 5).forEach(r => msg += `\n  · ${r[2]} — $${parseFloat(r[5]).toFixed(2)}`);
    }

    if (transferencias.length) {
      msg += `\n\n🔄 <b>TRANSFERENCIAS:</b>`;
      transferencias.forEach(r => msg += `\n  · $${parseFloat(r[5]).toFixed(2)} de ${r[2]} → ${r[3]}`);
    }

    msg += `\n\n<b>NETO DEL DÍA: ${netoDia >= 0 ? '+' : ''}$${netoDia.toFixed(2)}</b>`;

    // Saldos teóricos (último real conocido + movimientos de hoy)
    msg += `\n\n💼 <b>SALDOS TEÓRICOS (lo que debería haber):</b>`;
    const saldoMap = {};
    saldos.forEach(s => saldoMap[s.cuenta] = s.saldo);

    // Aplicar movimientos del día
    Object.entries(movCuenta).forEach(([cuenta, delta]) => {
      saldoMap[cuenta] = (saldoMap[cuenta] || 0) + delta;
    });

    Object.entries(saldoMap).forEach(([cuenta, saldo]) => {
      msg += `\n• ${cuenta}: $${saldo.toFixed(2)}`;
    });

    msg += `\n\n<i>Dime cuánto hay real en cada cuenta para actualizar y cuadrar. Ejemplo:\nCaja: 15, Pichincha: 320, Payphone: 80</i>`;

    await tg('conta', msg);
    console.log('[NOTIF] Cierre noche enviado');
  } catch (err) {
    console.error('[NOTIF CONTA noche]', err.message);
  }
}

module.exports = { enviarReporteOPS, enviarSaldoDropi, enviarSaldosMañana, enviarCierreNoche };
