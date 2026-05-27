require('dotenv').config();
const express = require('express');
const Redis = require('ioredis');
const { chat } = require('./claude');
const { sendText, sendReaction, markAsRead } = require('./evolution');

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const ADMIN_PHONE = process.env.ADMIN_PHONE; // solo responde a este número
const MAX_HISTORY = 20; // máximo de mensajes en historial por conversación

async function getHistory(phone) {
  const raw = await redis.get(`chat:${phone}`);
  return raw ? JSON.parse(raw) : [];
}

async function saveHistory(phone, history) {
  // Mantener solo los últimos MAX_HISTORY mensajes para no crecer indefinidamente
  const trimmed = history.slice(-MAX_HISTORY);
  await redis.set(`chat:${phone}`, JSON.stringify(trimmed), 'EX', 86400); // expira en 24h
}

// Webhook de Evolution API
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // responder rápido para que Evolution API no reintente

  try {
    const body = req.body;

    // Solo procesar mensajes de texto entrantes
    const event = body.event;
    if (event !== 'messages.upsert') return;

    const data = body.data;
    if (!data?.message) return;

    // Ignorar mensajes propios
    if (data.key?.fromMe) return;

    const from = data.key?.remoteJid?.replace('@s.whatsapp.net', '');
    if (!from) return;

    // Solo procesar mensajes del admin (Fabián)
    if (ADMIN_PHONE && from !== ADMIN_PHONE) return;

    const messageId = data.key?.id;
    const text = data.message?.conversation || data.message?.extendedTextMessage?.text;
    if (!text) return;

    // Marcar como leído y poner reacción de "procesando"
    await markAsRead(from, messageId);
    await sendReaction(from, messageId, '⏳');

    // Obtener historial y procesar con Claude
    const history = await getHistory(from);
    const { text: reply, updatedHistory } = await chat(history, text);

    // Guardar historial actualizado
    await saveHistory(from, updatedHistory);

    // Enviar respuesta
    await sendText(from, reply);
    await sendReaction(from, messageId, '✅');

  } catch (error) {
    console.error('Error procesando mensaje:', error);
    // Intentar notificar al admin del error
    if (ADMIN_PHONE) {
      await sendText(ADMIN_PHONE, `⚠️ Error en el agente: ${error.message}`).catch(() => {});
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`Agente Claude corriendo en puerto ${PORT}`);
  console.log(`Webhook URL: http://TU-VPS-IP:${PORT}/webhook`);
});
