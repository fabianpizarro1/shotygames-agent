// GET /api/recuperacion — los pedidos web que nunca se convirtieron en venta.
//
// Es la otra mitad de la operación: `/api/pedidos` mira lo que ya está viajando,
// esto mira la plata que se quedó en el checkout. Lee "PEDIDOS LOVABLE" y cruza
// solo lo imprescindible con la hoja oficial — ver `recuperacion.ts`.

import { NextRequest, NextResponse } from 'next/server';
import { construirLista } from '@/lib/recuperacion';
import { VENTANA_DIAS } from '@/lib/recuperacion-tipos';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const crudo = Number(new URL(req.url).searchParams.get('dias'));
    // Se acota a mano: un `dias` gigante hace leer y clasificar la hoja entera
    // para mostrar carritos de marzo que ya no se recuperan.
    const ventana =
      Number.isFinite(crudo) && crudo > 0 ? Math.min(Math.round(crudo), 365) : VENTANA_DIAS;

    const lista = await construirLista(ventana);
    return NextResponse.json({ ok: true, ...lista });
  } catch (e) {
    console.error('GET /api/recuperacion', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'No se pudo leer la hoja web' },
      { status: 500 }
    );
  }
}
