/**
 * Genera el visual del creativo con Nano Banana (Gemini 2.5 Flash Image),
 * image-to-image: toma la foto real del producto y la convierte en escena de anuncio.
 */
const axios = require('axios');
const fs = require('fs');

// Si el modelo cambia de nombre, ajustar aquí.
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

// Descarga una imagen (URL pública) y la devuelve en base64.
async function urlABase64(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  const mime = res.headers['content-type'] || 'image/jpeg';
  return { data: Buffer.from(res.data).toString('base64'), mime };
}

/**
 * @param {string} imagenProductoUrl  URL pública de la foto real del producto
 * @param {string} imagePrompt        instrucción de edición (en inglés)
 * @param {string} outPath            ruta donde guardar el PNG resultante
 * @returns {Promise<string>} outPath
 */
async function generarImagen(imagenProductoUrl, imagePrompt, outPath) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Falta GEMINI_API_KEY en .env');

  const { data: imgB64, mime } = await urlABase64(imagenProductoUrl);

  const url = `${API}/${GEMINI_IMAGE_MODEL}:generateContent?key=${key}`;
  const body = {
    contents: [{
      parts: [
        { text: imagePrompt },
        { inline_data: { mime_type: mime, data: imgB64 } },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };

  let res;
  try {
    res = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000,
    });
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`Gemini API ${err.response?.status || ''}: ${detail}`.slice(0, 600));
  }

  const parts = res.data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData || p.inline_data);
  const out = imgPart && (imgPart.inlineData || imgPart.inline_data);
  if (!out?.data) {
    throw new Error('Gemini no devolvió imagen: ' + JSON.stringify(res.data).slice(0, 300));
  }

  fs.writeFileSync(outPath, Buffer.from(out.data, 'base64'));
  return outPath;
}

module.exports = { generarImagen };
