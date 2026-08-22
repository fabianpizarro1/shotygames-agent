/**
 * Mensaje de "gracias" cuando un pedido de Shotygames pasa a Pagado/Entregado.
 *
 * Replica exactamente la lógica de PROYECTO SHEETS CLAUDE/finanzas-app
 * (src/app/api/whatsapp/route.ts, action "gracias") — mismo texto, misma
 * instancia de Evolution ("shotygames"), mismo control de duplicados por la
 * columna LOG. Existe porque ese CRM solo dispara el mensaje cuando ALGUIEN
 * cambia el estado desde su propia UI (llama a su API) — un cambio hecho acá
 * (por sincronizar_pagos_dropi) nunca pasa por esa API, así que nunca se
 * enteraba. Esto le da a este bot el mismo disparo, sin depender del CRM.
 */

const { sendText } = require('./evolution');
const sheets = require('./sheets');

const INSTANCE = process.env.EVOLUTION_INSTANCE_GRACIAS;

function toE164Ec(raw) {
  const n = String(raw || '').replace(/\D/g, '');
  if (!n) return '';
  if (/^5939\d{8}$/.test(n)) return n;
  if (/^593\d{8}$/.test(n)) return n;
  if (/^9\d{8}$/.test(n)) return '593' + n;
  if (/^09\d{8}$/.test(n)) return '593' + n.slice(1);
  return '';
}

function firstName(nombre) {
  const first = (String(nombre || '').trim().split(' ')[0]) || 'Cliente';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function buildGraciasMessage(nombre) {
  const cliente = firstName(nombre);
  return `Hola ${cliente}, me informan que ya se entregó el paquete. Quería agradecerte por confiar en nosotros y esperamos que se diviertan con nuestros productos 😊

Si suben historias jugando no olviden etiquetarnos como *@shotygames*, nos encantaría verlo.

Muchas gracias 🥳`;
}

function nowStr() {
  const d = new Date(Date.now() - 5 * 3600000); // Ecuador UTC-5
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Manda el gracias si no se mandó antes (mismo chequeo de LOG que el CRM:
 * "agradecimiento enviado" o "gracias ok"). Silencioso si ya se envió — no
 * es un error, es el caso normal cuando el pedido ya venía de Pagado antes.
 */
async function notificarGracias({ fila, nombre, telefono, log }) {
  const logLower = String(log || '').toLowerCase();
  if (logLower.includes('agradecimiento enviado') || logLower.includes('gracias ok')) {
    return { enviado: false, motivo: 'ya enviado antes' };
  }

  if (!INSTANCE) throw new Error('EVOLUTION_INSTANCE_GRACIAS no configurado en .env');
  const phone = toE164Ec(telefono);
  if (!phone) throw new Error(`teléfono inválido (${telefono})`);

  await sendText(phone, buildGraciasMessage(nombre), INSTANCE);
  await sheets.escribirLog(fila, `Agradecimiento enviado | ${nowStr()}`);
  return { enviado: true };
}

module.exports = { notificarGracias, buildGraciasMessage, toE164Ec };
