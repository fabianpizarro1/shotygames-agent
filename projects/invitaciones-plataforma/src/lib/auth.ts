import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db, type Evento, type Usuario } from './db';

// Cuentas de clientes (adaptador local): correo + contraseña con scrypt y cookie firmada con HMAC.
// Con Supabase Auth esta capa se reemplaza (enlace mágico / Google) sin cambiar las pantallas.

export const COOKIE_SESION = 'sesion';
const DURACION_MS = 30 * 24 * 3600_000;
const enc = new TextEncoder();

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('Falta SESSION_SECRET (mínimo 16 caracteres)');
  return s;
}

async function hmac(dato: string): Promise<string> {
  const clave = await crypto.subtle.importKey('raw', enc.encode(secreto()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('HMAC', clave, enc.encode(dato));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, '0')).join('');
}

function iguales(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function hashClave(clave: string): string {
  const sal = randomBytes(16).toString('hex');
  return `${sal}:${scryptSync(clave, sal, 64).toString('hex')}`;
}

export function claveCorrecta(clave: string, hash: string): boolean {
  const [sal, h] = hash.split(':');
  if (!sal || !h) return false;
  return iguales(scryptSync(clave, sal, 64).toString('hex'), h);
}

export async function crearSesion(usuarioId: string): Promise<string> {
  const exp = String(Date.now() + DURACION_MS);
  const dato = `${usuarioId}.${exp}`;
  return `${dato}.${await hmac(dato)}`;
}

/** Valida la cookie y devuelve el id del usuario (sin tocar la base de datos). */
export async function usuarioIdDeCookie(valor: string | undefined): Promise<string | null> {
  if (!valor) return null;
  const partes = valor.split('.');
  if (partes.length !== 3) return null;
  const [id, exp, firma] = partes;
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return null;
  return iguales(firma, await hmac(`${id}.${exp}`)) ? id : null;
}

export async function usuarioActual(): Promise<Usuario | null> {
  const id = await usuarioIdDeCookie((await cookies()).get(COOKIE_SESION)?.value);
  return id ? db().usuarioPorId(id) : null;
}

/** El evento solo se entrega a su dueño (o a un admin). */
export async function eventoDelUsuario(eventoId: string): Promise<{ usuario: Usuario; evento: Evento } | null> {
  const usuario = await usuarioActual();
  if (!usuario) return null;
  const evento = await db().eventoPorId(eventoId);
  if (!evento || (evento.dueno_id !== usuario.id && !usuario.es_admin)) return null;
  return { usuario, evento };
}

export async function registrar(email: string, clave: string, nombre: string): Promise<Usuario> {
  const correo = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('Correo no válido');
  if (clave.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
  if (await db().usuarioPorEmail(correo)) throw new Error('Ese correo ya tiene una cuenta');
  const u: Usuario = { id: randomUUID(), email: correo, nombre: nombre.trim().slice(0, 80), hash: hashClave(clave), es_admin: false, creado_at: new Date().toISOString() };
  await db().crearUsuario(u);
  return u;
}

export async function ingresar(email: string, clave: string): Promise<Usuario> {
  const u = await db().usuarioPorEmail(email.trim().toLowerCase());
  // Misma respuesta para "no existe" y "clave mala": no se revela qué correos tienen cuenta.
  if (!u || !claveCorrecta(clave, u.hash)) throw new Error('Correo o contraseña incorrectos');
  return u;
}
