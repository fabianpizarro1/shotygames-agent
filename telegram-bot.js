const axios = require('axios');
const FormData = require('form-data');
const { transcribeBase64 } = require('./transcribe');

const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || '')
  .split(',').map(id => parseInt(id.trim())).filter(Boolean);

function tgApi(token, method) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function sendMessage(token, chatId, text) {
  const formatted = text.replace(/\*\*(.+?)\*\*/gs, '*$1*');
  try {
    await axios.post(tgApi(token, 'sendMessage'), { chat_id: chatId, text: formatted, parse_mode: 'Markdown' });
  } catch (e) {
    await axios.post(tgApi(token, 'sendMessage'), { chat_id: chatId, text });
  }
}

async function sendDocument(token, chatId, buffer, filename) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('document', buffer, { filename });
  await axios.post(tgApi(token, 'sendDocument'), form, { headers: form.getHeaders() });
}

async function downloadFile(token, fileId) {
  const { data } = await axios.get(tgApi(token, `getFile?file_id=${fileId}`));
  const filePath = data.result.file_path;
  const res = await axios.get(
    `https://api.telegram.org/file/bot${token}/${filePath}`,
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data);
}

// Configura un bot de Telegram en una ruta específica
// chatFn(history, message, imageBase64, imageMime, from, sendDocumentCb) → { text, updatedHistory }
function setupBot(app, { token, path, name, chatFn, webhookUrl }, getHistory, saveHistory) {
  if (!token) {
    console.log(`[${name}] token no definido — desactivado`);
    return;
  }

  app.post(path, async (req, res) => {
    res.sendStatus(200);
    try {
      const msg = req.body?.message;
      if (!msg) return;

      const chatId = msg.chat.id;
      if (ADMIN_IDS.length && !ADMIN_IDS.includes(chatId)) return;

      const from = `tg_${name}_${chatId}`;
      let messageText = '', imageBase64 = null, imageMime = 'image/jpeg';

      if (msg.text) {
        messageText = msg.text;
      } else if (msg.voice || msg.audio) {
        try {
          const buf = await downloadFile(token, (msg.voice || msg.audio).file_id);
          messageText = await transcribeBase64(buf.toString('base64'), 'audio/ogg');
          console.log(`[${name}] audio transcrito: ${messageText.slice(0, 60)}`);
        } catch (e) {
          console.error(`[${name}] error transcribiendo:`, e.message);
          messageText = 'Audio no disponible';
        }
      } else if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        try {
          const buf = await downloadFile(token, photo.file_id);
          imageBase64 = buf.toString('base64');
        } catch (e) {
          console.error(`[${name}] error descargando foto:`, e.message);
        }
        messageText = msg.caption || 'Imagen recibida';
      } else {
        return;
      }

      console.log(`[${name}] ${from}: ${messageText.slice(0, 80)}`);

      const history = await getHistory(from, name);
      const sendDocCb = async (buffer, filename) => sendDocument(token, chatId, buffer, filename);
      const { text: reply, updatedHistory } = await chatFn(history, messageText, imageBase64, imageMime, from, sendDocCb);
      await saveHistory(from, updatedHistory, name);
      await sendMessage(token, chatId, reply);

    } catch (err) {
      console.error(`[${name}] error:`, err.message);
    }
  });

  if (webhookUrl) {
    axios.post(tgApi(token, 'setWebhook'), { url: `${webhookUrl}${path}` })
      .then(r => console.log(`[${name}] Webhook registrado:`, r.data?.ok))
      .catch(e => console.error(`[${name}] Error webhook:`, e.message));
  }

  console.log(`[${name}] Bot configurado en ${path}`);
}

// Mantener compatibilidad con el bot operacional original
function setupTelegramBot(app, getHistory, saveHistory) {
  const { chat } = require('./claude');
  setupBot(app, {
    token: process.env.TELEGRAM_BOT_TOKEN,
    path: '/telegram',
    name: 'OPS',
    chatFn: chat,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL
  }, getHistory, saveHistory);
}

module.exports = { setupBot, setupTelegramBot };
