import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { esAdmin } from '@/lib/admin-auth';
import { carpeta, listarFotos, ponerVisible, quitarFoto } from '@/lib/drive';

const no = () => NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
const fallo = (e: unknown) => NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 });

export async function GET() {
  if (!(await esAdmin())) return no();
  try {
    const fotos = (await listarFotos()).map((f) => ({ ...f, url: `/media/${f.id}`, mini: `/media/${f.miniatura || f.id}` }));
    return NextResponse.json({ ok: true, fotos, carpetaUrl: `https://drive.google.com/drive/folders/${carpeta()}` });
  } catch (e) {
    return fallo(e);
  }
}

export async function PATCH(req: Request) {
  if (!(await esAdmin())) return no();
  try {
    const { id, visible } = (await req.json()) as { id: string; visible: boolean };
    await ponerVisible(id, !!visible);
    revalidateTag('fotos', { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: Request) {
  if (!(await esAdmin())) return no();
  try {
    const id = new URL(req.url).searchParams.get('id') ?? '';
    const f = (await listarFotos()).find((x) => x.id === id);
    if (!f) return NextResponse.json({ ok: false, error: 'Foto no encontrada' }, { status: 404 });
    await quitarFoto(f.id, f.miniatura);
    revalidateTag('fotos', { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
