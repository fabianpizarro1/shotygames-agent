import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { estadoFotos } from '@/lib/fotos';
import { eventoPublico } from '@/lib/publico';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const p = await eventoPublico(q);
  if (!p) return NextResponse.json({ ok: false, error: 'Evento no disponible' }, { status: 404 });
  const e = estadoFotos(p.config);
  const u = q.get('u') ?? '';
  const subidas = e.subida === 'abierta' && /^[A-Za-z0-9-]{8,40}$/.test(u) ? (await db().fotosDe(p.evento.id)).filter((f) => f.uploader === u).length : 0;
  return NextResponse.json({ ok: true, subida: e.subida, galeriaAbierta: e.galeriaAbierta, max: e.maxPorPersona, subidas });
}
