// GET /api/chat/media?canalWa=...&id=... — el archivo real (imagen, audio,
// video, documento o sticker) de un mensaje puntual del chat. Se usa como
// `src` directo de <img>/<audio>/<video>, protegido por la misma cookie de
// sesión que el resto de la app (ver proxy.ts).

import { NextRequest, NextResponse } from 'next/server';
import { obtenerMedia } from '@/lib/whatsapp-chat';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') ?? '';
  const canalWa = url.searchParams.get('canalWa') ?? '';
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Falta el id del mensaje' }, { status: 400 });
  }

  try {
    const media = await obtenerMedia(canalWa, id);
    if (!media) {
      return NextResponse.json({ ok: false, error: 'No se pudo obtener el archivo' }, { status: 404 });
    }
    return new NextResponse(Buffer.from(media.base64, 'base64'), {
      headers: {
        'Content-Type': media.mimetype,
        // El contenido de un mensaje ya enviado no cambia — cachear fuerte
        // evita volver a pedirle el archivo a Evolution en cada re-render.
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error('GET /api/chat/media', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error obteniendo el archivo' },
      { status: 500 }
    );
  }
}
