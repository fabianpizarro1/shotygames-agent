/**
 * Notificación automática al cliente cuando DROPI genera la guía de envío.
 *
 * Se dispara desde sincronizar_guias (claude-dropshipping.js) la primera vez
 * que un pedido pasa a GUIA_GENERADA — manda el mensaje con transportadora,
 * guía, link de rastreo y valor a pagar, más el PDF de la guía.
 *
 * Va por la instancia de WhatsApp "personal" (EVOLUTION_INSTANCE_PERSONAL),
 * separada de la operativa y de ventas.
 */

const { sendText, sendDocument } = require('../../evolution');
const { downloadPdf } = require('../../pdf');

const INSTANCE = process.env.EVOLUTION_INSTANCE_PERSONAL;

// Cada transportadora tiene su propio sitio de rastreo. Solo Servientrega
// acepta la guía como parámetro en la URL (confirmado); Laar Courier y
// Gintracom requieren escribirla a mano en su buscador — no hay endpoint de
// deep-link documentado, así que se manda el link general en vez de adivinar
// un parámetro que podría no existir.
const TRANSPORTADORAS = {
  SERVIENTREGA: {
    nombre: 'Servientrega',
    rastreo: (guia) => `https://www.servientrega.com.ec/Tracking/Index/?guia=${guia}`
  },
  LAARCOURIER: {
    nombre: 'Laar Courier',
    rastreo: () => 'https://fenixoper.laarcourier.com/Tracking/GuiaCompleta.aspx'
  },
  GINTRACOM: {
    nombre: 'Gintracom',
    rastreo: () => 'https://ec.gintracom.site/tracking'
  }
};

function primerNombre(nombreCompleto) {
  const first = (nombreCompleto || '').trim().split(/\s+/)[0] || '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// Mismo criterio que pedidos.js al armar la orden: 0991234567 → 593991234567.
function telefonoWA(telefono) {
  return String(telefono || '').trim().replace(/^0/, '593').replace(/^\+/, '');
}

function mensajeGuiaLista({ nombre, transportadora, guia, valor }) {
  const t = TRANSPORTADORAS[String(transportadora || '').toUpperCase()];
  const nombreT = t ? t.nombre : (transportadora || 'la transportadora');
  const linkRastreo = t ? t.rastreo(guia) : null;

  return `*${primerNombre(nombre)}* 👋 Te cuento que tu pedido ya fue enviado por *${nombreT.toUpperCase()}* 🚛📦

Tu número de guía es: *${guia}*
${linkRastreo ? `\n🔎 *Puedes rastrearlo aquí:*\n${linkRastreo}\n` : ''}
Cuando el paquete esté por llegar, el repartidor puede comunicarse contigo, así que por favor mantente pendiente de tu celular 🙏

💵 *Valor a pagar al recibir: $${Number(valor || 0).toFixed(2)} en efectivo.*

Por favor procura tener disponible el valor del pedido al momento de la entrega 😊

¡Muchas gracias por tu compra! 🙌`;
}

/**
 * Manda el mensaje + el PDF de la guía al cliente.
 * No hace fallback silencioso: si algo falla, revienta para que quien llama
 * decida cómo reportarlo (sincronizar_guias lo captura y sigue con el resto).
 */
async function notificarGuiaLista({ nombre, telefono, transportadora, guia, valor, pdfUrl }) {
  if (!INSTANCE) throw new Error('EVOLUTION_INSTANCE_PERSONAL no configurado en .env');
  if (!telefono) throw new Error('pedido sin teléfono');
  if (!guia) throw new Error('pedido sin número de guía');

  const to = telefonoWA(telefono);
  const texto = mensajeGuiaLista({ nombre, transportadora, guia, valor });

  await sendText(to, texto, INSTANCE);

  if (pdfUrl) {
    const buf = await downloadPdf(pdfUrl);
    await sendDocument(to, buf, `guia-${guia}.pdf`, '', INSTANCE);
  }
}

module.exports = { notificarGuiaLista, mensajeGuiaLista, telefonoWA };
