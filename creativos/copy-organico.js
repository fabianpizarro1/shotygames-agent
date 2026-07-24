/**
 * Genera el copy de un POST ORGÁNICO de Instagram (no un anuncio pagado):
 * caption listo para copiar/pegar + hashtags + el prompt de imagen para Nano Banana.
 *
 * Diferencia con copy.js (ads): sin headline/CTA de botón de Meta Ads.
 * En su lugar, el caption mismo invita a escribir por WhatsApp o ver el link en bio.
 */
const Anthropic = require('@anthropic-ai/sdk');
const { AVATARES, ANGULOS } = require('./productos');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

const VOZ_MARCA = `
Marca: ShotyGames (Ecuador). Vende juegos de shots/retos para fiestas y parejas.
Se compra por WhatsApp, envío a todo Ecuador. Público adulto joven (18-35).
Tono: divertido, cómplice, atrevido y picante PERO sin ser explícito ni vulgar.
Español ecuatoriano natural, cercano, como le hablarías a un grupo de amigos.
Emojis con moderación (2-4 en el caption).`;

/**
 * @returns {Promise<{caption, hashtags: string[], image_prompt}>}
 */
async function generarCopyOrganico(producto, anguloKey) {
  const angulo = ANGULOS[anguloKey] || anguloKey;
  const avatar = AVATARES[producto.avatar] || producto.avatar;

  const prompt = `${VOZ_MARCA}

PRODUCTO: ${producto.nombre} — $${producto.precio}
Resumen: ${producto.resumen}
Beneficios: ${producto.beneficios.join(' · ')}

AVATAR (a quién le hablamos): ${avatar}
ÁNGULO del post: ${angulo}

Crea UN post ORGÁNICO de Instagram (feed) con ese ángulo y avatar. No es un anuncio pagado:
nada de "botón CTA", el caption mismo debe invitar a escribir por WhatsApp o revisar el link en bio.

Responde SOLO con un objeto JSON válido, sin texto extra, con estas llaves:
{
  "caption": "caption completo listo para publicar, 2-5 líneas, con gancho en la primera línea, termina invitando a escribir por WhatsApp o ver el link en bio",
  "hashtags": ["array de 8-12 hashtags relevantes: mezcla de marca (#shotygames), nicho (fiestas/juegos de mesa/regalos) y Ecuador (#ecuador #quito #guayaquil según aplique), sin el símbolo # repetido en cada string, ponlo tú"],
  "image_prompt": "instrucción en INGLÉS para editar la foto del producto y convertirla en escena de post orgánico según el ángulo. Mantén el producto reconocible. Sin texto en la imagen. Fotorrealista, se ve como contenido real de una cuenta de Instagram, no como anuncio."
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

module.exports = { generarCopyOrganico };
