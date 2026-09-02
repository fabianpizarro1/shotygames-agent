require('dotenv').config();
const express = require('express');
const { chat } = require('./claude');
const { chatVentas } = require('./claude-ventas');
const { sendText, sendReaction, markAsRead, getMediaBase64 } = require('./evolution');
const { getHistory, saveHistory, clearHistory } = require('./history');

// WhatsApp usa *bold* (un asterisco), no **bold** (doble asterisco de markdown).
// Convierte cualquier **texto** → *texto* antes de enviar.
function waFormat(text) {
  return text.replace(/\*\*(.+?)\*\*/gs, '*$1*');
}

const { transcribeBase64 } = require('./transcribe');

const app = express();
app.use(express.json());

const INSTANCE_VENTAS = process.env.EVOLUTION_INSTANCE_VENTAS;
const ADMIN_PHONES = (process.env.ADMIN_PHONE || '').split(',').map(p => p.trim()).filter(Boolean);
const dropi = require('./dropi');

// ── BOTS DE TELEGRAM ──────────────────────────────────────
const BASE_URL = process.env.TELEGRAM_WEBHOOK_URL || '';

// Cada bot se arranca en su propio try/catch. Antes estaban los 4 en un solo
// bloque: si a UNO se le rompía el require (pasó el 2026-08-31 — a
// claude-dropshipping.js le faltaba fechas.js en el repo), la excepción
// cortaba en seco a todos los que venían después en el código — ese día
// también se quedó mudo el bot PERSONAL sin que nada lo señalara, solo
// porque estaba definido después del que reventó. Aislado así, un bot roto
// no le saca los demás.
const { setupTelegramBot } = require('./telegram-bot');

// Bot operacional (pedidos, guías DROPI, impresión)
try {
  setupTelegramBot(app, getHistory, saveHistory);
} catch (e) {
  console.error('[TELEGRAM] Bot operacional no cargó:', e.message);
}

function arrancarBot({ tokenVar, path, name, modulo, fn }) {
  if (!process.env[tokenVar]) return;
  try {
    const { setupBot } = require('./telegram-bot');
    const chatFn = require(modulo)[fn];
    setupBot(app, {
      token: process.env[tokenVar],
      path,
      name,
      chatFn: (history, msg) => chatFn(history, msg),
      webhookUrl: BASE_URL
    }, getHistory, saveHistory);
  } catch (e) {
    console.error(`[TELEGRAM] Bot ${name} no cargó:`, e.message);
  }
}

