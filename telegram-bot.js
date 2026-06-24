let Telegraf;
try {
  ({ Telegraf } = require('telegraf'));
} catch (e) {
  throw new Error('telegraf no instalado. Corre: npm install telegraf');
}
const axios = require('axios');
const { chat } = require('./claude');
const { transcribeBase64 } = require('./transcribe');

const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || '')
  .split(',').map(id => parseInt(id.trim())).filter(Boolean);

// Convierte **bold** y *bold* a formato Telegram Markdown v1
function tgFormat(text) {
  return text.replace(/\*\*(.+?)\*\*/gs, '*$1*');
}

async function downloadTelegramFile(bot, fileId) {
  const file = await bot.telegram.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

function setupTelegramBot(app, getHistory, saveHistory) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[TELEGRAM] TELEGRAM_BOT_TOKEN no definido — bot desactivado');
    return null;
  }

  const bot = new Telegraf(token);

  bot.on('message', async (ctx) => {
    const chatId = ctx.chat.id;
    const from = `tg_${chatId}`;

    if (ADMIN_IDS.length && !ADMIN_IDS.includes(chatId)) return;

    try {
      await ctx.telegram.sendChatAction(chatId, 'typing');

      const msg = ctx.message;
      let messageText = '';
      let imageBase64 = null;
      let imageMime = 'image/jpeg';

      if (msg.text) {
        messageText = msg.text;

      } else if (msg.voice || msg.audio) {
        const fileId = (msg.voice || msg.audio).file_id;
        try {
          const buf = await downloadTelegramFile(bot, fileId);
          imageBase64 = null;
          const base64 = buf.toString('base64');
          messageText = await transcribeBase64(base64, 'audio/ogg');
          console.log('[TELEGRAM] audio transcrito:', messageText);
        } catch (e) {
          console.error('[TELEGRAM] error transcribiendo audio:', e.message);
          messageText = 'Hola';
        }

      } else if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        try {
          const buf = await downloadTelegramFile(bot, photo.file_id);
          imageBase64 = buf.toString('base64');
          imageMime = 'image/jpeg';
        } catch (e) {
          console.error('[TELEGRAM] error descargando foto:', e.message);
        }
        messageText = msg.caption || 'Te mando una imagen de la guía para que registres el envío.';

      } else if (msg.document) {
        messageText = msg.caption || 'Te mando un documento.';

      } else {
        return;
      }

      const history = await getHistory(from, 'telegram');

      // Callback para enviar PDF de vuelta por Telegram
      const sendDocumentCallback = async (buffer, filename) => {
        await bot.telegram.sendDocument(chatId, { source: buffer, filename });
      };

      const { text: reply, updatedHistory } = await chat(
        history, messageText, imageBase64, imageMime, from, sendDocumentCallback
      );

      await saveHistory(from, updatedHistory, 'telegram');

      const formatted = tgFormat(reply);
      try {
        await ctx.reply(formatted, { parse_mode: 'Markdown' });
      } catch (e) {
        // Fallback sin formato si hay error de parseo
        await ctx.reply(reply);
      }

    } catch (error) {
      console.error('[TELEGRAM] error:', error.message);
      await ctx.reply('⚠️ Error procesando tu mensaje. Intenta de nuevo.').catch(() => {});
    }
  });

  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  if (webhookUrl) {
    // Modo webhook — ruta Express directa, evita conflicto con express.json()
    app.post('/telegram', (req, res) => {
      res.sendStatus(200);
      bot.handleUpdate(req.body).catch(e => console.error('[TELEGRAM] handleUpdate error:', e.message));
    });
    bot.telegram.setWebhook(`${webhookUrl}/telegram`)
      .then(() => console.log(`[TELEGRAM] Webhook registrado: ${webhookUrl}/telegram`))
      .catch(e => console.error('[TELEGRAM] Error registrando webhook:', e.message));
  } else {
    // Modo polling — para desarrollo local
    bot.launch()
      .then(() => console.log('[TELEGRAM] Bot iniciado en modo polling'))
      .catch(e => console.error('[TELEGRAM] Error iniciando bot:', e.message));

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }

  return bot;
}

module.exports = { setupTelegramBot };
