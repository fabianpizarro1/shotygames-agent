import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { confirmarAsistencia, type Estado } from '@/lib/invitados';

// Freno básico por IP (por instancia): evita que alguien llene el Sheet a golpes.
const golpes = new Map<string, number[]>();
function demasiado(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (golpes.get(ip) ?? []).filter((t) => ahora - t < 60_000);
  recientes.push(ahora);
  golpes.set(ip, recientes);
  return recientes.length > 12;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'x';
  if (demasiado(ip)) return NextResponse.json({ ok: false, error: 'Demasiados intentos, espera un minuto.' }, { status: 429 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  }

  const token = String(b.token ?? '');
  const estado = b.estado as Estado;
  if (!/^[A-Za-z0-9]{6,32}$/.test(token) || (estado !== 'confirmado' && estado !== 'no_asiste')) {
    return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    const inv = await confirmarAsistencia(token, {
      estado,
      asistentes: Number(b.asistentes) || 1,
      restricciones: String(b.restricciones ?? '').trim(),
      mensaje: String(b.mensaje ?? '').trim(),
    });
    if (!inv) return NextResponse.json({ ok: false, error: 'Invitación no encontrada' }, { status: 404 });
    revalidateTag('invitados', { expire: 0 });
    return NextResponse.json({ ok: true, estado: inv.estado, asistentes: inv.asistentes });
  } catch (e) {
    console.error('[rsvp]', e);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar. Intenta de nuevo.' }, { status: 500 });
  }
}