arrancarBot({ tokenVar: 'TELEGRAM_CONTA_TOKEN', path: '/telegram-conta', name: 'CONTA', modulo: './claude-conta', fn: 'chatConta' });
arrancarBot({ tokenVar: 'TELEGRAM_DROPI_TOKEN', path: '/telegram-dropi', name: 'DROPI', modulo: './claude-dropi', fn: 'chatDropi' });
// DROPSHIPPING (Truquito + Avanora) — cuenta DROPI y Sheet distintos a los de
// Shotygames, por eso es un bot aparte y no una skill del de arriba.
arrancarBot({ tokenVar: 'TELEGRAM_DROPI2_TOKEN', path: '/telegram-dropshipping', name: 'DROPSHIPPING', modulo: './claude-dropshipping', fn: 'chatDropshipping' });
arrancarBot({ tokenVar: 'TELEGRAM_PERSONAL_TOKEN', path: '/telegram-personal', name: 'PERSONAL', modulo: './claude-personal', fn: 'chatPersonal' });

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  console.log('WEBHOOK recibido:', JSON.stringify(req.body).slice(0, 200));

  try {
    const body = req.body;
    const event = (body.event || body.type || '').toLowerCase();
    if (!event.includes('message')) return;

    const data = body.data;
    if (!data?.message) return;
    if (data.key?.fromMe) return;

    // Soporte formato @lid (nuevo WhatsApp)
    let from;
    if (data.key?.remoteJid?.endsWith('@lid') && data.key?.remoteJidAlt) {
      from = data.key.remoteJidAlt.replace('@s.whatsapp.net', '');
    } else {
      from = data.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
    }
    if (!from) return;

    if (ADMIN_PHONES.length && !ADMIN_PHONES.includes(from)) return;

    const messageId = data.key?.id;
    const text = data.message?.conversation || data.message?.extendedTextMessage?.text;
    const imageMsg = data.message?.imageMessage;
    const audioMsg = data.message?.audioMessage || data.message?.pttMessage;

    if (!text && !imageMsg && !audioMsg) return;

    // Comando especial para actualizar token DROPI sin redeploy
    if (text && text.toUpperCase().startsWith('DROPI TOKEN:')) {
      const token = text.slice('DROPI TOKEN:'.length).trim();
      dropi.setToken(token);
      await markAsRead(from, messageId);
      await sendText(from, '✅ Token DROPI actualizado en memoria.');
      return;
    }

    await markAsRead(from, messageId);
    await sendReaction(from, messageId, '⏳');

    const history = await getHistory(from);

    let imageBase64 = null;
    let imageMime = 'image/jpeg';
    if (imageMsg) {
      try {
        imageBase64 = await getMediaBase64(data);
        imageMime = imageMsg.mimetype || 'image/jpeg';
      } catch (e) {
        console.error('Error obteniendo imagen:', e.message);
      }
    }

    // Transcribir audio si viene nota de voz o audio
    let transcribedAudio = null;
    if (audioMsg) {
      try {
        const audioBase64 = await getMediaBase64(data);
        if (audioBase64) {
          const mime = audioMsg.mimetype || 'audio/ogg';
          console.log(`Transcribiendo audio (${mime})...`);
          transcribedAudio = await transcribeBase64(audioBase64, mime);
          console.log('Transcripción:', transcribedAudio);
        }
      } catch (e) {
        console.error('Error transcribiendo audio:', e.message);
        transcribedAudio = null;
      }
    }

    // Determinar texto final a enviar a Claude
    let messageText;
    if (transcribedAudio) {
      messageText = transcribedAudio;
    } else if (text) {
      messageText = text;
    } else if (imageMsg?.caption) {
      messageText = imageMsg.caption;
    } else {
      messageText = 'Te mando una imagen de la guía para que registres el envío.';
    }
    const { text: reply, updatedHistory } = await chat(history, messageText, imageBase64, imageMime, from);

    await saveHistory(from, updatedHistory);
    await sendText(from, waFormat(reply));
    await sendReaction(from, messageId, '✅');

  } catch (error) {
    console.error('Error:', error.message);
    if (ADMIN_PHONES.length) {
      await sendText(ADMIN_PHONES[0], `⚠️ Error: ${error.message}`).catch(() => {});
    }
  }
});

// Debounce de mensajes ventas: agrupa los mensajes de un mismo cliente antes de responder.
// Evita responder a cada mensaje por separado cuando el cliente manda varios seguidos.
const pendingVentas = new Map();
const VENTAS_DEBOUNCE_MS = 50000; // 50 segundos

