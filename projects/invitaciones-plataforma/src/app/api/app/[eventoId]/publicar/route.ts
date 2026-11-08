import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { despublicarEvento, publicarEvento } from '@/lib/eventos';

// Publicar / despublicar. El cobro (PayPhone) se conecta después: por ahora publicar es gratis.
export async function POST(req: Request, { params }: { params: Promise<{ eventoId: string }> }) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const { accion, plan } = (await req.json()) as { accion?: string; plan?: string };
  const e = accion === 'despublicar' ? await despublicarEvento(p.evento.id) : await publicarEvento(p.evento.id, plan === 'completo' ? 'completo' : 'basico');
  return NextResponse.json({ ok: true, estado: e?.estado, plan: e?.plan, expira_at: e?.expira_at });
}
