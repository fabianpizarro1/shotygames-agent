import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { estadoFotos } from '@/lib/fotos';
import { eventoPublico } from '@/lib/publico';

// La galería no existe para el público hasta la hora configurada: antes de eso no se devuelve ni una URL.
export async function GET(req: Request) {
  const p = await eventoPublico(new URL(req.url).searchParams);
  if (!p) return NextResponse.json({ ok: false, error: 'Evento no disponible' }, { status: 404 });
  if (!estadoFotos(p.config).galeriaAbierta) return NextResponse.json({ ok: true, abierta: false, fotos: [] });
  const fotos = (await db().fotosDe(p.evento.id))
    .filter((f) => f.visible)
    .sort((a, b) => b.creada_at.localeCompare(a.creada_at))
    .slice(0, 800)
    .map((f) => ({ id: f.id, url: `/media/${f.archivo_id}`, mini: `/media/${f.mini_id || f.archivo_id}`, autor: f.autor, creada: f.creada_at }));
  return NextResponse.json({ ok: true, abierta: true, fotos });
}
