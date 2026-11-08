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

// ---- Fotos de la fiesta ----
// Cada foto es un archivo de la misma carpeta con sus datos en appProperties
// (tipo, autor, uploader, visible, th = id de la miniatura). Drive no tiene el
// límite de ~60 escrituras/min del Sheet, que 50 invitados subiendo a la vez superarían.

export interface FotoDrive {
  id: string;
  creada: string;
  autor: string;
  visible: boolean;
  miniatura: string;
}

function recortarBytes(s: string, max: number): string {
  let out = '';
  for (const ch of s) {
    if (new TextEncoder().encode(out + ch).length > max) break;
    out += ch;
  }
  return out;
}

export async function subirSimple(nombre: string, mime: string, datos: Uint8Array, props: Record<string, string>): Promise<string> {
  const limite = 'foto' + Math.random().toString(36).slice(2);
  const seguras: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) seguras[k] = recortarBytes(v, 110);
  const meta = JSON.stringify({ name: nombre, parents: [carpeta()], appProperties: seguras });
  const enc = new TextEncoder();
  const cabeza = enc.encode(`--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${limite}\r\nContent-Type: ${mime}\r\n\r\n`);
  const cola = enc.encode(`\r\n--${limite}--`);
  const cuerpo = new Uint8Array(cabeza.length + datos.length + cola.length);
  cuerpo.set(cabeza, 0);
  cuerpo.set(datos, cabeza.length);
  cuerpo.set(cola, cabeza.length + datos.length);
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': `multipart/related; boundary=${limite}` },
    body: cuerpo as BodyInit,
  });
  if (!r.ok) throw new Error(`Drive no guardó la foto (${r.status})`);
  return ((await r.json()) as { id: string }).id;
}

async function listar(q: string): Promise<{ id: string; createdTime: string; appProperties?: Record<string, string> }[]> {
  const out: { id: string; createdTime: string; appProperties?: Record<string, string> }[] = [];
  let pagina = '';
  do {
    const u = new URL('https://www.googleapis.com/drive/v3/files');
    u.searchParams.set('q', `'${carpeta()}' in parents and trashed=false and ${q}`);
    u.searchParams.set('fields', 'nextPageToken,files(id,createdTime,appProperties)');
    u.searchParams.set('orderBy', 'createdTime desc');
    u.searchParams.set('pageSize', '1000');
    if (pagina) u.searchParams.set('pageToken', pagina);
    const r = await fetch(u, { headers: { Authorization: `Bearer ${await token()}` } });
    if (!r.ok) throw new Error(`Drive no listó las fotos (${r.status})`);
    const j = (await r.json()) as { nextPageToken?: string; files: typeof out };
    out.push(...j.files);
    pagina = j.nextPageToken ?? '';
  } while (pagina);
  return out;
}

export async function listarFotos(): Promise<FotoDrive[]> {
  const files = await listar("appProperties has { key='tipo' and value='fiesta' }");
  return files.map((f) => ({
    id: f.id,
    creada: f.createdTime,
    autor: f.appProperties?.autor ?? '',
    visible: f.appProperties?.visible !== 'no',
    miniatura: f.appProperties?.th ?? '',
  }));
}

export async function contarFotosDe(uploader: string): Promise<number> {
  if (!/^[A-Za-z0-9-]{8,40}$/.test(uploader)) return 0;
  return (await listar(`appProperties has { key='tipo' and value='fiesta' } and appProperties has { key='uploader' and value='${uploader}' }`)).length;
}

export async function ponerVisible(id: string, visible: boolean): Promise<void> {
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(id)) throw new Error('Id inválido');
  if (!(await meta(id))) throw new Error('Foto no encontrada');
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appProperties: { visible: visible ? 'si' : 'no' } }),
  });
  if (!r.ok) throw new Error(`Drive no actualizó la foto (${r.status})`);
}

// A la papelera de Drive (recuperable 30 días). Borra también la miniatura.
export async function quitarFoto(id: string, miniatura: string): Promise<void> {
  for (const f of [id, miniatura].filter(Boolean)) {
    if (!/^[A-Za-z0-9_-]{10,80}$/.test(f) || !(await meta(f))) continue;
    await fetch(`https://www.googleapis.com/drive/v3/files/${f}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trashed: true }),
    });
    permitidos.delete(f);
  }
}
