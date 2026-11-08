// Next.js 16 usa `proxy.ts` donde antes iba `middleware.ts`.
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_SESION, usuarioIdDeCookie } from '@/lib/auth';

// Protege el panel (/app) y su API. La firma de la cookie se comprueba aquí; que el evento sea del
// usuario se comprueba en cada ruta. La invitación pública (/i, /e) y /api/rsvp quedan abiertas.
export async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);
  if (!(await usuarioIdDeCookie(request.cookies.get(COOKIE_SESION)?.value))) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    const url = new URL('/login', request.url);
    url.searchParams.set('siguiente', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*', '/api/app/:path*'] };
