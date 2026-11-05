import { cookies } from 'next/headers';

// Sesión del dashboard: cookie "admin" = <expira>.<firma HMAC>. Sin base de datos y
// no se puede falsificar sin ADMIN_SECRET (a diferencia de una cookie "auth=ok").

export const COOKIE = 'admin';
export const DURACION_MS = 30 * 24 * 3600_000;
const enc = new TextEncoder();

async function hmac(dato: string): Promise<string> {
  const secreto = process.env.ADMIN_SECRET;
  if (!secreto || secreto.length < 16) throw new Error('Falta ADMIN_SECRET');
  const clave = await crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('HMAC', clave, enc.encode(dato));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, '0')).join('');
}

function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function crearSesion(): Promise<string> {
  const exp = String(Date.now() + DURACION_MS);
  return `${exp}.${await hmac(exp)}`;
}

export async function sesionValida(valor: string | undefined): Promise<boolean> {
  if (!valor) return false;
  const [exp, firma] = valor.split('.');
  if (!exp || !firma || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return iguales(firma, await hmac(exp));
}

export function passwordCorrecta(intento: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  return !!real && iguales(intento, real);
}

// Para los route handlers: defensa en profundidad además del proxy.
export async function esAdmin(): Promise<boolean> {
  return sesionValida((await cookies()).get(COOKIE)?.value);
}
