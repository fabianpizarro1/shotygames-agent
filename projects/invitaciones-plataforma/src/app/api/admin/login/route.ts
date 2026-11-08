import { NextResponse } from 'next/server';
import { COOKIE, DURACION_MS, crearSesion, passwordCorrecta } from '@/lib/admin-auth';

const intentos = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'x';
  const ahora = Date.now();
  const recientes = (intentos.get(ip) ?? []).filter((t) => ahora - t < 10 * 60_000);
  if (recientes.length >= 8) return NextResponse.json({ ok: false, error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });
  recientes.push(ahora);
  intentos.set(ip, recientes);

  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !passwordCorrecta(password)) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ ok: false, error: 'Clave incorrecta' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await crearSesion(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_MS / 1000,
  });
  return res;
}
