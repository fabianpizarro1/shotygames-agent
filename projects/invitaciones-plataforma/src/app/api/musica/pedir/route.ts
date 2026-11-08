import { NextResponse } from 'next/server';
import { estadoPlaylist, pedirCancion } from '@/lib/musica';
import { eventoPublico } from '@/lib/publico';
import { invitadoPorToken } from '@/lib/invitados';

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { token?: string; deezerId?: string };
  const token = String(b.token ?? '');
  const p = await eventoPublico(new URLSearchParams({ t: token }));
  const inv = p ? await invitadoPorToken(token) : null;
  if (!p || !inv) return NextResponse.json({ ok: false, error: 'Abre el enlace de tu invitación para pedir canciones.' }, { status: 403 });

  const e = estadoPlaylist(p.config);
  if (!e.activa) return NextResponse.json({ ok: false, error: 'Los pedidos de canciones no están habilitados.' }, { status: 403 });
  if (!e.abierta) return NextResponse.json({ ok: false, error: 'Ya se cerraron los pedidos de canciones.' }, { status: 403 });
  // Con la regla activada, solo quien confirmó asistencia puede pedir (el servidor la hace cumplir, no solo la pantalla).
  if (p.config.extras_solo_confirmados.trim().toLowerCase() !== 'no' && inv.estado !== 'confirmado') {
    return NextResponse.json({ ok: false, error: 'Confirma tu asistencia para pedir canciones.' }, { status: 403 });
  }
  try {
    const r = await pedirCancion(p.evento.id, token, inv.nombre, String(b.deezerId ?? ''), e.max);
    return NextResponse.json(r, { status: r.ok ? 200 : r.ya ? 409 : 400 });
  } catch (err) {
    console.error('[musica/pedir]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar. Intenta de nuevo.' }, { status: 502 });
  }
}
