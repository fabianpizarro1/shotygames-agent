// GET /api/pedidos — la cola de todo lo que está en movimiento, en los tres
// negocios: Truquito, Avanora y ShotyGames.
//
// La construcción de la cola vive en `src/lib/cola.ts` porque el cron de avisos
// tiene que mirar exactamente lo mismo que ve Fabián en pantalla.

import { NextResponse } from 'next/server';
import { construirCola } from '@/lib/cola';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const cola = await construirCola();

  // Solo se rompe del todo si no se pudo leer NINGUNO.
  if (!cola.pedidos.length && cola.fallos.length) {
    return NextResponse.json({ ok: false, error: cola.fallos.join(' · ') }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...cola });
}
