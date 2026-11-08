import type { Config } from './config';
import { db, type CancionDb } from './db';
import { nuevoToken } from './tokens';

// Búsqueda de canciones con la API pública de Deezer (sin claves): portada, 30 s de muestra
// y el código ISRC, con el que después se encuentra la misma grabación en Spotify.

export interface ResultadoMusica {
  id: string;
  titulo: string;
  artista: string;
  portada: string;
  preview: string;
}

interface DzTrack {
  id: number;
  title: string;
  isrc?: string;
  preview?: string;
  artist?: { name?: string };
  album?: { cover_medium?: string };
}

const aResultado = (t: DzTrack): ResultadoMusica => ({
  id: String(t.id),
  titulo: t.title,
  artista: t.artist?.name ?? '',
  portada: t.album?.cover_medium ?? '',
  preview: t.preview ?? '',
});

export async function buscarCanciones(q: string): Promise<ResultadoMusica[]> {
  const u = new URL('https://api.deezer.com/search');
  u.searchParams.set('q', q);
  u.searchParams.set('limit', '12');
  // Misma búsqueda = misma respuesta durante una hora: cuida el límite de Deezer en la fiesta.
  const r = await fetch(u, { next: { revalidate: 3600 } });
  if (!r.ok) throw new Error(`Deezer respondió ${r.status}`);
  const j = (await r.json()) as { data?: DzTrack[]; error?: unknown };
  if (j.error) throw new Error('Deezer no pudo buscar');
  return (j.data ?? []).map(aResultado);
}

export async function cancionDeezer(id: string): Promise<(ResultadoMusica & { isrc: string }) | null> {
  if (!/^\d{1,12}$/.test(id)) return null;
  const r = await fetch(`https://api.deezer.com/track/${id}`, { next: { revalidate: 86400 } });
  if (!r.ok) return null;
  const t = (await r.json()) as DzTrack & { error?: unknown };
  if (t.error || !t.id) return null;
  return { ...aResultado(t), isrc: t.isrc ?? '' };
}

export type EstadoCancion = CancionDb['estado'];

export interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  pedidaPor: string;
  estado: EstadoCancion;
  creada: string;
  deezerId: string;
  isrc: string;
  portada: string;
  token: string;
  spotifyUri: string;
}

const aCancion = (c: CancionDb): Cancion => ({
  id: c.id,
  titulo: c.titulo,
  artista: c.artista,
  pedidaPor: c.pedida_por,
  estado: c.estado,
  creada: c.creada_at,
  deezerId: c.deezer_id,
  isrc: c.isrc,
  portada: c.portada,
  token: c.token,
  spotifyUri: c.spotify_uri,
});

export async function todasLasCanciones(eventoId: string): Promise<Cancion[]> {
  return (await db().cancionesDe(eventoId)).map(aCancion).sort((a, b) => b.creada.localeCompare(a.creada));
}

export function estadoPlaylist(c: Config, ahora = Date.now()) {
  const activa = c.playlist_activa.trim().toLowerCase() !== 'no';
  const hasta = new Date(c.playlist_hasta).getTime();
  const abierta = activa && (Number.isNaN(hasta) || ahora <= hasta);
  return { activa, abierta, cerrada: activa && !abierta, max: Math.min(30, Math.max(1, parseInt(c.playlist_max_por_persona, 10) || 5)) };
}

// Clave de duplicado: el ISRC identifica la grabación aunque esté en sencillo y en álbum.
const clave = (c: { isrc: string; deezerId: string }) => c.isrc || `dz${c.deezerId}`;

export type ResultadoPedir =
  | { ok: true; cancion: Cancion }
  | { ok: false; error: string; ya?: { por: string } };

export async function pedirCancion(eventoId: string, token: string, nombre: string, deezerId: string, max: number): Promise<ResultadoPedir> {
  const dz = await cancionDeezer(deezerId);
  if (!dz) return { ok: false, error: 'No encontramos esa canción.' };
  const activas = (await todasLasCanciones(eventoId)).filter((c) => c.estado !== 'rechazada');
  if (activas.filter((c) => c.token === token).length >= max) return { ok: false, error: `Ya pediste tus ${max} canciones. Puedes quitar una para cambiarla.` };
  const repetida = activas.find((c) => clave(c) === clave({ isrc: dz.isrc, deezerId }));
  if (repetida) return { ok: false, error: 'Esa canción ya está en la lista.', ya: { por: repetida.pedidaPor } };

  const fila: CancionDb = {
    id: nuevoToken(),
    evento_id: eventoId,
    token,
    titulo: dz.titulo,
    artista: dz.artista,
    pedida_por: nombre,
    estado: 'pendiente',
    creada_at: new Date().toISOString(),
    deezer_id: deezerId,
    isrc: dz.isrc,
    portada: dz.portada,
    spotify_uri: '',
  };
  await db().crearCancion(fila);
  return { ok: true, cancion: aCancion(fila) };
}

// Cambios del anfitrión o del propio invitado: siempre por id y verificando que sea del evento.
async function delEvento(eventoId: string, id: string): Promise<CancionDb | null> {
  return (await db().cancionesDe(eventoId)).find((c) => c.id === id) ?? null;
}

export async function cambiarEstado(eventoId: string, id: string, estado: EstadoCancion): Promise<boolean> {
  if (!(await delEvento(eventoId, id))) return false;
  return db().parchearCancion(id, { estado });
}

export async function quitarCancion(eventoId: string, id: string, soloDelToken?: string): Promise<boolean> {
  const c = await delEvento(eventoId, id);
  if (!c || (soloDelToken && c.token !== soloDelToken)) return false;
  return db().borrarCancion(id);
}
