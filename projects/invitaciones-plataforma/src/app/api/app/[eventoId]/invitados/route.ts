import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { actualizarInvitado, borrarInvitado, crearInvitado, listarInvitados } from '@/lib/invitados-admin';

type Ctx = { params: Promise<{ eventoId: string }> };
const no = () => NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
const fallo = (e: unknown, status = 500) => NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status });

export async function GET(_req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  return NextResponse.json({ ok: true, invitados: await listarInvitados(p.evento.id) });
}

export async function POST(req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  try {
    return NextResponse.json({ ok: true, token: await crearInvitado(p.evento.id, await req.json()) });
  } catch (e) {
    return fallo(e, 400);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  try {
    const { token, ...cambios } = (await req.json()) as { token: string } & Record<string, unknown>;
    return (await actualizarInvitado(p.evento.id, String(token), cambios)) ? NextResponse.json({ ok: true }) : fallo('Invitado no encontrado', 404);
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  try {
    const token = new URL(req.url).searchParams.get('token') ?? '';
    return (await borrarInvitado(p.evento.id, token)) ? NextResponse.json({ ok: true }) : fallo('Invitado no encontrado', 404);
  } catch (e) {
    return fallo(e);
  }
}
