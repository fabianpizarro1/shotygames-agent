import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { esAdmin } from '@/lib/admin-auth';
import { actualizarInvitado, borrarInvitado, crearInvitado, listarInvitados } from '@/lib/invitados-admin';

const no = () => NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
const fallo = (e: unknown, status = 500) =>
  NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status });
const refrescar = () => revalidateTag('invitados', { expire: 0 });

export async function GET() {
  if (!(await esAdmin())) return no();
  try {
    return NextResponse.json({ ok: true, invitados: await listarInvitados() });
  } catch (e) {
    return fallo(e);
  }
}

export async function POST(req: Request) {
  if (!(await esAdmin())) return no();
  try {
    const token = await crearInvitado(await req.json());
    refrescar();
    return NextResponse.json({ ok: true, token });
  } catch (e) {
    return fallo(e, 400);
  }
}

export async function PATCH(req: Request) {
  if (!(await esAdmin())) return no();
  try {
    const { token, ...cambios } = (await req.json()) as { token: string } & Record<string, unknown>;
    const ok = await actualizarInvitado(String(token), cambios);
    refrescar();
    return ok ? NextResponse.json({ ok: true }) : fallo('Invitado no encontrado', 404);
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: Request) {
  if (!(await esAdmin())) return no();
  try {
    const token = new URL(req.url).searchParams.get('token') ?? '';
    const ok = await borrarInvitado(token);
    refrescar();
    return ok ? NextResponse.json({ ok: true }) : fallo('Invitado no encontrado', 404);
  } catch (e) {
    return fallo(e);
  }
}
