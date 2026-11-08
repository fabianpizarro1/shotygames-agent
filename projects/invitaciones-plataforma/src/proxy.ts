// Next.js 16 usa `proxy.ts` donde antes iba `middleware.ts`.
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, sesionValida } from '@/lib/admin-auth';

// Protege el dashboard y su API. La invitación (/i/*), /media/* y /api/rsvp son públicos.
export async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const esLogin = pathname === '/admin/login' || pathname === '/api/admin/login';
  if (esLogin) return NextResponse.next();

  if (!(await sesionValida(request.cookies.get(COOKIE)?.value))) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