app.post('/webhook/ventas', async (req, res) => {
  res.sendStatus(200);
  console.log('WEBHOOK VENTAS recibido:', JSON.stringify(req.body).slice(0, 200));

  try {
    const body = req.body;
    const event = (body.event || body.type || '').toLowerCase();
    if (!event.includes('message')) return;

    const data = body.data;
    if (!data?.message) return;
    if (data.key?.fromMe) return;

    let from;
    if (data.key?.remoteJid?.endsWith('@lid') && data.key?.remoteJidAlt) {
      from = data.key.remoteJidAlt.replace('@s.whatsapp.net', '');
    } else {
      from = data.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
    }
    if (!from) return;

    const messageId = data.key?.id;
    const text = data.message?.conversation || data.message?.extendedTextMessage?.text;
    const imageMsg = data.message?.imageMessage;
    const audioMsg = data.message?.audioMessage || data.message?.pttMessage;

    if (!text && !imageMsg && !audioMsg) return;

    console.log(`[VENTAS] from=${from} instance=${INSTANCE_VENTAS}`);

    // Marcar como leído inmediatamente
    await markAsRead(from, messageId, INSTANCE_VENTAS);

    // Obtener medios ahora: el caché de Evolution puede expirar antes de que termine el debounce
    let imageBase64 = null;
    let imageMime = 'image/jpeg';
    if (imageMsg) {
      try {
        imageBase64 = await getMediaBase64(data, INSTANCE_VENTAS);
        imageMime = imageMsg.mimetype || 'image/jpeg';
      } catch (e) {
        console.error('[VENTAS] error obteniendo imagen:', e.message);
      }
    }

    let messageText;
    if (audioMsg) {
      try {
        const audioBase64 = await getMediaBase64(data, INSTANCE_VENTAS);
        if (audioBase64) {
          const mime = audioMsg.mimetype || 'audio/ogg';
          messageText = await transcribeBase64(audioBase64, mime);
          console.log('[VENTAS] audio transcrito:', messageText);
        }
      } catch (e) {
        console.error('[VENTAS] error transcribiendo audio:', e.message);
      }
      if (!messageText) messageText = 'Hola';
    } else if (text) {
      messageText = text;
    } else if (imageMsg?.caption) {
      messageText = imageMsg.caption;
    } else if (imageMsg) {
      messageText = 'Te mando una imagen.';
    } else {
      messageText = 'Hola';
    }

    // Debounce: acumular mensajes y esperar silencio antes de procesar
    const existing = pendingVentas.get(from);

    if (existing) {
      // Ya hay mensajes pendientes: agregar al batch y reiniciar el timer
      clearTimeout(existing.timer);
      existing.items.push({ text: messageText, imageBase64, imageMime, messageId });
      existing.timer = setTimeout(() => {
        pendingVentas.delete(from);
        procesarBatchVentas(from, existing.items, existing.firstMessageId).catch(console.error);
      }, VENTAS_DEBOUNCE_MS);
    } else {
      // Primer mensaje del batch: enviar ⏳ y crear entrada en el mapa
      await sendReaction(from, messageId, '⏳', INSTANCE_VENTAS);
      const batch = {
        firstMessageId: messageId,
        items: [{ text: messageText, imageBase64, imageMime, messageId }],
        timer: null
      };
      batch.timer = setTimeout(() => {
        pendingVentas.delete(from);
        procesarBatchVentas(from, batch.items, batch.firstMessageId).catch(console.error);
      }, VENTAS_DEBOUNCE_MS);
      pendingVentas.set(from, batch);
    }

  } catch (error) {
    console.error('[VENTAS] error en webhook:', error.message);
    if (error.response) {
      console.error('[VENTAS] status:', error.response.status);
      console.error('[VENTAS] data:', JSON.stringify(error.response.data).slice(0, 300));
    }
  }
});

async function procesarBatchVentas(from, items, firstMessageId) {
  try {
    // Combinar todos los textos del batch en un solo mensaje
    const combinedText = items.map(i => i.text).filter(Boolean).join('\n');
    const imageItem = items.find(i => i.imageBase64);

    console.log(`[VENTAS] procesando batch de ${items.length} mensaje(s) de ${from}`);

    const history = await getHistory(from, 'ventas');
    const { text: reply, updatedHistory } = await chatVentas(
      history,
      combinedText,
      imageItem?.imageBase64 || null,
      imageItem?.imageMime || 'image/jpeg',
      from
    );

    await saveHistory(from, updatedHistory, 'ventas');

    // Enviar en múltiples mensajes si Nicole usó el separador |||
    const partes = reply.split('|||').map(p => waFormat(p.trim())).filter(Boolean);
    for (let i = 0; i < partes.length; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 800));
      await sendText(from, partes[i], INSTANCE_VENTAS);
    }

    console.log(`[VENTAS] ${partes.length} mensaje(s) enviado(s) OK`);
    await sendReaction(from, firstMessageId, '✅', INSTANCE_VENTAS);

  } catch (error) {
    console.error('[VENTAS] error procesando batch:', error.message);
    if (ADMIN_PHONES.length) {
      await sendText(ADMIN_PHONES[0], `⚠️ Error bot ventas: ${error.message}`, INSTANCE_VENTAS).catch(() => {});
    }
    // Antes esto dejaba al cliente sin ninguna respuesta y sin ningún indicio
    // de que algo falló — pasó de verdad el 2026-08-31 (ANTHROPIC_API_KEY sin
    // crédito). Un cliente real esperando una respuesta de venta es peor que
    // un mensaje genérico. Sin jerga técnica: no es su problema.
    await sendText(
      from,
      'Estamos teniendo un problema técnico en este momento. Ya lo estamos revisando — te contactamos apenas se resuelva 🙏',
      INSTANCE_VENTAS
    ).catch(() => {});
  }
}



