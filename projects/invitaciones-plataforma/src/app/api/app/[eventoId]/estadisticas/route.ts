import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { estadisticasDe } from '@/lib/eventos';

export async function GET(_req: Request, { params }: { params: Promise<{ eventoId: string }> }) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await estadisticasDe(p.evento.id)) });
}
