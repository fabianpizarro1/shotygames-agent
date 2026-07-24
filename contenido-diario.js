/**
 * contenido-diario.js — Cada día genera 1 creativo (imagen + caption) para Instagram
 * y lo manda por Telegram para que Fabián lo copie/pegue y publique él mismo.
 *
 * No publica nada automáticamente. No usa la API de Instagram — es puro
 * "aquí tienes el material del día, cópialo y súbelo tú".
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const { PRODUCTOS } = require('./creativos/productos');
const { generarCopyOrganico } = require('./creativos/copy-organico');
const { generarImagen } = require('./creativos/imagen');
const { siguienteCombo } = require('./creativos/rotacion');

const TOKEN = process.env.TELEGRAM_PERSONAL_TOKEN;
const CHAT = process.env.TELEGRAM_ADMIN_IDS?.split(',')[0];

function tgApi(method) {
  return `https://api.telegram.org/bot${TOKEN}/${method}`;
}

async function enviarFoto(imgPath, caption) {
  const form = new FormData();
  form.append('chat_id', String(CHAT));
  form.append('caption', caption);
  form.append('photo', fs.createReadStream(imgPath));
  await axios.post(tgApi('sendPhoto'), form, { headers: form.getHeaders() });
}

async function enviarTexto(texto) {
  await axios.post(tgApi('sendMessage'), { chat_id: CHAT, text: texto, parse_mode: 'Markdown' });
}

// Arma el caption final: el texto + hashtags en su propio bloque, listo para copiar tal cual.
function armarCaptionCompleto(copy) {
  const hashtags = (copy.hashtags || [])
    .map(h => (h.startsWith('#') ? h : `#${h}`))
    .join(' ');
  return `${copy.caption}\n\n${hashtags}`;
}

/**
 * Genera el creativo del día y lo manda por Telegram (bot PERSONAL).
 * Pensado para correr por cron una vez al día.
 */
async function enviarContenidoDiario() {
  if (!TOKEN || !CHAT) {
    console.error('[contenido-diario] Falta TELEGRAM_PERSONAL_TOKEN o TELEGRAM_ADMIN_IDS — no se puede enviar.');
    return;
  }

  const { producto, angulo } = await siguienteCombo(PRODUCTOS);
  console.log(`[contenido-diario] Generando: ${producto.nombre} · ángulo "${angulo}"`);

  const copy = await generarCopyOrganico(producto, angulo);

  const outDir = path.join(__dirname, 'creativos', 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const imgPath = path.join(outDir, `diario-${Date.now()}.png`);

  await generarImagen(producto.imagen, copy.image_prompt, imgPath);

  const captionCompleto = armarCaptionCompleto(copy);
  const encabezado = `📅 Contenido de hoy — ${producto.nombre}\n\n`;

  try {
    await enviarFoto(imgPath, `${encabezado}Caption abajo en el siguiente mensaje (para copiar limpio) 👇`);
    await enviarTexto(captionCompleto);
  } finally {
    fs.unlink(imgPath, () => {});
  }

  console.log(`[contenido-diario] Enviado: ${producto.nombre} · ${angulo}`);
}

module.exports = { enviarContenidoDiario };
