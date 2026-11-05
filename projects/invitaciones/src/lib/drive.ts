import { auth as googleAuth } from '@googleapis/sheets';

// Archivos del dashboard (fotos, stickers, canción) en una carpeta de Drive propia.
// La app los sirve por /media/<id>: Drive no sirve bien como CDN (cuotas, redirecciones)
// y así además nunca se expone un archivo que no sea de esa carpeta.

let oauth: InstanceType<typeof googleAuth.OAuth2> | null = null;

async function token(): Promise<string> {
  if (!oauth) {
    oauth = new googleAuth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  }
  const { token: t } = await oauth.getAccessToken();
  if (!t) throw new Error('No se pudo obtener el token de Google');
  return t;
}

export function carpeta(): string {
  const id = process.env.DRIVE_FOLDER_INVITACIONES;
  if (!id) throw new Error('Falta DRIVE_FOLDER_INVITACIONES');
  return id;
}

export const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav'];
export const MAX_BYTES = 25 * 1024 * 1024;

// Abre una subida "resumable": el navegador manda el archivo en trozos a nuestra API
// (Vercel limita cada request a ~4,5 MB) y la API los reenvía a Drive.
export async function iniciarSubida(nombre: string, mime: string, bytes: number): Promise<string> {
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await token()}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mime,
      'X-Upload-Content-Length': String(bytes),
    },
    body: JSON.stringify({ name: nombre, parents: [carpeta()] }),
  });
  const loc = r.headers.get('location');
  if (!r.ok || !loc) throw new Error(`Drive no abrió la subida (${r.status})`);
  return loc;
}

export async function subirTrozo(sesion: string, datos: Uint8Array, inicio: number, total: number): Promise<{ listo: false } | { listo: true; id: string }> {
  if (!sesion.startsWith('https://www.googleapis.com/upload/drive/v3/files')) throw new Error('Sesión de subida inválida');
  const fin = inicio + datos.length - 1;
  const r = await fetch(sesion, {
    method: 'PUT',
    headers: { 'Content-Length': String(datos.length), 'Content-Range': `bytes ${inicio}-${fin}/${total}` },
    body: datos as BodyInit,
  });
  if (r.status === 308) return { listo: false };
  if (r.ok) return { listo: true, id: ((await r.json()) as { id: string }).id };
  throw new Error(`Drive rechazó el trozo (${r.status})`);
}

const permitidos = new Map<string, { mime: string; size: string }>();

async function meta(id: string): Promise<{ mime: string; size: string } | null> {
  if (permitidos.has(id)) return permitidos.get(id)!;
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=mimeType,size,parents,trashed`, {
    headers: { Authorization: `Bearer ${await token()}` },
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { mimeType: string; size: string; parents?: string[]; trashed?: boolean };
  if (j.trashed || !j.parents?.includes(carpeta())) return null;
  const m = { mime: j.mimeType, size: j.size };
  permitidos.set(id, m);
  return m;
}

// Devuelve el archivo respetando Range (iOS no reproduce audio si el servidor no lo soporta).
export async function leerArchivo(id: string, range: string | null): Promise<Response | null> {
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(id)) return null;
  const m = await meta(id);
  if (!m) return null;
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, {
    headers: { Authorization: `Bearer ${await token()}`, ...(range ? { Range: range } : {}) },
  });
  if (!r.ok && r.status !== 206) return null;
  const h = new Headers({
    'Content-Type': m.mime,
    'Accept-Ranges': 'bytes',
    // El id cambia con cada subida, así que el contenido de un id nunca cambia.
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
  });
  for (const k of ['content-length', 'content-range']) {
    const v = r.headers.get(k);
    if (v) h.set(k, v);
  }
  return new Response(r.body, { status: r.status, headers: h });
}
