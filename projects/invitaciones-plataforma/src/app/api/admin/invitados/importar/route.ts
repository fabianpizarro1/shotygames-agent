import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { esAdmin } from '@/lib/admin-auth';
import { importarInvitados } from '@/lib/invitados-admin';

export async function POST(req: Request) {
  if (!(await esAdmin())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    const { texto } = (await req.json()) as { texto?: string };
    const r = await importarInvitados(String(texto ?? ''));
    revalidateTag('invitados', { expire: 0 });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
