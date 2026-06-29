/**
 * notificaciones.js — Reportes automáticos y manuales del bot OPS
 */

const https = require('https');
const sheets = require('./sheets');

const OPS_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = process.env.TELEGRAM_ADMIN_IDS?.split(',')[0];

function sendTelegramMsg(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function enviarReporteOPS(hora = '') {
  if (!OPS_TOKEN || !ADMIN_CHAT) {
    console.log('[NOTIF] Sin token OPS o ADMIN_CHAT — omitiendo reporte');
    return;
  }

  try {
    // Pedidos pendientes
    const reporte = await sheets.reportePedidos('todos', 'PENDIENTE');
    const totalPendientes = reporte?.totalPedidos ?? 0;
    const pedidos = reporte?.pedidos ?? [];

    // Stock
    const stock = await sheets.leerStock();

    // Construir mensaje
    const ahora = hora || new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' });
    let msg = `📦 <b>REPORTE OPS — ${ahora}</b>\n\n`;

    // Pedidos pendientes
    if (totalPendientes === 0) {
      msg += `✅ Sin pedidos pendientes\n`;
    } else {
      msg += `🔴 <b>PENDIENTES: ${totalPendientes}</b>\n`;
      pedidos.slice(0, 8).forEach(p => {
        const prods = [];
        if (parseInt(p.normal) > 0) prods.push(`${p.normal} Normal`);
        if (parseInt(p.picante) > 0) prods.push(`${p.picante} Picante`);
        if (parseInt(p.parejas) > 0) prods.push(`${p.parejas} Parejas`);
        if (parseInt(p.enganchados) > 0) prods.push(`${p.enganchados} Eng`);
        if (parseInt(p.dados) > 0) prods.push(`${p.dados} Dados`);
        const prodStr = prods.length ? ` — ${prods.join(', ')}` : '';
        msg += `• ${p.nombre}${prodStr}\n`;
      });
      if (totalPendientes > 8) msg += `... y ${totalPendientes - 8} más\n`;
    }

    // Stock
    if (stock.length > 0) {
      msg += `\n📦 <b>STOCK ACTUAL:</b>\n`;
      stock.forEach(s => {
        const ok = s.falta <= 0;
        const icono = ok ? '✅' : '❌';
        const alertaFalta = !ok ? ` ← FALTAN ${s.falta}` : '';
        msg += `${icono} ${s.juego}: ${s.tengo} (necesito: ${s.necesito})${alertaFalta}\n`;
      });
    }

    await sendTelegramMsg(OPS_TOKEN, ADMIN_CHAT, msg);
    console.log(`[NOTIF] Reporte OPS enviado — ${ahora}`);
  } catch (err) {
    console.error('[NOTIF] Error enviando reporte OPS:', err.message);
  }
}

module.exports = { enviarReporteOPS };
