// Login por contraseña única — es tu rutina y tus tareas personales, no
// puede quedar abierta en internet.

import { NextRequest, NextResponse } from 'next/server';
import { tokenSesion } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };

  const correcta = process.env.APP_PASSWORD;
  if (!correcta) {
    return NextResponse.json({ ok: false, error: 'APP_PASSWORD no configurado' }, { status: 500 });
  }
  if (password !== correcta) {
    return NextResponse.json({ ok: false, error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth', await tokenSesion(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('auth');
  return res;
}
