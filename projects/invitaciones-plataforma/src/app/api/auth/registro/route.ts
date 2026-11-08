import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_SESION, crearSesion, registrar } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, clave, nombre } = (await req.json()) as { email?: string; clave?: string; nombre?: string };
    const u = await registrar(String(email ?? ''), String(clave ?? ''), String(nombre ?? ''));
    (await cookies()).set(COOKIE_SESION, await crearSesion(u.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 30 * 24 * 3600 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
