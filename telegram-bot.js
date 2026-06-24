const axios = require('axios');
const FormData = require('form-data');
const { chat } = require('./claude');
const { transcribeBase64 } = require('./transcribe');

const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || '')
  .split(',').map(id => parseInt(id.trim())).filter(Boolean);

function tgApiUrl(method) {
  return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
}

async function sendMessage(chatId, text) {
  const formatted = text.replace(/\*\*(.+?)\*\*/gs, '*$1*');
  try {
    await axios.post(tgApiUrl('sendMessage'), { chat_id: chatId, text: formatted, parse_mode: 'Markdown' });
  } catch (e) {
    await axios.post(tgApiUrl('sendMessage'), { chat_id: chatId, text });
  }
}

async function sendDocument(chatId, buffer, filename) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('document', buffer, { filename });
  await axios.post(tgApiUrl('sendDocument'), form, { headers: form.getHeaders() });
}

async function downloadFile(fileId) {
  const { data } = await axios.get(tgApiUrl(`getFile?file_id=${fileId}`));
  const filePath = data.result.file_path;
  const res = await axios.get(
    `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`,
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data);
}

function setupTelegramBot(app, getHistory, saveHistory) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[TELEGRAM] TELEGRAM_BOT_TOKEN no definido — bot desactivado');
    return;
  }

  app.post('/telegram', async (req, res) => {
    res.sendStatus(200);

    try {
      const update = req.body;
      const msg = update?.message;
      if (!msg) return;

      const chatId = msg.chat.id;
      const from = `tg_${chatId}`;

      if (ADMIN_IDS.length && !ADMIN_IDS.includes(chatId)) return;

      let messageText = '';
      let imageBase64 = null;
      let imageMime = 'image/jpeg';

      if (msg.text) {
        messageText = msg.text;

      } else if (msg.voice || msg.audio) {
        const fileId = (msg.voice || msg.audio).file_id;
        try {
          const buf = await downloadFile(fileId);
          messageText = await transcribeBase64(buf.toString('base64'), 'audio/ogg');
          console.log('[TELEGRAM] audio transcrito:', messageText);
        } catch (e) {
          console.error('[TELEGRAM] error transcribiendo audio:', e.message);
          messageText = 'Hola';
        }

      } else if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        try {
          const buf = await downloadFile(photo.file_id);
          imageBase64 = buf.toString('base64');
          imageMime = 'image/jpeg';
        } catch (e) {
          console.error('[TELEGRAM] error descargando foto:', e.message);
        }
        messageText = msg.caption || 'Te mando una imagen de la guía para que registres el envío.';

      } else {
        return;
      }

      console.log(`[TELEGRAM] ${from}: ${messageText.slice(0, 80)}`);

      const history = await getHistory(from, 'telegram');

      const sendDocumentCallback = async (buffer, filename) => {
        await sendDocument(chatId, buffer, filename);
      };

      const { text: reply, updatedHistory } = await chat(
        history, messageText, imageBase64, imageMime, from, sendDocumentCallback
      );

      await saveHistory(from, updatedHistory, 'telegram');
      await sendMessage(chatId, reply);

    } catch (error) {
      console.error('[TELEGRAM] error:', error.message);
    }
  });

  // Registrar webhook con Telegram
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  if (webhookUrl) {
    axios.post(tgApiUrl('setWebhook'), { url: `${webhookUrl}/telegram` })
      .then(r => console.log('[TELEGRAM] Webhook registrado:', r.data?.ok))
      .catch(e => console.error('[TELEGRAM] Error registrando webhook:', e.message));
  }

  console.log('[TELEGRAM] Bot configurado OK');
}

module.exports = { setupTelegramBot };
