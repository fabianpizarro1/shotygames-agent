require('dotenv').config();
const express = require('express');
const { chat } = require('./claude');
const { sendText, sendReaction, markAsRead } = require('./evolution');

const app = express();
app.use(express.json());

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

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

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

    if (ADMIN_PHONE && from !== ADMIN_PHONE) return;

    const messageId = data.key?.id;
    const text = data.message?.conversation || data.message?.extendedTextMessage?.text;
    if (!text) return;

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
