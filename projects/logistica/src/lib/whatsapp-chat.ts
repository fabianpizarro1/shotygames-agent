// ============================================================
// HILO DE WHATSAPP DE UN PEDIDO — solo lectura, mismo número que manda el
// agradecimiento (ver whatsapp-shotygames.ts).
//
// A propósito NO hay webhook ni base de datos propia: se relee directo de
// Evolution cada vez que hace falta. El CRM de finanzas-app (adm.shotygames.com)
// probó webhook + Server-Sent Events y el resultado fue tiempo real
// inconsistente — en Vercel serverless el webhook y la conexión SSE pueden caer
// en containers distintos y el mensaje no llega hasta que cae al fallback de
// polling. Acá se evita el problema entero: no hay nada que mantener vivo,
// solo una consulta que se repite mientras el panel está abierto.
// ============================================================

import { toE164Ec, credencialesDe } from './whatsapp-shotygames';

const EVO_BASE = process.env.EVOLUTION_API_URL ?? '';

export type TipoMensaje = 'imagen' | 'audio' | 'video' | 'documento' | 'sticker' | 'ubicacion';

export interface MensajeChat {
  id: string;
  direccion: 'in' | 'out';
  /** Texto del mensaje, o el caption si es un medio con pie de foto. Vacío si el medio no tiene caption. */
  texto: string;
  /** ISO. */
  fecha: string;
  /** Si es un medio (imagen/audio/video/documento/sticker), el archivo se pide aparte con obtenerMedia(). */
  tipo?: TipoMensaje;
  /** Solo para 'documento': el nombre real del archivo. */
  nombreArchivo?: string;
  /** Solo para 'ubicacion'. */
  ubicacion?: { lat: number; lng: number };
}

