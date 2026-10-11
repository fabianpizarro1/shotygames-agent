// Next.js 16 usa `proxy.ts` donde antes iba `middleware.ts`.

import { NextRequest, NextResponse } from 'next/server';
import { tokenSesion } from './lib/auth';

// El manifest tiene que poder leerse sin sesión: iOS lo pide al agregar la
// app a la pantalla de inicio y no lleva nada sensible.
// /api/cron (CRON_SECRET) y /api/interno (bot de Telegram, tokenInterno) se
// protegen con su propia clave: quien las llama no tiene la cookie.
const PUBLICAS = ['/login', '/api/auth', '/manifest.webmanifest', '/api/cron/', '/api/interno/'];

export async function proxy(request: NextRequest) {
  // `request.url` en vez de `request.nextUrl`: Turbopack tiene un bug con NextURL.
  const { pathname } = new URL(request.url);

  // Los archivos de `public/` se sirven en la raíz, así que hay que excluirlos
  // acá dentro — en el matcher no alcanza.
  if (/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|eot)$/i.test(pathname)) {
    return NextResponse.next();
  }

  if (PUBLICAS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookie = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('auth='));

  if (cookie?.slice('auth='.length) !== (await tokenSesion())) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|eot)).*)',
  ],
};
