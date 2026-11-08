import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getConfig } from '@/lib/config';
import { invitadoPorToken } from '@/lib/invitados';
import { estadoPlaylist, pedirCancion } from '@/lib/musica';

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { token?: string; deezerId?: string };
  const token = String(b.token ?? '');
  const deezerId = String(b.deezerId ?? '');
  const inv = await invitadoPorToken(token);
  if (!inv) return NextResponse.json({ ok: false, error: 'Abre el enlace de tu invitación para pedir canciones.' }, { status: 403 });

  const e = estadoPlaylist(await getConfig());
  if (!e.activa) return NextResponse.json({ ok: false, error: 'Los pedidos de canciones no están habilitados.' }, { status: 403 });
  if (!e.abierta) return NextResponse.json({ ok: false, error: 'Ya se cerraron los pedidos de canciones.' }, { status: 403 });

  try {
    const r = await pedirCancion(token, inv.nombre, deezerId, e.max);
    if (r.ok) revalidateTag('canciones', { expire: 0 });
    return NextResponse.json(r, { status: r.ok ? 200 : r.ya ? 409 : 400 });
  } catch (err) {
    console.error('[musica/pedir]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar. Intenta de nuevo.' }, { status: 502 });
  }
}
