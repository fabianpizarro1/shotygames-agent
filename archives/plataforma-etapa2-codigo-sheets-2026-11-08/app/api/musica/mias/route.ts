import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getConfig } from '@/lib/config';
import { estadoPlaylist, todasLasCanciones } from '@/lib/musica';

const cacheadas = unstable_cache(todasLasCanciones, ['canciones'], { tags: ['canciones'], revalidate: 10 });

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('t') ?? '';
  if (!/^[A-Za-z0-9]{6,32}$/.test(token)) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  try {
    const e = estadoPlaylist(await getConfig());
    const todas = (await cacheadas()).filter((c) => c.estado !== 'rechazada');
    return NextResponse.json({
      ok: true,
      max: e.max,
      abierta: e.abierta,
      activa: e.activa,
      total: todas.length,
      mias: todas.filter((c) => c.token === token).map((c) => ({ id: c.id, titulo: c.titulo, artista: c.artista, portada: c.portada, estado: c.estado })),
      // Para que nadie pida una repetida y todos vean que la lista es de todos.
      lista: todas.slice(0, 300).map((c) => ({ id: c.id, titulo: c.titulo, artista: c.artista, portada: c.portada, por: c.pedidaPor.split(' ')[0] })),
    });
  } catch (err) {
    console.error('[musica/mias]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo cargar la lista' }, { status: 502 });
  }
}
