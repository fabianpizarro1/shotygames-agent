import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { esAdmin } from '@/lib/admin-auth';
import { cambiarEstado, quitarCancion, todasLasCanciones, type EstadoCancion } from '@/lib/musica';

const no = () => NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
const fallo = (e: unknown, s = 500) => NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: s });

export async function GET() {
  if (!(await esAdmin())) return no();
  try {
    return NextResponse.json({ ok: true, canciones: await todasLasCanciones() });
  } catch (e) {
    return fallo(e);
  }
}

export async function PATCH(req: Request) {
  if (!(await esAdmin())) return no();
  try {
    const { id, estado } = (await req.json()) as { id: string; estado: EstadoCancion };
    if (!['pendiente', 'aprobada', 'rechazada', 'en_spotify'].includes(estado)) return fallo('Estado inválido', 400);
    const ok = await cambiarEstado(String(id), estado);
    revalidateTag('canciones', { expire: 0 });
    return ok ? NextResponse.json({ ok: true }) : fallo('Canción no encontrada', 404);
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: Request) {
  if (!(await esAdmin())) return no();
  try {
    const ok = await quitarCancion(new URL(req.url).searchParams.get('id') ?? '');
    revalidateTag('canciones', { expire: 0 });
    return ok ? NextResponse.json({ ok: true }) : fallo('Canción no encontrada', 404);
  } catch (e) {
    return fallo(e);
  }
}
