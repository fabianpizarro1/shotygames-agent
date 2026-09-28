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

export interface MensajeChat {
  id: string;
  direccion: 'in' | 'out';
  texto: string;
  /** ISO. */
  fecha: string;
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

/** El mismo orden de fallback que usa finanzas-app para no mostrar "(sin texto)". */
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

  if (msg.imageMessage) return '📷 Imagen';
  if (msg.audioMessage || msg.pttMessage) return '🎤 Audio';
  if (msg.documentMessage) return '📄 Documento';
  if (msg.stickerMessage) return 'Sticker';
  if (msg.locationMessage) return '📍 Ubicación';
  return '(sin texto)';
}

/**
 * Pide el hilo con un cliente. Dos consultas, mismo patrón que finanzas-app:
 * `remoteJidAlt` trae lo entrante de contactos direccionados por @lid,
 * `remoteJid` trae lo saliente (remoteJidAlt viene vacío en esos).
 */
export async function obtenerHilo(telefono: string, canalWa?: string | null): Promise<MensajeChat[]> {
  const phone = toE164Ec(telefono);
  if (!phone) throw new Error(`Teléfono inválido (${telefono})`);
  const jid = `${phone}@s.whatsapp.net`;

  // Mismo canal por el que se le manda a este pedido (columna CANAL WA) — si
  // se lee de la instancia equivocada, el hilo sale vacío o es el de otra
  // conversación (otro número puede tener el mismo cliente hablándole por
  // otro motivo). Ver credencialesDe() en whatsapp-shotygames.ts.
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
      };
    })
    .filter((m): m is MensajeChat => m !== null)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(-60);
}
