import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { db } from '@/lib/db';

type Ctx = { params: Promise<{ eventoId: string }> };
const no = () => NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

export async function GET(_req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  const fotos = (await db().fotosDe(p.evento.id)).sort((a, b) => b.creada_at.localeCompare(a.creada_at)).map((f) => ({
    id: f.id,
    creada: f.creada_at,
    autor: f.autor,
    visible: f.visible,
    miniatura: f.mini_id,
    url: `/media/${f.archivo_id}`,
    mini: `/media/${f.mini_id || f.archivo_id}`,
  }));
  return NextResponse.json({ ok: true, fotos, carpetaUrl: '' });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  const { id, visible } = (await req.json()) as { id: string; visible: boolean };
  const f = (await db().fotosDe(p.evento.id)).find((x) => x.id === id);
  if (!f) return NextResponse.json({ ok: false, error: 'Foto no encontrada' }, { status: 404 });
  await db().parchearFoto(f.id, { visible: !!visible });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const f = (await db().fotosDe(p.evento.id)).find((x) => x.id === id);
  if (!f) return NextResponse.json({ ok: false, error: 'Foto no encontrada' }, { status: 404 });
  await db().borrarFoto(f.id);
  await db().borrarArchivo(f.archivo_id);
  if (f.mini_id) await db().borrarArchivo(f.mini_id);
  return NextResponse.json({ ok: true });
}
