require('dotenv').config();
const express = require('express');
const { chat } = require('./claude');
const { chatVentas } = require('./claude-ventas');
const { sendText, sendReaction, markAsRead, getMediaBase64 } = require('./evolution');

const { transcribeBase64 } = require('./transcribe');

const app = express();
app.use(express.json());

const INSTANCE_VENTAS = process.env.EVOLUTION_INSTANCE_VENTAS;

const memoryStore = {};
let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    redisClient.on('error', () => { redisClient = null; });
  }
} catch (e) {}

const ADMIN_PHONES = (process.env.ADMIN_PHONE || '').split(',').map(p => p.trim()).filter(Boolean);
const MAX_HISTORY = 8;
const dropi = require('./dropi');

async function getHistory(phone, prefix = 'chat') {
  try {
    if (redisClient) {
      const raw = await redisClient.get(`${prefix}:${phone}`);
      const parsed = raw ? JSON.parse(raw) : [];
      return sanitizeHistory(parsed);
    }
  } catch (e) {}
  return sanitizeHistory(memoryStore[`${prefix}:${phone}`] || []);
}

function sanitizeHistory(history) {
  // Recortar al máximo permitido
  let h = history.slice(-MAX_HISTORY);

  // Nunca empezar con un mensaje de assistant (Claude espera user primero)
  while (h.length > 0 && h[0].role === 'assistant') h = h.slice(1);

  // Eliminar tool_results huérfanos al principio:
  // Si el primer mensaje user contiene tool_result sin tool_use previo, quitarlo.
  while (h.length > 0 && h[0].role === 'user') {
    const content = Array.isArray(h[0].content) ? h[0].content : [];
    const hasOrphanResult = content.some(b => b.type === 'tool_result');
    if (hasOrphanResult) h = h.slice(2); // quita ese user + el assistant previo (si queda)
    else break;
  }

  // Nunca terminar con un assistant que tiene tool_use sin su tool_result
  while (h.length > 0) {
    const last = h[h.length - 1];
    if (last.role === 'assistant') {
      const content = Array.isArray(last.content) ? last.content : [];
      if (content.some(b => b.type === 'tool_use')) {
        h = h.slice(0, -1); // quita el assistant incompleto
        continue;
      }
    }
    break;
  }

  return h;
}

async function saveHistory(phone, history, prefix = 'chat') {
  const trimmed = sanitizeHistory(history);
  try {
    if (redisClient) {
      await redisClient.set(`${prefix}:${phone}`, JSON.stringify(trimmed), 'EX', 86400);
      return;
    }
  } catch (e) {}
  memoryStore[`${prefix}:${phone}`] = trimmed;
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
    const { text: reply, updatedHistory } = await chat(history, messageText, imageBase64, imageMime);

    await saveHistory(from, updatedHistory);
    await sendText(from, reply);
    await sendReaction(from, messageId, '✅');

  } catch (error) {
    console.error('Error:', error.message);
    if (ADMIN_PHONES.length) {
      await sendText(ADMIN_PHONES[0], `⚠️ Error: ${error.message}`).catch(() => {});
    }
  }
});

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

    console.log(`[VENTAS] from=${from} instance=${INSTANCE_VENTAS} apiKeyVentas=${process.env.EVOLUTION_API_KEY_VENTAS ? 'SET' : 'NOT SET'}`);

    await markAsRead(from, messageId, INSTANCE_VENTAS);
    await sendReaction(from, messageId, '⏳', INSTANCE_VENTAS);

    const history = await getHistory(from, 'ventas');

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

    let transcribedAudio = null;
    if (audioMsg) {
      try {
        const { transcribeBase64 } = require('./transcribe');
        const audioBase64 = await getMediaBase64(data, INSTANCE_VENTAS);
        if (audioBase64) {
          const mime = audioMsg.mimetype || 'audio/ogg';
          transcribedAudio = await transcribeBase64(audioBase64, mime);
        }
      } catch (e) {
        console.error('[VENTAS] error transcribiendo audio:', e.message);
      }
    }

    let messageText;
    if (transcribedAudio) {
      messageText = transcribedAudio;
    } else if (text) {
      messageText = text;
    } else if (imageMsg?.caption) {
      messageText = imageMsg.caption;
    } else if (imageMsg) {
      messageText = 'Te mando una imagen.';
    } else {
      messageText = 'Hola';
    }

    console.log('[VENTAS] llamando chatVentas...');
    const { text: reply, updatedHistory } = await chatVentas(history, messageText, imageBase64, imageMime);
    console.log('[VENTAS] chatVentas OK, enviando respuesta...');

    await saveHistory(from, updatedHistory, 'ventas');

    // Enviar en múltiples mensajes si Nicole usó el separador |||
    const partes = reply.split('|||').map(p => p.trim()).filter(Boolean);
    for (let i = 0; i < partes.length; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 800));
      await sendText(from, partes[i], INSTANCE_VENTAS);
    }

    console.log(`[VENTAS] ${partes.length} mensaje(s) enviado(s) OK`);
    await sendReaction(from, messageId, '✅', INSTANCE_VENTAS);

  } catch (error) {
    console.error('[VENTAS] error:', error.message);
    if (error.response) {
      console.error('[VENTAS] status:', error.response.status);
      console.error('[VENTAS] url:', error.config?.url);
      console.error('[VENTAS] data:', JSON.stringify(error.response.data).slice(0, 300));
    }
  }
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Agente Claude corriendo en puerto ${PORT}`);
});
