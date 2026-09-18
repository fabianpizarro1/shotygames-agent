// GET /api/chat?telefono=... — el hilo de WhatsApp de un cliente. Protegido
// por la cookie de sesión, como el resto de la app (ver proxy.ts).

import { NextRequest, NextResponse } from 'next/server';
import { obtenerHilo } from '@/lib/whatsapp-chat';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // `new URL(req.url)` en vez de `req.nextUrl`: Turbopack tiene un bug con
  // NextURL (ver proxy.ts).
  const telefono = new URL(req.url).searchParams.get('telefono') ?? '';
  if (!telefono) {
    return NextResponse.json({ ok: false, error: 'Falta el teléfono' }, { status: 400 });
  }

  try {
    const mensajes = await obtenerHilo(telefono);
    return NextResponse.json({ ok: true, mensajes });
  } catch (e) {
    console.error('GET /api/chat', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error leyendo el chat' },
      { status: 500 }
    );
  }
}
