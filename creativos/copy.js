/**
 * Genera el copy del creativo con Claude: headline, texto primario, CTA,
 * descripción y el prompt de imagen (para Nano Banana).
 */
const Anthropic = require('@anthropic-ai/sdk');
const { AVATARES, ANGULOS } = require('./productos');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

const VOZ_MARCA = `
Marca: ShotyGames (Ecuador). Vende juegos de shots/retos para fiestas y parejas.
Se compra por WhatsApp, envío a todo Ecuador. Público adulto joven.
Tono: divertido, cómplice, atrevido y picante PERO sin ser explícito ni vulgar.
Apto para anuncios de Meta (evita lenguaje sexual explícito que Meta rechazaría).
Español ecuatoriano natural. Emojis con moderación (1-3 por texto).`;

/**
 * @returns {Promise<{headline,texto_primario,descripcion,cta,image_prompt}>}
 */
async function generarCopy(producto, anguloKey) {
  const angulo = ANGULOS[anguloKey] || anguloKey;
  const avatar = AVATARES[producto.avatar] || producto.avatar;

  const prompt = `${VOZ_MARCA}

PRODUCTO: ${producto.nombre} — $${producto.precio}
Resumen: ${producto.resumen}
Beneficios: ${producto.beneficios.join(' · ')}

AVATAR (a quién le hablamos): ${avatar}
ÁNGULO del anuncio: ${angulo}

Crea UN creativo para Meta Ads (Facebook/Instagram) con ese ángulo y avatar.
Responde SOLO con un objeto JSON válido, sin texto extra, con estas llaves:
{
  "headline": "titular corto, máx 40 caracteres, con gancho",
  "texto_primario": "texto principal del anuncio, 2-4 frases, persuasivo, termina invitando a pedir por WhatsApp",
  "descripcion": "una línea de apoyo, máx 30 caracteres",
  "cta": "uno de: Enviar mensaje | Comprar | Más información",
  "image_prompt": "instrucción en INGLÉS para editar la foto del producto y convertirla en escena de anuncio según el ángulo. Mantén el producto reconocible. Sin texto en la imagen. Fotorrealista."
}`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = res.content[0].text.trim();
  const json = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(json);
}

module.exports = { generarCopy };
