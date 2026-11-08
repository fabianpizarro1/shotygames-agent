import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { camposDeEvento, guardarConfigEvento } from '@/lib/config';

type Ctx = { params: Promise<{ eventoId: string }> };
const no = () => NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

export async function GET(_req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  return NextResponse.json({ ok: true, campos: camposDeEvento(p.evento), slug: p.evento.slug, estado: p.evento.estado, plan: p.evento.plan, expira_at: p.evento.expira_at });
}

export async function PUT(req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  try {
    const n = await guardarConfigEvento(p.evento.id, (await req.json()) as Record<string, string>);
    return NextResponse.json({ ok: true, guardados: n });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
