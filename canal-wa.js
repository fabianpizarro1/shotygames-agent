/**
 * Qué número de WhatsApp le toca a cada pedido de Shotygames — 2026-09-27,
 * después de la segunda restricción del número real (0993154462). En vez de
 * concentrar todo el volumen (gracias, guía enviada, avisos de logística) en
 * un solo número, se reparte entre dos:
 *
 *   - "shotygames"  → instancia real, EVOLUTION_INSTANCE_GRACIAS (0993154462)
 *   - "shotygames2" → instancia "personal" (EVOLUTION_INSTANCE_PERSONAL),
 *     libre para esto una vez que Truquito/Avanora se muden a su propio
 *     número nuevo — hasta entonces NO activar este canal, "personal" sigue
 *     ocupada con esos dos negocios.
 *
 * El canal se decide UNA VEZ, al registrar el pedido (columna CANAL WA en
 * Sheets, agregada 2026-09-27), y queda pegado a ese pedido para siempre —
 * así todos los mensajes de un mismo cliente salen siempre del mismo número,
 * sin importar que Fabián cambie el canal activo después para los pedidos
 * que vengan.
 *
 * El canal ACTIVO (el que se le asigna a un pedido nuevo) es manual y vive en
 * disco, no en una env var — cambiarlo no puede depender de un redeploy, que
 * ya se vio que a veces tarda horas (ver feedback_easypanel_deploy). Mismo
 * patrón que el token de DROPI (dropi.js, TOKEN_FILE).
 */

const fs = require('fs');

const CANAL_FILE = '/tmp/.canal_activo_shotygames';
const DEFAULT_CANAL = 'shotygames';
const CANALES_VALIDOS = ['shotygames', 'shotygames2'];

function getCanalActivo() {
  try {
    const v = fs.readFileSync(CANAL_FILE, 'utf8').trim().toLowerCase();
    if (CANALES_VALIDOS.includes(v)) return v;
  } catch (_) {}
  return DEFAULT_CANAL;
}

function setCanalActivo(canal) {
  const c = String(canal || '').trim().toLowerCase();
  if (!CANALES_VALIDOS.includes(c)) {
    throw new Error(`Canal inválido: "${canal}". Válidos: ${CANALES_VALIDOS.join(', ')}`);
  }
  fs.writeFileSync(CANAL_FILE, c);
  return c;
}

// Nombre de instancia de Evolution para un canal — evolution.js ya sabe
// mapear ese nombre a su propio apikey/cliente (ver getClient en evolution.js).
function instanciaDe(canal) {
  const c = String(canal || '').trim().toLowerCase();
  if (c === 'shotygames2') return process.env.EVOLUTION_INSTANCE_PERSONAL;
  return process.env.EVOLUTION_INSTANCE_GRACIAS;
}

module.exports = { getCanalActivo, setCanalActivo, instanciaDe, CANALES_VALIDOS, DEFAULT_CANAL };
