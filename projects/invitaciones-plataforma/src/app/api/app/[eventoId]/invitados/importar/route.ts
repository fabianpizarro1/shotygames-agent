import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { importarInvitados } from '@/lib/invitados-admin';

export async function POST(req: Request, { params }: { params: Promise<{ eventoId: string }> }) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    const { texto } = (await req.json()) as { texto?: string };
    return NextResponse.json({ ok: true, ...(await importarInvitados(p.evento.id, String(texto ?? ''))) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
