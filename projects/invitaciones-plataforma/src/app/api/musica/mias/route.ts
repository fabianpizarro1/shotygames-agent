import { NextResponse } from 'next/server';
import { estadoPlaylist, todasLasCanciones } from '@/lib/musica';
import { eventoPublico } from '@/lib/publico';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const p = await eventoPublico(q);
  if (!p || !p.token) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  const e = estadoPlaylist(p.config);
  const todas = (await todasLasCanciones(p.evento.id)).filter((c) => c.estado !== 'rechazada');
  return NextResponse.json({
    ok: true,
    max: e.max,
    abierta: e.abierta,
    activa: e.activa,
    total: todas.length,
    mias: todas.filter((c) => c.token === p.token).map((c) => ({ id: c.id, titulo: c.titulo, artista: c.artista, portada: c.portada, estado: c.estado })),
    // Para que nadie pida una repetida y todos vean que la lista es de todos.
    lista: todas.slice(0, 300).map((c) => ({ id: c.id, titulo: c.titulo, artista: c.artista, portada: c.portada, por: c.pedidaPor.split(' ')[0] })),
  });
}
