const axios = require('axios');

const client = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

const clientVentas = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY_VENTAS || process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

const INSTANCE = process.env.EVOLUTION_INSTANCE;
const INSTANCE_VENTAS = process.env.EVOLUTION_INSTANCE_VENTAS;

function getClient(instance) {
  return instance === INSTANCE_VENTAS ? clientVentas : client;
}

async function sendText(to, text, instance = INSTANCE) {
  const response = await getClient(instance).post(`/message/sendText/${instance}`, {
    number: to,
    text: text
  });
  return response.data;
}

async function sendReaction(to, messageId, emoji, instance = INSTANCE) {
  try {
    await getClient(instance).post(`/message/sendReaction/${instance}`, {
      number: to,
      reactionMessage: { key: { id: messageId }, reaction: emoji }
    });
  } catch (e) {}
}

async function markAsRead(to, messageId, instance = INSTANCE) {
  try {
    await getClient(instance).post(`/chat/markMessageAsRead/${instance}`, {
      readMessages: [{ remoteJid: `${to}@s.whatsapp.net`, id: messageId }]
    });
  } catch (e) {}
}

async function getMediaBase64(messageData, instance = INSTANCE) {
  const response = await getClient(instance).post(`/chat/getBase64FromMediaMessage/${instance}`, {
    message: messageData
  });
  return response.data?.base64 || null;
}

module.exports = { sendText, sendReaction, markAsRead, getMediaBase64 };
