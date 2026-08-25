/**
 * Mensaje de "guía enviada" (texto + PDF) para pedidos de Shotygames,
 * disparado por el bot OPS de WhatsApp cuando Fabián dice "manda las guías
 * a los clientes". Replica exactamente buildGuiaMessage de PROYECTO SHEETS
 * CLAUDE/finanzas-app (src/app/api/whatsapp/route.ts, action "guia") —
 * mismo texto, misma instancia de Evolution ("shotygames"), mismo control
 * de duplicados por la columna LOG.
 *
 * Antes, notificar_guia_clientes en claude.js solo marcaba una casilla
 * (columna AB) asumiendo que algo más la escuchaba y mandaba el mensaje —
 * ya no hay nada escuchando esa casilla, así que no mandaba nada (bug real,
 * encontrado 2026-08-22). Esto manda directo, sin depender de la casilla.
 */

const { sendText, sendDocument } = require('./evolution');
const { downloadPdf } = require('./pdf');
const sheets = require('./sheets');

const INSTANCE = process.env.EVOLUTION_INSTANCE_GRACIAS;

function firstName(nombre) {
  const first = (String(nombre || '').trim().split(' ')[0]) || 'Cliente';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// Mismo criterio que dropi.js: 0991234567 → 593991234567.
function toE164Ec(raw) {
  const n = String(raw || '').replace(/\D/g, '');
  if (!n) return '';
  if (/^5939\d{8}$/.test(n)) return n;
  if (/^593\d{8}$/.test(n)) return n;
  if (/^9\d{8}$/.test(n)) return '593' + n;
  if (/^09\d{8}$/.test(n)) return '593' + n.slice(1);
  return '';
}

// linkRastreo se recibe por compatibilidad de firma pero ya no se usa en el
// texto — Fabián pidió sacar el link de rastreo del mensaje (2026-08-22).
function buildGuiaMessage(nombre, transportadora, guia, linkRastreo) {
  const cliente = firstName(nombre);
  const transp = String(transportadora || 'SERVIENTREGA').toUpperCase().trim();

  return `*${cliente}* 👋 para informarte que tu pedido ya fue enviado a través de *${transp}*. Te adjunto el número de guía:

🚛 Número de guía: *${guia}*

Los repartidores se comunicarán contigo al momento de la entrega para que por favor estés pendiente 🙏

Si puedes nos avisas cuando lo recibas, muchas gracias por confiar en nosotros 😊`;
}

// Cuenta propia de Shotygames: siempre despacha por Servientrega, así que
// este patrón de CloudFront es válido siempre acá (a diferencia de
// dropshipping, que usa varias transportadoras).
function guiaPdfUrl(dropiId, guia) {
  return `https://d39ru7awumhhs2.cloudfront.net/ecuador/guias/servientrega/ORDEN-${dropiId}-GUIA-${guia}.pdf`;
}

function nowStr() {
  const d = new Date(Date.now() - 5 * 3600000); // Ecuador UTC-5
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Manda el texto + PDF si no se mandó antes (LOG ya con "guía enviada").
 * COOPERATIVA/DOMICILIO nunca llevan guía DROPI — se omite, igual que en
 * el CRM. No lanza para "ya enviado" ni "transportadora sin guía" — esos
 * son casos normales, no errores.
 */
async function notificarGuia({ fila, nombre, telefono, guia, transportadora, dropiId, log }) {
  const logLower = String(log || '').toLowerCase();
  if (logLower.includes('guía enviada') || logLower.includes('guia enviada')) {
    return { enviado: false, motivo: 'ya enviado antes' };
  }
  const transp = String(transportadora || '').toUpperCase();
  if (transp.includes('DOMICILIO') || transp.includes('COOPERATIVA')) {
    return { enviado: false, motivo: `no aplica (${transp})` };
  }
  if (!guia) {
    return { enviado: false, motivo: 'sin número de guía' };
  }

  if (!INSTANCE) throw new Error('EVOLUTION_INSTANCE_GRACIAS no configurado en .env');
  const phone = toE164Ec(telefono);
  if (!phone) throw new Error(`teléfono inválido (${telefono})`);

  await sendText(phone, buildGuiaMessage(nombre, transportadora, guia, ''), INSTANCE);

  let pdfEnviado = false;
  if (dropiId) {
    try {
      const buf = await downloadPdf(guiaPdfUrl(dropiId, guia));
      await sendDocument(phone, buf, `guia-${guia}.pdf`, '', INSTANCE);
      pdfEnviado = true;
    } catch (e) {
      console.error(`notificar-guia-cliente: error mandando PDF fila ${fila}:`, e.message);
    }
  }

  await sheets.escribirLog(fila, `Guía enviada | ${guia}${pdfEnviado ? ' | PDF ok' : ''} | ${nowStr()}`);
  return { enviado: true, pdfEnviado };
}

module.exports = { notificarGuia, buildGuiaMessage, guiaPdfUrl, toE164Ec };
