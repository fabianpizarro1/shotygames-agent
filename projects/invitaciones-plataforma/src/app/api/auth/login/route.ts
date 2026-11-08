import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_SESION, crearSesion, ingresar } from '@/lib/auth';

// Freno básico por IP (por instancia): frena adivinar contraseñas a golpes.
const golpes = new Map<string, number[]>();
function demasiado(ip: string): boolean {
  const ahora = Date.now();
  const r = (golpes.get(ip) ?? []).filter((t) => ahora - t < 60_000);
  r.push(ahora);
  golpes.set(ip, r);
  return r.length > 10;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'x';
  if (demasiado(ip)) return NextResponse.json({ ok: false, error: 'Demasiados intentos, espera un minuto.' }, { status: 429 });
  try {
    const { email, clave } = (await req.json()) as { email?: string; clave?: string };
    const u = await ingresar(String(email ?? ''), String(clave ?? ''));
    (await cookies()).set(COOKIE_SESION, await crearSesion(u.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 30 * 24 * 3600 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 401 });
  }
}
