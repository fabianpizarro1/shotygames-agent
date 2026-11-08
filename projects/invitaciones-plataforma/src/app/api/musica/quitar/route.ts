import { NextResponse } from 'next/server';
import { quitarCancion } from '@/lib/musica';
import { eventoPublico } from '@/lib/publico';

// Un invitado solo puede quitar sus propias canciones (se exige el token con el que la pidió).
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { token?: string; id?: string };
  const token = String(b.token ?? '');
  const id = String(b.id ?? '');
  const p = await eventoPublico(new URLSearchParams({ t: token }));
  if (!p || !/^[A-Za-z0-9]{6,32}$/.test(id)) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  const ok = await quitarCancion(p.evento.id, id, token);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: 'Canción no encontrada' }, { status: 404 });
}