async function evolutionFetch<T>(path: string, body: unknown, apiKey: string): Promise<T> {
  if (!EVO_BASE || !apiKey) {
    throw new Error('Faltan EVOLUTION_API_URL / credenciales de la instancia');
  }
  const res = await fetch(`${EVO_BASE.replace(/\/+$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`Evolution API HTTP ${res.status}: ${text.slice(0, 200)}`);
  return data as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function listar(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  return raw?.messages?.records ?? raw?.records ?? [];
}

/** El mismo orden de fallback que usa finanzas-app. Para un medio sin caption
 * devuelve '' — el frontend ya sabe mostrar el ícono correcto por `tipo`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function textoDeMensaje(item: any): string {
  const msg = item?.message ?? item?.lastMessage ?? {};
  const texto =
    item?.text ||
    item?.body ||
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedDisplayText ||
    msg.listResponseMessage?.title;
  if (texto) return texto;
  if (msg.imageMessage || msg.audioMessage || msg.pttMessage || msg.videoMessage || msg.documentMessage || msg.stickerMessage || msg.locationMessage) {
    return '';
  }
  return '(sin texto)';
}

/** Qué tipo de medio es un mensaje, y los datos propios de ese tipo (nombre de
 * archivo, coordenadas). `undefined` si es un mensaje de puro texto. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tipoDeMensaje(item: any): Pick<MensajeChat, 'tipo' | 'nombreArchivo' | 'ubicacion'> {
  const msg = item?.message ?? {};
  if (msg.imageMessage) return { tipo: 'imagen' };
  if (msg.audioMessage || msg.pttMessage) return { tipo: 'audio' };
  if (msg.videoMessage) return { tipo: 'video' };
  if (msg.documentMessage) {
    return { tipo: 'documento', nombreArchivo: msg.documentMessage.fileName || msg.documentMessage.title || 'documento' };
  }
  if (msg.stickerMessage) return { tipo: 'sticker' };
  if (msg.locationMessage) {
    const lat = msg.locationMessage.degreesLatitude;
    const lng = msg.locationMessage.degreesLongitude;
    if (typeof lat === 'number' && typeof lng === 'number') return { tipo: 'ubicacion', ubicacion: { lat, lng } };
  }
  return {};
}

/** Mimetype real del medio, tal como lo mandó WhatsApp — lo necesita el
 * navegador para poder mostrar la imagen/audio/video. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mimetypeDeMensaje(item: any): string {
  const msg = item?.message ?? {};
  return (
    msg.imageMessage?.mimetype ||
    msg.audioMessage?.mimetype ||
    msg.pttMessage?.mimetype ||
    msg.videoMessage?.mimetype ||
    msg.documentMessage?.mimetype ||
    msg.stickerMessage?.mimetype ||
    'application/octet-stream'
  );
}

/**
 * Pide el hilo con un cliente. Dos consultas, mismo patrón que finanzas-app:
 * `remoteJidAlt` trae lo entrante de contactos direccionados por @lid,
 * `remoteJid` trae lo saliente (remoteJidAlt viene vacío en esos).
 *
 * Se lee y se manda SIEMPRE desde la instancia de CANAL WA del pedido, nunca
 * de las dos: aunque el número público (0993154462) es el mismo, mezclar las
 * dos instancias mostraba conversaciones de otro cliente/contexto pegadas al
 * hilo (caso real: Hessenia Cortes, 2026-09-28). Si un pedido muestra un hilo
 * incompleto es porque su CANAL WA no es el correcto, no porque falte leer
 * la otra instancia.
 */
export async function obtenerHilo(telefono: string, canalWa?: string | null): Promise<MensajeChat[]> {
  const phone = toE164Ec(telefono);
  if (!phone) throw new Error(`Teléfono inválido (${telefono})`);
  const jid = `${phone}@s.whatsapp.net`;

  const { instance, key } = credencialesDe(canalWa);

  const [porAlt, porJid] = await Promise.all([
    evolutionFetch<unknown>(`/chat/findMessages/${encodeURIComponent(instance)}`, {
      where: { key: { remoteJidAlt: jid } },
      page: 1,
      offset: 50,
    }, key),
    evolutionFetch<unknown>(`/chat/findMessages/${encodeURIComponent(instance)}`, {
      where: { key: { remoteJid: jid } },
      page: 1,
      offset: 30,
    }, key),
  ]);

  const vistos = new Set<string>();
  const items = [...listar(porAlt), ...listar(porJid)].filter((m) => {
    const id = m?.key?.id;
    if (!id || vistos.has(id)) return false;
    vistos.add(id);
    return true;
  });

  return items
    .map((item): MensajeChat | null => {
      const id = item?.key?.id;
      if (!id) return null;

      // Ediciones (protocolMessage tipo 14/MESSAGE_EDIT) y borrados (tipo
      // 0/REVOKE) no aportan al hilo.
      const proto = item?.message?.protocolMessage;
      const tipoProto = String(proto?.type ?? '').toUpperCase();
      if (proto && (tipoProto === 'MESSAGE_EDIT' || Number(proto.type) === 14 || Number(proto.type) === 0)) {
        return null;
      }

      const ts = Number(item.messageTimestamp) || 0;
      const millis = ts > 10_000_000_000 ? ts : ts * 1000;

      return {
        id,
        direccion: item?.key?.fromMe ? 'out' : 'in',
        texto: textoDeMensaje(item),
        fecha: new Date(millis || Date.now()).toISOString(),
        ...tipoDeMensaje(item),
      };
    })
    .filter((m): m is MensajeChat => m !== null)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(-60);
}

/**
 * Trae el archivo real (imagen/audio/video/documento/sticker) de un mensaje
 * puntual, en base64 — Evolution no lo manda en `findMessages`, hay que
 * pedirlo aparte por `getBase64FromMediaMessage`. Se busca el mensaje de
 * nuevo por su id porque ese endpoint necesita el objeto completo
 * `{key, message}`, no solo el id.
 */
export async function obtenerMedia(
  canalWa: string | null | undefined,
  messageId: string
): Promise<{ base64: string; mimetype: string } | null> {
  const { instance, key } = credencialesDe(canalWa);

  const data = await evolutionFetch<unknown>(`/chat/findMessages/${encodeURIComponent(instance)}`, {
    where: { key: { id: messageId } },
    page: 1,
    offset: 5,
  }, key);

  const item = listar(data)[0];
  if (!item) return null;

  const respuesta = await evolutionFetch<{ base64?: string; mimetype?: string }>(
    `/chat/getBase64FromMediaMessage/${encodeURIComponent(instance)}`,
    { message: item },
    key
  );
  if (!respuesta?.base64) return null;

  return { base64: respuesta.base64, mimetype: respuesta.mimetype || mimetypeDeMensaje(item) };
}
