// La cookie antes valía literalmente "ok" — cualquiera podía escribirla a
// mano y entrar. Ahora es un HMAC de la contraseña: sin conocer APP_PASSWORD
// no se puede fabricar, y cambiar la contraseña invalida todas las sesiones.
// Web Crypto (no 'crypto' de Node) para que funcione igual en el proxy.

export async function tokenSesion(): Promise<string> {
  const clave = process.env.APP_PASSWORD;
  if (!clave) throw new Error('APP_PASSWORD no configurado');
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const firma = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('progreso-sesion-v1'));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Clave para que el bot de Telegram (servidor de KEPLER en EasyPanel) llame a
 * /api/interno/*. Se deriva de GOOGLE_CLIENT_SECRET porque los dos servidores
 * ya lo tienen: así no hay que cargar otra variable a mano en EasyPanel (que
 * es donde se olvidan). Si se rota ese secreto de Google, la clave cambia sola
 * en los dos lados.
 */
export async function tokenInterno(): Promise<string> {
  const clave = process.env.GOOGLE_CLIENT_SECRET;
  if (!clave) throw new Error('GOOGLE_CLIENT_SECRET no configurado');
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const firma = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('progreso-interno-v1'));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, '0')).join('');
}
