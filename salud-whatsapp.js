/**
 * salud-whatsapp.js — Vigilancia real de las instancias de Evolution API
 *
 * Nació el 2026-09-04. Ese día se descubrió que `personal` (la instancia que
 * usa n8n para Truquito y Avanora) llevaba 4 días sin poder mandar un solo
 * mensaje. Nadie se enteró porque Evolution reportaba `state: "open"`:
 *
 *   GET  /instance/connectionState/personal  → {"state":"open"}   ← MENTIRA
 *   POST /chat/whatsappNumbers/personal      → 428 Connection Closed
 *
 * La fila de la base dice "open" mientras el socket de Baileys ya murió. Por eso
 * este chequeo NO usa connectionState: golpea el socket de verdad con una
 * consulta que sí lo atraviesa (`whatsappNumbers`, que pregunta si un número
 * existe en WhatsApp). Es de solo lectura — no manda ningún mensaje.
 *
 * Avisa por Telegram solo cuando el estado CAMBIA (sana → caída, caída → sana).
 * Si avisara en cada corrida, en dos días serían ruido y dejaría de leerlos.
 */

const https = require('https');

const URL_BASE = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
const CHAT = process.env.TELEGRAM_ADMIN_IDS?.split(',')[0];
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Número contra el que se prueba. Solo se consulta si existe en WhatsApp; da
// igual cuál sea mientras sea un número real.
const NUMERO_SONDA = (process.env.ADMIN_PHONE || '').split(',')[0]?.trim();

function instancias() {
  return [
    { nombre: process.env.EVOLUTION_INSTANCE,          key: process.env.EVOLUTION_API_KEY,                                             uso: 'bot de WhatsApp (Fabián)' },
    { nombre: process.env.EVOLUTION_INSTANCE_VENTAS,   key: process.env.EVOLUTION_API_KEY_VENTAS   || process.env.EVOLUTION_API_KEY,    uso: 'bot de ventas' },
    { nombre: process.env.EVOLUTION_INSTANCE_PERSONAL, key: process.env.EVOLUTION_API_KEY_PERSONAL || process.env.EVOLUTION_API_KEY,    uso: 'n8n — Truquito y Avanora' },
    { nombre: process.env.EVOLUTION_INSTANCE_GRACIAS,  key: process.env.EVOLUTION_API_KEY_GRACIAS  || process.env.EVOLUTION_API_KEY,    uso: 'gracias y guías (CRM)' },
  ].filter(i => i.nombre && i.key);
}

function pedir(url, { metodo = 'GET', key, body, timeout = 25000 } = {}) {
  return new Promise((resolve, reject) => {
    const datos = body ? JSON.stringify(body) : null;
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: metodo,
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
        ...(datos ? { 'Content-Length': Buffer.byteLength(datos) } : {})
      },
      timeout
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(d); } catch {}
        resolve({ status: res.statusCode, json, texto: d });
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    if (datos) req.write(datos);
    req.end();
  });
}

/** Golpea el socket real de una instancia. No manda mensajes. */
async function probar(inst) {
  // Lo que Evolution *dice* — solo para poder reportar cuándo miente.
  let estadoBD = 'desconocido';
  try {
    const r = await pedir(`${URL_BASE}/instance/connectionState/${inst.nombre}`, { key: inst.key });
    estadoBD = r.json?.instance?.state || 'desconocido';
  } catch {}

  try {
    const r = await pedir(`${URL_BASE}/chat/whatsappNumbers/${inst.nombre}`, {
      metodo: 'POST', key: inst.key, body: { numbers: [NUMERO_SONDA] }
    });
    if (r.status === 200 && Array.isArray(r.json)) {
      return { ...inst, viva: true, estadoBD };
    }
    const motivo = r.json?.output?.payload?.message || r.json?.message || r.texto?.slice(0, 120) || `HTTP ${r.status}`;
    return { ...inst, viva: false, estadoBD, motivo };
  } catch (e) {
    return { ...inst, viva: false, estadoBD, motivo: e.message };
  }
}

function telegram(texto) {
  if (!TOKEN || !CHAT) return Promise.resolve();
  return new Promise(resolve => {
    const body = JSON.stringify({ chat_id: CHAT, text: texto, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { res.on('data', () => {}); res.on('end', resolve); });
    req.on('error', () => resolve());
    req.write(body); req.end();
  });
}

// Estado de la corrida anterior, para avisar solo en los cambios.
const anterior = new Map();
let ultima = null;

async function revisar({ silencioso = false } = {}) {
  if (!URL_BASE || !NUMERO_SONDA) {
    console.log('[SALUD-WA] Sin EVOLUTION_API_URL o ADMIN_PHONE — no se revisa nada');
    return [];
  }

  const resultados = [];
  for (const inst of instancias()) {
    resultados.push(await probar(inst));
  }
  ultima = { cuando: new Date().toISOString(), resultados };

  const cayeron = [];
  const volvieron = [];
  for (const r of resultados) {
    const antes = anterior.get(r.nombre);
    if (antes === undefined) {
      // Primera corrida: solo avisa de lo que ya está roto.
      if (!r.viva) cayeron.push(r);
    } else if (antes && !r.viva) {
      cayeron.push(r);
    } else if (!antes && r.viva) {
      volvieron.push(r);
    }
    anterior.set(r.nombre, r.viva);
  }

  console.log('[SALUD-WA] ' + resultados.map(r => `${r.nombre}=${r.viva ? 'ok' : 'CAÍDA'}`).join(' '));

  if (!silencioso && cayeron.length) {
    const lineas = cayeron.map(r => {
      // Que la BD diga "open" con el socket muerto es justamente la trampa que
      // hizo perder 4 días: vale la pena señalarlo en el aviso.
      const miente = r.estadoBD === 'open' ? '\n   ⚠️ Evolution la reporta como <b>open</b> — el socket está muerto igual' : '';
      return `• <b>${r.nombre}</b> (${r.uso})\n   ${r.motivo}\n   estado que reporta: ${r.estadoBD}${miente}`;
    });
    await telegram(
      `🔴 <b>WhatsApp caído</b>\n\n${lineas.join('\n\n')}\n\n` +
      `No está mandando mensajes. Hay que reconectar la instancia (escanear QR en el manager de Evolution).`
    );
  }

  if (!silencioso && volvieron.length) {
    await telegram(`🟢 <b>WhatsApp de vuelta</b>\n\n${volvieron.map(r => `• ${r.nombre} (${r.uso})`).join('\n')}`);
  }

  return resultados;
}

function ultimoEstado() {
  return ultima;
}

module.exports = { revisar, probar, ultimoEstado, instancias };
