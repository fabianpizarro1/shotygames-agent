// ============================================================
// DISPARADORES AUTOMÁTICOS DE SHOTYGAMES (solo servidor)
//
// Puerto EXACTO de `/api/whatsapp` de `finanzas-app`. Mismo texto, mismo
// candado y misma columna LOG — la idea no es reinventar el flujo, es que
// cambiar un estado desde esta app haga lo mismo que hacía antes.
//
// Hoy hay un solo disparador: **el agradecimiento cuando el pedido pasa a
// ENTREGADO o PAGADO**. El de la guía no va acá porque no lo dispara un cambio
// de estado, sino el botón de "mandar guía" de la pantalla de pedidos.
//
// ⚠️ Esto MANDA UN WHATSAPP REAL A UN CLIENTE REAL. El candado contra duplicados
// es la columna LOG (AC): si ya dice "agradecimiento enviado" o "gracias ok",
// no se vuelve a mandar. Lo mismo que revisa `finanzas-app`, para que las dos
// apps no le escriban dos veces a la misma persona.
// ============================================================

import { google, type sheets_v4 } from 'googleapis';

const EVO_BASE = process.env.EVOLUTION_API_URL ?? '';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_ID ?? '';
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? '';

/**
 * Interruptor de seguridad para probar sin escribirle a nadie. Se usó para
 * verificar el flujo entero en local; en Vercel NO está puesta, así que en
 * producción el envío es real.
 */
const SIMULAR = process.env.WHATSAPP_SIMULAR === '1';

const HOJA = 'PEDIDOS';

function getSheets(): sheets_v4.Sheets {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth });
}

function toE164Ec(raw: string): string {
  const n = String(raw || '').replace(/\D/g, '');
  if (!n) return '';
  if (/^5939\d{8}$/.test(n)) return n;
  if (/^593\d{8}$/.test(n)) return n;
  if (/^9\d{8}$/.test(n)) return '593' + n;
  if (/^09\d{8}$/.test(n)) return '593' + n.slice(1);
  return '';
}

function primerNombre(nombre: string): string {
  const first = String(nombre || '').trim().split(' ')[0] || 'Cliente';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/** Texto idéntico al de finanzas-app. Si se cambia uno, cambiar el otro. */
export function mensajeGracias(nombre: string): string {
  return `Hola ${primerNombre(nombre)}, me informan que ya se entregó el paquete. Quería agradecerte por confiar en nosotros y esperamos que se diviertan con nuestros productos 😊

Si suben historias jugando no olviden etiquetarnos como *@shotygames*, nos encantaría verlo.

Muchas gracias 🥳`;
}

/** Hora de Ecuador (UTC-5), como la escribe finanzas-app en el LOG. */
function ahora(): string {
  return new Date(Date.now() - 5 * 3600000).toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Manda un WhatsApp por Evolution API. Exportado porque lo usa también el cron
 * de avisos — el mismo número y el mismo camino que el agradecimiento.
 */
export async function enviarWhatsApp(telefono: string, text: string): Promise<void> {
  const phone = toE164Ec(telefono);
  if (!phone) throw new Error(`Teléfono inválido (${telefono})`);
  return enviar(phone, text);
}

async function enviar(phone: string, text: string): Promise<void> {
  if (SIMULAR) {
    console.log(`[WHATSAPP SIMULADO] → ${phone}\n${text}`);
    return;
  }
  if (!EVO_BASE || !EVO_INSTANCE || !EVO_KEY) {
    throw new Error('Faltan EVOLUTION_API_URL / EVOLUTION_INSTANCE_ID / EVOLUTION_API_KEY');
  }
  const url = `${EVO_BASE.replace(/\/+$/, '')}/message/sendText/${encodeURIComponent(EVO_INSTANCE)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({ number: phone, text }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Evolution API HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}

export interface ResultadoDisparador {
  /** Qué pasó, en texto, para mostrárselo a Fabián. */
  detalle: string;
  enviado: boolean;
}

/**
 * Corre el disparador que corresponda al nuevo estado.
 *
 * Devuelve `null` si ese estado no dispara nada. NUNCA tira: que falle el
 * WhatsApp no puede deshacer el cambio de estado, que ya está escrito en el
 * Sheet — se informa y listo.
 */
export async function dispararPorEstado(opciones: {
  fila: number;
  estadoNuevo: string;
  nombre: string;
  telefono: string;
  /** Columna LOG (AC) y su índice 0-based, tal como se leyeron del Sheet. */
  logActual: string;
  colLog: number;
}): Promise<ResultadoDisparador | null> {
  const { fila, estadoNuevo, nombre, telefono, logActual, colLog } = opciones;

  const estado = String(estadoNuevo || '').toUpperCase().trim();
  if (estado !== 'ENTREGADO' && estado !== 'PAGADO') return null;

  try {
    // Candado contra duplicados: el mismo que usa finanzas-app.
    const log = String(logActual || '').toLowerCase();
    if (log.includes('agradecimiento enviado') || log.includes('gracias ok')) {
      return { detalle: 'El agradecimiento ya se había enviado', enviado: false };
    }

    const phone = toE164Ec(telefono);
    if (!phone) {
      await escribirLog(fila, colLog, `ERROR: Teléfono inválido (${telefono})`);
      return { detalle: `No se pudo enviar: teléfono inválido (${telefono})`, enviado: false };
    }

    await enviar(phone, mensajeGracias(nombre));

    const nuevoLog = `Agradecimiento enviado | ${ahora()}`;
    await escribirLog(fila, colLog, nuevoLog);
    return {
      detalle: SIMULAR ? 'Agradecimiento SIMULADO (no se envió)' : 'Agradecimiento enviado',
      enviado: !SIMULAR,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[disparador gracias]', msg);
    await escribirLog(fila, colLog, `ERROR: ${msg}`).catch(() => {});
    return { detalle: `El estado se guardó, pero el WhatsApp falló: ${msg}`, enviado: false };
  }
}

function letra(i: number): string {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

async function escribirLog(fila: number, colLog: number, texto: string): Promise<void> {
  const id = process.env.SHEETS_ID_SHOTYGAMES;
  if (!id || colLog === undefined || colLog < 0) return;
  await getSheets().spreadsheets.values.update({
    spreadsheetId: id,
    range: `${HOJA}!${letra(colLog)}${fila}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[texto]] },
  });
}