// Backfill: pedidos ya registrados en PEDIDOS que quedaron sin fbc/fbp
// (porque SHEETS_ID_PEDIDOS_WEB no existía en EasyPanel cuando se registraron).
// ?dryRun=1 para ver qué matchearía sin escribir nada.
app.get('/admin/backfill-atribucion', async (req, res) => {
  const adminKey = process.env.ADMIN_KEY || '';
  if (adminKey && req.headers['x-admin-key'] !== adminKey) return res.status(401).json({ error: 'No autorizado' });
  try {
    const sheets = require('./sheets');
    const dryRun = req.query.dryRun === '1';
    const resultado = await sheets.backfillAtribucion({ dryRun });
    res.json({ dryRun, ...resultado });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Enriquece PEDIDOS LOVABLE con reputación DROPI (pedidos/entregados/devueltos
// por teléfono en toda la plataforma) — para decidir si mandar contraentrega.
// Idempotente: solo llena filas que aún no tienen las 3 columnas. ?dryRun=1
// para ver el conteo sin escribir nada ni consultar DROPI de verdad.
app.get('/admin/enriquecer-dropi', async (req, res) => {
  const adminKey = process.env.ADMIN_KEY || '';
  if (adminKey && req.headers['x-admin-key'] !== adminKey) return res.status(401).json({ error: 'No autorizado' });
  try {
    const sheets = require('./sheets');
    const dryRun = req.query.dryRun === '1';
    const resultado = await sheets.enriquecerReputacionDropi({ dryRun });
    res.json({ dryRun, ...resultado });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Diagnóstico: probar marcar orden DROPI como impresa
app.get('/admin/dropi-print-test/:dropiId', async (req, res) => {
  const adminKey = process.env.ADMIN_KEY || '';
  if (adminKey && req.headers['x-admin-key'] !== adminKey) return res.status(401).json({ error: 'No autorizado' });
  try {
    const dropiMod = require('./dropi');
    await dropiMod._autoLogin();
    const client = dropiMod._makeClient(await dropiMod._getToken());
    const dropiId = req.params.dropiId;
    // Ver estado actual
    const current = await client.get(`/orders/myorders/${dropiId}`);
    const currentStatus = current.data?.objects?.status || current.data?.status || JSON.stringify(current.data).slice(0, 200);
    // Es un checkbox en el frontend — probar campos booleanos
    const payloads = [
      { printed: true },
      { is_printed: true },
      { impreso: true },
      { print: true },
      { printed: 1 },
      { guide_printed: true },
      { rotulo_impreso: true },
    ];
    const resultados = {};
    for (const body of payloads) {
      const key = JSON.stringify(body);
      try {
        const r = await client.put(`/orders/myorders/${dropiId}`, body);
        const d = r.data;
        resultados[key] = d?.isSuccess ? '✅ ACEPTADO' : `❌ ${d?.message}`;
        if (d?.isSuccess) break;
      } catch (e) {
        resultados[key] = `error ${e.response?.status}`;
      }
    }
    res.json({ dropiId, estadoAntes: currentStatus, resultados });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Diagnóstico: pedidos ENVIADOS con dropiId y su estado actual en DROPI
app.get('/admin/sync-preview', async (req, res) => {
  const adminKey = process.env.ADMIN_KEY || '';
  if (adminKey && req.headers['x-admin-key'] !== adminKey) return res.status(401).json({ error: 'No autorizado' });
  try {
    const sheets = require('./sheets');
    const dropiMod = require('./dropi');
    const ordenes = await sheets.getOrdenesEnviadas();
    if (!ordenes.length) return res.json({ total: 0, mensaje: 'No hay pedidos ENVIADOS con dropiId en Sheets' });
    const resultado = [];
    for (const orden of ordenes.slice(0, 20)) {
      try {
        const d = await dropiMod.getOrdenPorId(orden.dropiId);
        resultado.push({ nombre: orden.nombre, guia: orden.guia, estadoSheets: orden.estado, estadoDropi: d.status, dropiId: orden.dropiId, fila: orden.fila });
      } catch (e) {
        resultado.push({ nombre: orden.nombre, guia: orden.guia, estadoSheets: orden.estado, estadoDropi: 'ERROR: ' + e.message, dropiId: orden.dropiId, fila: orden.fila });
      }
    }
    res.json({ total: ordenes.length, ordenes: resultado });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Consulta rápida de usuario DROPI por ID
app.get('/admin/dropi-user/:id', async (req, res) => {
  const adminKey = process.env.ADMIN_KEY || '';
  if (adminKey && req.headers['x-admin-key'] !== adminKey) return res.status(401).json({ error: 'No autorizado' });
  try {
    const dropiMod = require('./dropi');
    await dropiMod._autoLogin();
    const client = dropiMod._makeClient(await dropiMod._getToken());
    const r = await client.get(`/users/${req.params.id}`);
    const obj = r.data?.objects || {};
    res.json({ name: obj.name, surname: obj.surname, email: obj.email, store: obj.store_name, status: obj.status, wallets: obj.wallets });
  } catch (e) { res.status(500).json({ error: e.response?.status || e.message }); }
});

// Endpoint para que el script del Mac actualice el token automáticamente
app.post('/admin/token', (req, res) => {
  const adminKey = process.env.ADMIN_KEY || '';
  const providedKey = req.headers['x-admin-key'] || '';
  if (!adminKey || providedKey !== adminKey) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Falta token' });
  dropi.setToken(token);
  console.log('DROPI token actualizado via /admin/token');
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Endpoints de retorno de PayPhone (requeridos por su API)
app.get('/payphone/response', (req, res) => res.send('Pago procesado. Puedes cerrar esta ventana.'));
app.get('/payphone/cancel', (req, res) => res.send('Pago cancelado. Puedes cerrar esta ventana.'));

app.get('/reset/:phone', async (req, res) => {
  const phone = req.params.phone;

  const keysDeleted = await clearHistory(phone);

  // Cancelar debounce pendiente de ventas
  if (pendingVentas.has(phone)) {
    clearTimeout(pendingVentas.get(phone).timer);
    pendingVentas.delete(phone);
    keysDeleted.push(`debounce:${phone}`);
  }

  console.log(`RESET ${phone}:`, keysDeleted);
  res.json({ ok: true, phone, cleared: keysDeleted });
});

// `commit` y `arranque` existen para poder verificar DESDE AFUERA que un deploy
// realmente entró. EasyPanel sigue sirviendo el contenedor viejo mientras
// compila, así que un /health en 200 no prueba nada: el 2026-08-31 no hubo forma
// de confirmar si el fix desplegado estaba vivo o seguía corriendo el anterior.
// SOURCE_COMMIT lo inyecta EasyPanel/nixpacks; si no está, queda 'desconocido'.
const COMMIT = process.env.SOURCE_COMMIT || process.env.RAILWAY_GIT_COMMIT_SHA || 'desconocido';
const ARRANQUE = new Date().toISOString();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    commit: COMMIT,
    arranque: ARRANQUE,
    uptimeSegundos: Math.round(process.uptime())
  });
});

// ── NOTIFICACIONES AUTOMÁTICAS ───────────────────────────────
try {
  const cron = require('node-cron');
  const { enviarReporteOPS, enviarSaldoDropi, enviarSaldosMañana, enviarCierreNoche } = require('./notificaciones');

  // OPS: 10am Ecuador lun-vie = 15:00 UTC
  cron.schedule('0 15 * * 1-5', () => enviarReporteOPS('10:00 AM'));
  // OPS: 12pm Ecuador lun-vie = 17:00 UTC
  cron.schedule('0 17 * * 1-5', () => enviarReporteOPS('12:00 PM'));
  // OPS: 3pm Ecuador lun-vie = 20:00 UTC
  cron.schedule('0 20 * * 1-5', () => enviarReporteOPS('3:00 PM'));

  // DROPI: 10pm Ecuador = 03:00 UTC (+1 día)
  cron.schedule('0 3 * * *', () => enviarSaldoDropi());

  // CONTA: 10am Ecuador lun-vie = 15:00 UTC
  cron.schedule('0 15 * * 1-5', () => enviarSaldosMañana());
  // CONTA: 10pm Ecuador = 03:00 UTC (+1 día)
  cron.schedule('0 3 * * *', () => enviarCierreNoche());

  console.log('[CRON] Notificaciones: OPS 10am/12pm/3pm lun-vie | DROPI 10pm | CONTA 10am lun-vie + 10pm');
} catch (e) {
  console.error('[CRON] Error al iniciar notificaciones:', e.message);
}

// ── DROPSHIPPING: seguimiento de guías ───────────────────────
// El proveedor genera la guía cuando alista el paquete, y no avisa. Sin este
// cron los pedidos se quedarían en EN_DROPI sin que nadie note que ya salieron.
// Cada 2h entre 8am y 8pm de Ecuador (13:00-01:00 UTC) — fuera de ese rango
// los proveedores no están despachando.
try {
  const cron = require('node-cron');
  const { executeTool } = require('./claude-dropshipping');
  const axios = require('axios');

  async function sincronizarGuiasDropshipping() {
    try {
      const salida = await executeTool('sincronizar_guias', {});
      console.log('[DROPSHIPPING] Sincronización de guías:', salida.slice(0, 200));

      // Solo avisa si algo cambió — un mensaje cada 2h diciendo "nada nuevo"
      // se vuelve ruido y se deja de leer.
      const token = process.env.TELEGRAM_DROPI2_TOKEN;
      const chatIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (token && chatIds.length && salida.includes('con novedad')) {
        for (const chatId of chatIds) {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `📦 Pedidos con novedad\n\n${salida}`
          }).catch(e => console.error('[DROPSHIPPING] Telegram:', e.message));
        }
      }
    } catch (e) {
      console.error('[DROPSHIPPING] Error sincronizando guías:', e.message);
    }
  }

  if (process.env.SHEETS_ID_DROPSHIPPING) {
    cron.schedule('0 13,15,17,19,21,23,1 * * *', sincronizarGuiasDropshipping);
    console.log('[CRON] Dropshipping: seguimiento de guías cada 2h (8am-8pm Ecuador)');
  } else {
    console.log('[CRON] Dropshipping: desactivado (falta SHEETS_ID_DROPSHIPPING)');
  }

  // Rutina diaria: snapshot del catálogo + ranking de candidatos.
  // 5 AM Ecuador = 10:00 UTC. A esa hora la API de DROPI está vacía y el
  // catálogo baja en ~9 min; a media tarde la misma descarga tarda 25-30.
  // Apagado por defecto: este mismo trabajo lo corre el launchd de la Mac
  // (com.shotygames.dropi-diario). Tenerlo en los dos lados bajaba el catálogo
  // entero dos veces y mandaba el Telegram duplicado.
  //
  // Gana la Mac y no el servidor porque el snapshot es un JSON de ~18 MB que
  // queda en projects/dropshipping/data/, y de ahí leen ranking, consistencia y
  // tendencias. En el contenedor ese archivo se pierde en cada redeploy y el
  // análisis local se quedaría sin historial. Para invertirlo: DIARIO_EN_SERVIDOR=1
  // y descargar el launchd.
  if (process.env.DROPI2_EMAIL && process.env.DIARIO_EN_SERVIDOR === '1') {
    const { correr: correrDiario } = require('./projects/dropshipping/diario');
    cron.schedule('0 10 * * *', () => {
      correrDiario().catch(e => console.error('[DIARIO] Falló:', e.message));
    });
    console.log('[CRON] Dropshipping: catálogo + ranking 5am Ecuador');
  } else if (process.env.DROPI2_EMAIL) {
    console.log('[CRON] Catálogo diario: lo corre la Mac (launchd). DIARIO_EN_SERVIDOR=1 para moverlo acá.');
  } else {
    console.log('[CRON] Catálogo diario: desactivado (falta DROPI2_EMAIL)');
  }
} catch (e) {
  console.error('[CRON] Error al iniciar seguimiento de dropshipping:', e.message);
}

// ── SHOTYGAMES: sincronizar pagos DROPI ──────────────────────
// DROPI marca la orden como entregada horas o días antes de acreditar la
// plata en la wallet. Sin este cron, el ESTADO en Sheets se quedaba en
// ENVIADO/ENTREGADO para siempre — nadie revisaba la wallet a mano para
// saber cuáles ya se cobraron de verdad.
try {
  const cron = require('node-cron');
  const { executeTool: executeToolDropi } = require('./claude-dropi');
  const axios = require('axios');

  async function sincronizarPagosShotygames() {
    try {
      const salida = await executeToolDropi('sincronizar_pagos_dropi', {});
      console.log('[SHOTYGAMES] Sincronización de pagos:', salida.slice(0, 200));

      // Solo avisa si algo cambió — igual que el cron de dropshipping.
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
      const huboNovedad = salida.includes('Marcados como PAGADO') || salida.includes('Marcados como ENTREGADO');
      if (token && chatIds.length && huboNovedad) {
        for (const chatId of chatIds) {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `💰 Pagos DROPI\n\n${salida}`
          }).catch(e => console.error('[SHOTYGAMES] Telegram:', e.message));
        }
      }
    } catch (e) {
      console.error('[SHOTYGAMES] Error sincronizando pagos:', e.message);
    }
  }

  // Cada 2h entre 8am y 8pm de Ecuador (13:00-01:00 UTC) — mismo horario que
  // el cron de guías, no hace falta revisar más seguido que eso.
  cron.schedule('0 13,15,17,19,21,23,1 * * *', sincronizarPagosShotygames);
  console.log('[CRON] Shotygames: sincronizar pagos DROPI cada 2h (8am-8pm Ecuador)');
} catch (e) {
  console.error('[CRON] Error al iniciar sincronización de pagos Shotygames:', e.message);
}

// ── REPUTACIÓN DROPI en PEDIDOS LOVABLE ───────────────────────
// Rellena las columnas DROPI PEDIDOS/ENTREGADOS/DEVUELTOS de los pedidos web
// nuevos que todavía no las tienen (idempotente — no vuelve a tocar lo ya
// lleno). Mismo horario que la sincronización de pagos, no hace falta más.
try {
  const cron = require('node-cron');
  async function enriquecerDropiLovable() {
    try {
      const sheets = require('./sheets');
      const resultado = await sheets.enriquecerReputacionDropi({ dryRun: false });
      if (resultado.actualizados > 0) {
        console.log('[ENRIQUECER DROPI]', JSON.stringify(resultado));
      }
    } catch (e) {
      console.error('[ENRIQUECER DROPI] Error:', e.message);
    }
  }
  cron.schedule('0 13,15,17,19,21,23,1 * * *', enriquecerDropiLovable);
  console.log('[CRON] Reputación DROPI en PEDIDOS LOVABLE cada 2h (8am-8pm Ecuador)');
} catch (e) {
  console.error('[CRON] Error al iniciar enriquecimiento DROPI:', e.message);
}

// ── META CAPI: Purchase real desde PEDIDOS ────────────────────
// Manda el Purchase por Conversions API en cuanto el pedido queda registrado
// en la hoja oficial (con atribución fbc/fbp), reemplazando el Purchase falso
// que salía del navegador al llenar el checkout. Corre 24/7 cada 15 min —a
// diferencia del seguimiento de DROPI, acá no hay horario de proveedor que
// respetar: cuanto antes le llegue la señal a Meta, mejor optimiza.
try {
  const cron = require('node-cron');
  const { procesarPendientes } = require('./meta-capi');

  if (process.env.META_CAPI_TOKEN && process.env.META_PIXEL_ID) {
    cron.schedule('*/15 * * * *', () => {
      procesarPendientes().catch(e => console.error('[META-CAPI] Falló:', e.message));
    });
    console.log('[CRON] Meta CAPI: Purchase real cada 15 min');
  } else {
    console.log('[CRON] Meta CAPI: desactivado (falta META_CAPI_TOKEN o META_PIXEL_ID)');
  }
} catch (e) {
  console.error('[CRON] Error al iniciar Meta CAPI:', e.message);
}

// ── PUBLICIDAD: gasto de Meta vs ventas reales en el Sheet ────
// Corre 24/7 cada 15 min. A diferencia del catálogo diario, este job NO escribe
// nada en disco (lee Meta + Sheets y escribe en Sheets), así que vive bien en el
// contenedor: no pierde historial en cada redeploy.
//
// Sustituye al launchd de la Mac (com.shotygames.publicidad-live). Correrlo en
// los dos lados no rompe datos —la hoja se reescribe entera cada vez— pero
// duplica llamadas a la API de Meta al pedo. Si se reactiva el launchd, apagar
// este con PUBLICIDAD_EN_SERVIDOR=0.
try {
  const cron = require('node-cron');
  const { correr: correrPublicidad } = require('./projects/dropshipping/publicidad-live');

  const activo = process.env.META_ADS_TOKEN && process.env.SHEETS_ID_DROPSHIPPING
    && process.env.PUBLICIDAD_EN_SERVIDOR !== '0';

  if (activo) {
    cron.schedule('*/15 * * * *', () => {
      correrPublicidad().catch(e => console.error('[PUBLICIDAD] Falló:', e.message));
    });
    console.log('[CRON] Publicidad: gasto Meta + ventas reales cada 15 min');
  } else if (process.env.PUBLICIDAD_EN_SERVIDOR === '0') {
    console.log('[CRON] Publicidad: apagada a propósito (PUBLICIDAD_EN_SERVIDOR=0)');
  } else {
    console.log('[CRON] Publicidad: desactivada (falta META_ADS_TOKEN o SHEETS_ID_DROPSHIPPING)');
  }
} catch (e) {
  console.error('[CRON] Error al iniciar publicidad:', e.message);
}

// ── CONTENIDO DIARIO (Instagram, manual — bot solo genera y envía) ──
try {
  const cron = require('node-cron');
  const { enviarContenidoDiario } = require('./contenido-diario');

  // 9am Ecuador todos los días = 14:00 UTC
  cron.schedule('0 14 * * *', () => enviarContenidoDiario());

  console.log('[CRON] Contenido diario: 9am (imagen + caption por Telegram, para publicar manual)');
} catch (e) {
  console.error('[CRON] Error al iniciar contenido diario:', e.message);
}

// Endpoints admin manuales
app.get('/admin/reporte-ops', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });
  try {
    const { enviarReporteOPS } = require('./notificaciones');
    await enviarReporteOPS('Manual');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/contenido-diario', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });
  try {
    const { enviarContenidoDiario } = require('./contenido-diario');
    await enviarContenidoDiario();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/saldo-dropi', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });
  try {
    const { enviarSaldoDropi } = require('./notificaciones');
    await enviarSaldoDropi();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/cierre-conta', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });
  try {
    const { enviarCierreNoche } = require('./notificaciones');
    await enviarCierreNoche();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Agente Claude corriendo en puerto ${PORT}`);
});
