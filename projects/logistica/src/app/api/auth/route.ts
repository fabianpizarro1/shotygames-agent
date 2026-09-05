// Login por contraseña única. La app expone direcciones y teléfonos de
// clientes reales, así que no puede quedar abierta en internet.

import { NextRequest, NextResponse } from 'next/server';

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
  res.cookies.set('auth', 'ok', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
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
