import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { esAdmin } from '@/lib/admin-auth';
import { configCompleta, guardarConfig } from '@/lib/config';

export async function GET() {
  if (!(await esAdmin())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, campos: await configCompleta() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await esAdmin())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    const cambios = (await req.json()) as Record<string, string>;
    const n = await guardarConfig(cambios);
    revalidateTag('config', { expire: 0 });
    return NextResponse.json({ ok: true, guardados: n });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
