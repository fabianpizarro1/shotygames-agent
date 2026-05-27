require('dotenv').config();
console.log('🚀 Iniciando agente...');
console.log('Variables cargadas:', {
  ANTHROPIC: !!process.env.ANTHROPIC_API_KEY,
  EVOLUTION_URL: process.env.EVOLUTION_API_URL,
  INSTANCE: process.env.EVOLUTION_INSTANCE,
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  SHEETS_ID: !!process.env.SHEETS_ID,
  PORT: process.env.PORT
});

const express = require('express');
console.log('✅ Express cargado');
const { chat } = require('./claude');
console.log('✅ Claude cargado');
const { sendText, sendReaction, markAsRead } = require('./evolution');
console.log('✅ Evolution cargado');

const app = express();
app.use(express.json());

// Historial en memoria (fallback si no hay Redis)
const memoryStore = {};

let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    redisClient.on('error', () => { redisClient = null; });
  }
} catch (e) {}

const ADMIN_PHONE = process.env.ADMIN_PHONE;
const MAX_HISTORY = 20;

async function getHistory(phone) {
  try {
    if (redisClient) {
      const raw = await redisClient.get(`chat:${phone}`);
      return raw ? JSON.parse(raw) : [];
    }
  } catch (e) {}
  return memoryStore[phone] || [];
}

async function saveHistory(phone, history) {
  const trimmed = history.slice(-MAX_HISTORY);
  try {
    if (redisClient) {
      await redisClient.set(`chat:${phone}`, JSON.stringify(trimmed), 'EX', 86400);
      return;
    }
  } catch (e) {}
  memoryStore[phone] = trimmed;
}

// Webhook de Evolution API
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;

    // LOG COMPLETO para debug
    console.log('📨 WEBHOOK RECIBIDO:');
    console.log('  event:', body.event);
    console.log('  type:', body.type);
    console.log('  keys:', Object.keys(body));
    if (body.data) {
      console.log('  data.messageType:', body.data.messageType);
      console.log('  data.key:', JSON.stringify(body.data.key));
      console.log('  data.message keys:', body.data.message ? Object.keys(body.data.message) : 'null');
    }

    const event = (body.event || body.type || '').toLowerCase();
    if (!event.includes('message')) {
      console.log('  → ignorado (no es mensaje), event:', event);
      return;
    }

    const data = body.data;
    if (!data?.message) { console.log('  → sin data.message'); return; }
    if (data.key?.fromMe) { console.log('  → mensaje propio'); return; }

    // Soporte para nuevo formato @lid de WhatsApp
    let from;
    if (data.key?.remoteJid?.endsWith('@lid') && data.key?.remoteJidAlt) {
      from = data.key.remoteJidAlt.replace('@s.whatsapp.net', '');
    } else {
      from = data.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
    }
    if (!from) { console.log('  → sin remoteJid'); return; }
    console.log('  from (resuelto):', from, '| ADMIN_PHONE:', ADMIN_PHONE);

    if (ADMIN_PHONE && from !== ADMIN_PHONE) {
      console.log('  → número no autorizado:', from);
      return;
    }

    const messageId = data.key?.id;
    const text = data.message?.conversation || data.message?.extendedTextMessage?.text;
    if (!text) { console.log('  → sin texto, tipo:', JSON.stringify(data.message)); return; }
    console.log('  texto:', text);

    await markAsRead(from, messageId);
    await sendReaction(from, messageId, '⏳');

    const history = await getHistory(from);
    const { text: reply, updatedHistory } = await chat(history, text);

    await saveHistory(from, updatedHistory);
    await sendText(from, reply);
    await sendReaction(from, messageId, '✅');

  } catch (error) {
    console.error('Error:', error.message);
    if (ADMIN_PHONE) {
      await sendText(ADMIN_PHONE, `⚠️ Error: ${error.message}`).catch(() => {});
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Agente Claude corriendo en puerto ${PORT}`);
});
