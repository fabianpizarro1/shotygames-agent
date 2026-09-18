// POST /api/chat/enviar — manda un WhatsApp libre desde el panel del pedido.
//
// ⚠️ MANDA UN MENSAJE REAL A UN CLIENTE REAL, por el mismo número y el mismo
// camino que el agradecimiento automático (ver whatsapp-shotygames.ts).

import { NextRequest, NextResponse } from 'next/server';
import { enviarWhatsApp } from '@/lib/whatsapp-shotygames';

export const dynamic = 'force-dynamic';

interface Cuerpo {
  telefono?: string;
  texto?: string;
}

export async function POST(req: NextRequest) {
  const { telefono, texto } = (await req.json().catch(() => ({}))) as Cuerpo;

  if (!telefono) {
    return NextResponse.json({ ok: false, error: 'Falta el teléfono' }, { status: 400 });
  }
  const limpio = (texto ?? '').trim();
  if (!limpio) {
    return NextResponse.json({ ok: false, error: 'El mensaje está vacío' }, { status: 400 });
  }

  try {
    await enviarWhatsApp(telefono, limpio);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/chat/enviar', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error enviando el WhatsApp' },
      { status: 500 }
    );
  }
}
