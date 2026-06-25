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

try {
  const { setupBot, setupTelegramBot } = require('./telegram-bot');

  // Bot operacional (pedidos, guías DROPI, impresión)
  setupTelegramBot(app, getHistory, saveHistory);

  // Bot contabilidad
  if (process.env.TELEGRAM_CONTA_TOKEN) {
    const { chatConta } = require('./claude-conta');
    setupBot(app, {
      token: process.env.TELEGRAM_CONTA_TOKEN,
      path: '/telegram-conta',
      name: 'CONTA',
      chatFn: (history, msg) => chatConta(history, msg),
      webhookUrl: BASE_URL
    }, getHistory, saveHistory);
  }

  // Bot DROPI
  if (process.env.TELEGRAM_DROPI_TOKEN) {
    const { chatDropi } = require('./claude-dropi');
    setupBot(app, {
      token: process.env.TELEGRAM_DROPI_TOKEN,
      path: '/telegram-dropi',
      name: 'DROPI',
      chatFn: (history, msg) => chatDropi(history, msg),
      webhookUrl: BASE_URL
    }, getHistory, saveHistory);
  }

  // Bot asistente personal
  if (process.env.TELEGRAM_PERSONAL_TOKEN) {
    const { chatPersonal } = require('./claude-personal');
    setupBot(app, {
      token: process.env.TELEGRAM_PERSONAL_TOKEN,
      path: '/telegram-personal',
      name: 'PERSONAL',
      chatFn: (history, msg) => chatPersonal(history, msg),
      webhookUrl: BASE_URL
    }, getHistory, saveHistory);
  }

} catch (e) {
  console.error('[TELEGRAM] Error al cargar bots:', e.message);
}

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
  }
}



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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Agente Claude corriendo en puerto ${PORT}`);
});
