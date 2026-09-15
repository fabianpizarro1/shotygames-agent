// ============================================================
// CÓDIGO DEL COMPROBANTE
//
// La página del comprobante es **pública**: el cliente la abre desde WhatsApp,
// sin cuenta y sin clave. Así que la URL es la única puerta, y no puede ser
// adivinable — con `/comprobante/PED-76633` cualquiera probaría códigos hasta
// encontrar el historial de entregas de otra persona.
//
// La URL lleva el id del pedido más una firma HMAC de 12 caracteres. No hace
// falta guardar nada: el mismo id da siempre el mismo código, y sin el secreto
// no se puede fabricar uno. Rotar el secreto invalida todos los links viejos.
//
// Lo que la página muestra son datos del propio cliente (su pedido y su
// historial de entregas), nunca de otro.
// ============================================================

import { createHmac, timingSafeEqual } from 'node:crypto';

const LARGO_FIRMA = 12;

function secreto(): string {
  const s = process.env.COMPROBANTE_SECRET || process.env.CRON_SECRET;
  if (!s) {
    throw new Error('Falta COMPROBANTE_SECRET (o CRON_SECRET) para firmar los comprobantes');
  }
  return s;
}

function firmar(id: string): string {
  return createHmac('sha256', secreto())
    .update(id.trim().toUpperCase())
    .digest('base64url')
    .slice(0, LARGO_FIRMA);
}

/** `PED-76633` → `PED-76633-a1B2c3D4e5F6`. Es lo que va en la URL. */
export function codigoDe(idPedido: string): string {
  const id = idPedido.trim().toUpperCase();
  return `${id}-${firmar(id)}`;
}

/**
 * Del código de la URL al id del pedido, o `null` si la firma no cierra.
 *
 * La comparación es de tiempo constante: comparar firmas con `===` filtra por
 * cuánto tarda en fallar, y con eso se puede reconstruir una firma válida
 * carácter por carácter.
 */
export function idDelCodigo(codigo: string): string | null {
  const bruto = String(codigo ?? '').trim();
  const corte = bruto.lastIndexOf('-');
  if (corte <= 0) return null;

  const id = bruto.slice(0, corte).toUpperCase();
  const firma = bruto.slice(corte + 1);
  if (!id || firma.length !== LARGO_FIRMA) return null;

  const esperada = Buffer.from(firmar(id));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length) return null;

  return timingSafeEqual(esperada, recibida) ? id : null;
}

/** La URL completa que se le manda al cliente. */
export function urlComprobante(idPedido: string, base: string): string {
  return `${base.replace(/\/$/, '')}/comprobante/${codigoDe(idPedido)}`;
}
