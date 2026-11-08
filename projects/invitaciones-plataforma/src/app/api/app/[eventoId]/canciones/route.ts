import { NextResponse } from 'next/server';
import { eventoDelUsuario } from '@/lib/auth';
import { cambiarEstado, quitarCancion, todasLasCanciones, type EstadoCancion } from '@/lib/musica';

type Ctx = { params: Promise<{ eventoId: string }> };
const no = () => NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
const fallo = (e: unknown, s = 500) => NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: s });

export async function GET(_req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  return NextResponse.json({ ok: true, canciones: await todasLasCanciones(p.evento.id) });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  const { id, estado } = (await req.json()) as { id: string; estado: EstadoCancion };
  if (!['pendiente', 'aprobada', 'rechazada', 'en_spotify'].includes(estado)) return fallo('Estado inválido', 400);
  return (await cambiarEstado(p.evento.id, String(id), estado)) ? NextResponse.json({ ok: true }) : fallo('Canción no encontrada', 404);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const p = await eventoDelUsuario((await params).eventoId);
  if (!p) return no();
  return (await quitarCancion(p.evento.id, new URL(req.url).searchParams.get('id') ?? '')) ? NextResponse.json({ ok: true }) : fallo('Canción no encontrada', 404);
}
