import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { quitarCancion } from '@/lib/musica';

// Un invitado solo puede quitar sus propias canciones (se exige el token con el que la pidió).
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { token?: string; id?: string };
  const token = String(b.token ?? '');
  const id = String(b.id ?? '');
  if (!/^[A-Za-z0-9]{6,32}$/.test(token) || !/^[A-Za-z0-9]{6,32}$/.test(id)) return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  try {
    const ok = await quitarCancion(id, token);
    revalidateTag('canciones', { expire: 0 });
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: 'Canción no encontrada' }, { status: 404 });
  } catch (err) {
    console.error('[musica/quitar]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo quitar' }, { status: 502 });
  }
}
