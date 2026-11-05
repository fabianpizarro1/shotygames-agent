import { NextResponse } from 'next/server';
import { marcarAbierto } from '@/lib/invitados';

// Se llama una sola vez por sesión desde la invitación; solo escribe si abierto_at está vacío.
export async function POST(req: Request) {
  try {
    const { token } = (await req.json()) as { token?: string };
    if (token && /^[A-Za-z0-9]{6,32}$/.test(token)) await marcarAbierto(token);
  } catch (e) {
    console.error('[abierto]', e);
  }
  return NextResponse.json({ ok: true });
}
