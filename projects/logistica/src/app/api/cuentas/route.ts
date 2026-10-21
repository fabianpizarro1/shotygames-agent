// GET /api/cuentas — las cuentas válidas para registrar un cobro (hoja DATOS de
// ShotyGames, la misma lista que usa el CRM). Protegido por la cookie de sesión.

import { NextResponse } from 'next/server';
import { leerCuentas } from '@/lib/sheet-shotygames';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ ok: true, cuentas: await leerCuentas() });
  } catch (e) {
    console.error('GET /api/cuentas', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'No se pudieron leer las cuentas' },
      { status: 500 }
    );
  }
}
