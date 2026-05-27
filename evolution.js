const axios = require('axios');

const client = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

const INSTANCE = process.env.EVOLUTION_INSTANCE;

async function sendText(to, text) {
  const response = await client.post(`/message/sendText/${INSTANCE}`, {
    number: to,
    text: text
  });
  return response.data;
}

async function sendReaction(to, messageId, emoji) {
  try {
    await client.post(`/message/sendReaction/${INSTANCE}`, {
      number: to,
      reactionMessage: { key: { id: messageId }, reaction: emoji }
    });
  } catch (e) {
    // reacciones son opcionales, no romper el flujo
  }
}

async function markAsRead(to, messageId) {
  try {
    await client.post(`/chat/markMessageAsRead/${INSTANCE}`, {
      readMessages: [{ remoteJid: `${to}@s.whatsapp.net`, id: messageId }]
    });
  } catch (e) {}
}

async function getMediaBase64(messageData) {
  const response = await client.post(`/chat/getBase64FromMediaMessage/${INSTANCE}`, {
    message: messageData
  });
  return response.data?.base64 || null;
}

module.exports = { sendText, sendReaction, markAsRead, getMediaBase64 };
